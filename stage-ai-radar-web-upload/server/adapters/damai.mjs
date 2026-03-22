import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSampleAdapter } from "./base.mjs";
import { cleanText, inferAiSignals, minutesAgoFromDate, parseDate, parseFeedUrls, parseJsonOrNdjson, readFeedResource } from "./feed-json.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(currentDir, "../fixtures/damai-shows.json");

function inferCategory(text) {
  const input = String(text ?? "").toLowerCase();
  if (/(沉浸|immersive|walkthrough|互动)/i.test(input)) {
    return "沉浸式演出";
  }
  if (/(展览|museum|gallery|installation)/i.test(input)) {
    return "展览";
  }
  if (/(音乐会|concert|orchestra|livehouse)/i.test(input)) {
    return "音乐会";
  }
  if (/(跨界|multimedia|performance art)/i.test(input)) {
    return "跨界展演";
  }
  return "戏剧";
}

function toPerformanceText(item) {
  return [
    cleanText(item.title ?? item.showTitle ?? item.show_name),
    cleanText(item.subtitle ?? item.summary ?? item.description),
    cleanText(item.aiMode ?? item.ai_mode),
    cleanText(Array.isArray(item.tags) ? item.tags.join(" ") : item.tags)
  ]
    .filter(Boolean)
    .join(". ");
}

function normaliseDamaiItem(item, sourceLabel) {
  const text = toPerformanceText(item);
  const collectedAt = parseDate(item.startDate ?? item.showTime ?? item.performAt ?? item.date);
  const aiSignals =
    inferAiSignals(text, [
      ["ai", "AI"],
      ["aigc", "generative content"],
      ["数字人", "digital avatar"],
      ["语音", "AI voice"],
      ["实时字幕", "subtitle engine"],
      ["投影", "generative projection"],
      ["交互", "audience interaction"],
      ["生成", "generative visuals"],
      ["大模型", "LLM dramaturgy"],
      ["算法", "algorithmic staging"]
    ]) || [];

  return {
    externalId: cleanText(item.showId ?? item.id ?? item.link ?? item.title),
    performanceTitle: cleanText(item.title ?? item.showTitle ?? item.show_name) || "Untitled Damai Signal",
    title: cleanText(item.title ?? item.showTitle ?? item.show_name) || "Untitled Damai Signal",
    category: inferCategory(text),
    region: cleanText(item.region) || "亚太",
    country: cleanText(item.country) || "中国",
    city: cleanText(item.city ?? item.cityName) || "待补充",
    venue: cleanText(item.venue ?? item.venueName) || `大麦 / ${sourceLabel}`,
    language: cleanText(item.language) || "zh",
    text: text || "Damai show export item with no description.",
    aiSignals: aiSignals.length ? aiSignals : ["case-discovery"],
    collectedAt,
    updatedMinutesAgo: minutesAgoFromDate(collectedAt)
  };
}

async function collectLiveDamai({ limit, options, env }) {
  const feedUrls = parseFeedUrls(options.feedUrl ?? options.feedUrls ?? env.DAMAI_FEED_URL);
  if (!feedUrls.length) {
    return {
      reviews: [],
      warnings: ["DAMAI_FEED_URL is empty. Provide a local JSON export or partner feed for Damai listings."]
    };
  }

  const reviews = [];
  const warnings = [];

  for (const resource of feedUrls) {
    try {
      const { text, sourceLabel } = await readFeedResource(resource);
      const items = parseJsonOrNdjson(text);
      for (const item of items.slice(0, limit)) {
        reviews.push(normaliseDamaiItem(item, sourceLabel));
      }
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : `Failed to read Damai feed ${resource}`);
    }
  }

  return {
    reviews: reviews.slice(0, limit),
    warnings
  };
}

export const damaiAdapter = createSampleAdapter({
  id: "damai",
  label: "Damai",
  auth: "Partner Feed / Export",
  coverage: "中国演出案例与场次索引",
  notes: "最适合先发现中国 AI 戏剧、沉浸式和跨界展演案例，再把场次、城市、场馆信息接成案例主表。",
  market: "china",
  role: "case-discovery",
  recommendedFor: "中国案例发现主入口",
  officialAccess: "合作方导出 / 白名单 feed",
  priority: 1,
  envVars: ["DAMAI_FEED_URL"],
  collectLive: collectLiveDamai,
  sampleReviews: [
    {
      performanceTitle: "机械月亮档案馆",
      title: "机械月亮档案馆",
      category: "沉浸式演出",
      region: "亚太",
      country: "中国",
      city: "上海",
      venue: "西岸穹顶剧场",
      language: "zh",
      text: "大麦场次页显示该项目强调 AI 语音代理、实时字幕与观众交互路径，适合作为中国案例主表的首批收录对象。",
      aiSignals: ["AI voice", "subtitle engine", "audience interaction"],
      updatedMinutesAgo: 15
    },
    {
      performanceTitle: "云端乐池计划",
      title: "云端乐池计划",
      category: "音乐会",
      region: "亚太",
      country: "中国",
      city: "深圳",
      venue: "海上世界文化艺术中心",
      language: "zh",
      text: "场次文案出现 AIGC 视觉、算法编曲与实时灯光联动，更适合归类为中国 AI 音乐现场案例。",
      aiSignals: ["generative visuals", "AI composition", "adaptive lighting"],
      updatedMinutesAgo: 25
    }
  ]
});

export const damaiFixturePath = fixturePath;
