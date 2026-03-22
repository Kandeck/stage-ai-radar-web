import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSampleAdapter } from "./base.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(currentDir, "../fixtures/media-feed.xml");

function decodeHtmlEntities(input = "") {
  return input
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(input = "") {
  return decodeHtmlEntities(input).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTag(block, tagName) {
  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  return block.match(pattern)?.[1]?.trim() ?? "";
}

function parseFeedItems(xml) {
  const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  return itemMatches.map((itemXml, index) => {
    const title = stripTags(extractTag(itemXml, "title")) || `RSS Item ${index + 1}`;
    const description = stripTags(extractTag(itemXml, "description") || extractTag(itemXml, "content:encoded"));
    const link = stripTags(extractTag(itemXml, "link"));
    const pubDate = stripTags(extractTag(itemXml, "pubDate")) || new Date().toUTCString();

    return {
      title,
      description,
      link,
      pubDate
    };
  });
}

function inferCategory(text) {
  const input = text.toLowerCase();
  if (/(concert|orchestra|choir|music)/i.test(input)) {
    return "音乐会";
  }
  if (/(exhibition|museum|gallery|installation)/i.test(input)) {
    return "展览";
  }
  if (/(immersive|walkthrough|interactive)/i.test(input)) {
    return "沉浸式演出";
  }
  return "戏剧";
}

function inferAiSignals(text) {
  const hits = [];
  const dictionary = [
    ["ai", "AI"],
    ["voice", "AI voice"],
    ["subtitle", "subtitle engine"],
    ["projection", "generative projection"],
    ["sound", "adaptive sound"],
    ["interactive", "audience interaction"],
    ["scenography", "AI scenography"],
    ["curatorial", "curation AI"]
  ];

  for (const [keyword, label] of dictionary) {
    if (text.toLowerCase().includes(keyword) && !hits.includes(label)) {
      hits.push(label);
    }
  }

  return hits.length ? hits : ["media review ingestion"];
}

function normaliseFeedItem(item, sourceLabel) {
  const combinedText = [item.title, item.description].filter(Boolean).join(". ");
  return {
    performanceTitle: item.title.replace(/^(review|critic'?s notebook|preview)\s*:\s*/i, "").trim(),
    title: item.title,
    category: inferCategory(combinedText),
    region: "全球",
    country: "待补充",
    city: "待补充",
    venue: sourceLabel,
    language: "en",
    text: combinedText,
    aiSignals: inferAiSignals(combinedText),
    collectedAt: new Date(item.pubDate || Date.now()).toISOString(),
    updatedMinutesAgo: 5
  };
}

function parseFeedUrls(input) {
  return String(input ?? "")
    .split(/[,\r\n]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

async function readFeedResource(resource) {
  if (/^https?:\/\//i.test(resource)) {
    const response = await fetch(resource, {
      headers: {
        "User-Agent": "Stage-AI-Radar/0.1"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch feed ${resource}: ${response.status}`);
    }

    return {
      xml: await response.text(),
      sourceLabel: resource
    };
  }

  const filePath = resource.startsWith("file://") ? fileURLToPath(resource) : resource;
  return {
    xml: await readFile(filePath, "utf8"),
    sourceLabel: path.basename(filePath)
  };
}

async function collectLiveMediaFeed({ limit, options, env }) {
  const feedUrls = parseFeedUrls(options.feedUrl ?? options.feedUrls ?? env.MEDIA_FEED_URL);
  if (!feedUrls.length) {
    return {
      reviews: [],
      warnings: ["MEDIA_FEED_URL is empty. Provide one or more RSS feed URLs or local XML file paths."]
    };
  }

  const reviews = [];
  const warnings = [];

  for (const resource of feedUrls) {
    try {
      const { xml, sourceLabel } = await readFeedResource(resource);
      const items = parseFeedItems(xml);
      for (const item of items.slice(0, limit)) {
        reviews.push(normaliseFeedItem(item, sourceLabel));
      }
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : `Failed to read feed ${resource}`);
    }
  }

  return {
    reviews: reviews.slice(0, limit),
    warnings
  };
}

export const mediaRssAdapter = createSampleAdapter({
  id: "media",
  label: "Arts & Media Reviews",
  auth: "RSS / Scraper",
  coverage: "媒体评论与深度文章",
  notes: "适合提升来源可信度权重，补充专业媒体观点。支持真实 RSS URL，也支持本地 XML 文件路径做 smoke test。",
  envVars: ["MEDIA_FEED_URL"],
  collectLive: collectLiveMediaFeed,
  sampleReviews: [
    {
      performanceTitle: "Archive of Breathing Light",
      title: "Archive of Breathing Light",
      category: "展览",
      region: "欧洲",
      country: "法国",
      city: "巴黎",
      venue: "Gaite Lyrique",
      language: "fr",
      text: "The curatorial logic is precise, and AI acts more like a dramaturgical assistant than a spectacle machine.",
      aiSignals: ["curation AI", "semantic guidance", "dynamic media wall"],
      updatedMinutesAgo: 21
    }
  ]
});

export const mediaFeedFixturePath = fixturePath;
