import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSampleAdapter } from "./base.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(currentDir, "../fixtures/xiaohongshu-notes.json");

function parseFeedUrls(input) {
  return String(input ?? "")
    .split(/[,\r\n]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

async function readResource(resource) {
  if (/^https?:\/\//i.test(resource)) {
    const response = await fetch(resource, {
      headers: {
        "User-Agent": "Stage-AI-Radar/0.1"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Xiaohongshu feed ${resource}: ${response.status}`);
    }

    return {
      text: await response.text(),
      sourceLabel: resource
    };
  }

  const filePath = resource.startsWith("file://") ? fileURLToPath(resource) : resource;
  return {
    text: await readFile(filePath, "utf8"),
    sourceLabel: path.basename(filePath)
  };
}

function parseJsonOrNdjson(input) {
  const trimmed = String(input ?? "").trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (Array.isArray(parsed.items)) {
      return parsed.items;
    }
    if (Array.isArray(parsed.notes)) {
      return parsed.notes;
    }
    if (Array.isArray(parsed.data)) {
      return parsed.data;
    }
    return [parsed];
  } catch {
    return trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }
}

function cleanText(input = "") {
  return String(input).replace(/\s+/g, " ").trim();
}

function parseTags(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cleanText(item)).filter(Boolean);
  }

  return String(value ?? "")
    .split(/[,#，、\s]+/)
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function inferCategory(text) {
  const input = text.toLowerCase();
  if (/(concert|orchestra|choir|music|livehouse|音乐会|乐团|合唱|音乐现场)/i.test(input)) {
    return "音乐会";
  }
  if (/(exhibition|museum|gallery|installation|展览|美术馆|画廊|装置)/i.test(input)) {
    return "展览";
  }
  if (/(immersive|interactive|walkthrough|site-specific|沉浸|互动|行进式|体验剧场)/i.test(input)) {
    return "沉浸式演出";
  }
  if (/(performance art|multimedia|cross-disciplinary|行为艺术|跨媒介|跨学科)/i.test(input)) {
    return "跨界展演";
  }
  return "戏剧";
}

function inferAiSignals(text, tags = []) {
  const input = `${text} ${tags.join(" ")}`.toLowerCase();
  const dictionary = [
    ["ai", "AI"],
    ["人工智能", "AI"],
    ["aigc", "generative content"],
    ["生成", "generative visuals"],
    ["大模型", "LLM dramaturgy"],
    ["llm", "LLM dramaturgy"],
    ["语音", "AI voice"],
    ["配音", "AI voice"],
    ["voice", "AI voice"],
    ["字幕", "subtitle engine"],
    ["翻译", "subtitle engine"],
    ["projection", "generative projection"],
    ["投影", "generative projection"],
    ["视觉", "generative visuals"],
    ["数字人", "digital avatar"],
    ["avatar", "digital avatar"],
    ["互动", "audience interaction"],
    ["interactive", "audience interaction"],
    ["灯光", "adaptive lighting"],
    ["lighting", "adaptive lighting"],
    ["sound", "adaptive sound"],
    ["声场", "adaptive sound"],
    ["音乐生成", "adaptive sound"]
  ];

  const hits = [];
  for (const [keyword, label] of dictionary) {
    if (input.includes(keyword.toLowerCase()) && !hits.includes(label)) {
      hits.push(label);
    }
  }

  return hits.length ? hits : ["xiaohongshu-note-ingestion"];
}

function parseDate(value) {
  const candidate = String(value ?? "").trim();
  if (!candidate) {
    return new Date().toISOString();
  }

  const date = new Date(candidate);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function minutesAgoFromDate(value) {
  const delta = Date.now() - new Date(value).getTime();
  return Math.max(1, Math.round(delta / 60000));
}

function guessPerformanceTitle(note) {
  const candidates = [
    note.performanceTitle,
    note.performance_title,
    note.showTitle,
    note.show_title,
    note.eventTitle,
    note.event_title,
    note.title
  ]
    .map((item) => cleanText(item))
    .filter(Boolean);

  if (candidates.length) {
    return candidates[0];
  }

  const text = cleanText(note.content ?? note.description ?? note.desc ?? "");
  return text.slice(0, 40) || "Untitled Xiaohongshu Signal";
}

function normaliseNote(note, sourceLabel) {
  const tags = parseTags(note.tags ?? note.hashtags ?? note.topics);
  const title = cleanText(note.title ?? guessPerformanceTitle(note));
  const body = cleanText(note.content ?? note.description ?? note.desc ?? note.text ?? "");
  const combinedText = [title, body, tags.map((tag) => `#${tag}`).join(" ")].filter(Boolean).join(". ");
  const collectedAt = parseDate(note.publishedAt ?? note.published_at ?? note.createdAt ?? note.create_time ?? note.time);

  return {
    externalId: cleanText(note.noteId ?? note.note_id ?? note.id ?? note.url ?? title),
    performanceTitle: guessPerformanceTitle(note),
    title,
    category: inferCategory(combinedText),
    region: cleanText(note.region) || "亚太",
    country: cleanText(note.country) || "中国",
    city: cleanText(note.city ?? note.location ?? note.locationName) || "待补充",
    venue: cleanText(note.venue ?? note.venueName) || `小红书 / ${sourceLabel}`,
    language: cleanText(note.language) || "zh",
    text: combinedText || "Xiaohongshu note with no text body.",
    aiSignals: inferAiSignals(combinedText, tags),
    collectedAt,
    updatedMinutesAgo: minutesAgoFromDate(collectedAt)
  };
}

async function collectLiveXiaohongshu({ limit, options, env }) {
  const feedUrls = parseFeedUrls(options.feedUrl ?? options.feedUrls ?? env.XHS_FEED_URL);
  if (!feedUrls.length) {
    return {
      reviews: [],
      warnings: [
        "XHS_FEED_URL is empty. Provide a JSON/NDJSON export, partner feed URL, or local fixture path for Xiaohongshu notes."
      ]
    };
  }

  const reviews = [];
  const warnings = [];

  for (const resource of feedUrls) {
    try {
      const { text, sourceLabel } = await readResource(resource);
      const notes = parseJsonOrNdjson(text);
      for (const note of notes.slice(0, limit)) {
        reviews.push(normaliseNote(note, sourceLabel));
      }
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : `Failed to read Xiaohongshu feed ${resource}`);
    }
  }

  return {
    reviews: reviews.slice(0, limit),
    warnings
  };
}

export const xiaohongshuAdapter = createSampleAdapter({
  id: "xiaohongshu",
  label: "Xiaohongshu",
  auth: "Partner Feed / Export",
  coverage: "中文口碑、观演笔记与城市现场讨论",
  notes:
    "小红书官方公开开放平台目前更偏商家与电商能力，这里采用合规的 JSON 导出 / 合作方 feed 接入路径，适合接观众观后感、现场打卡与 AI 话题笔记。",
  envVars: ["XHS_FEED_URL"],
  collectLive: collectLiveXiaohongshu,
  sampleReviews: [
    {
      performanceTitle: "机械月亮档案馆",
      title: "看完《机械月亮档案馆》，AI 不是噱头是真的进叙事了",
      category: "沉浸式演出",
      region: "亚太",
      country: "中国",
      city: "上海",
      venue: "西岸穹顶剧场",
      language: "zh",
      text: "演员和实时生成字幕、语音代理配合得很自然，后半段互动分支甚至比我预期更完整。",
      aiSignals: ["AI voice", "subtitle engine", "audience interaction"],
      updatedMinutesAgo: 6
    },
    {
      performanceTitle: "云端乐池计划",
      title: "这场 AI 音乐会视觉太强，但情绪起伏还有点机械",
      category: "音乐会",
      region: "亚太",
      country: "中国",
      city: "深圳",
      venue: "海上世界文化艺术中心",
      language: "zh",
      text: "生成式视觉和灯光非常高级，不过人声合成段落还是有一点冷感，现场讨论度挺高。",
      aiSignals: ["generative visuals", "adaptive lighting", "AI voice"],
      updatedMinutesAgo: 14
    }
  ]
});

export const xiaohongshuFeedFixturePath = fixturePath;
