import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSampleAdapter } from "./base.mjs";
import { cleanText, inferAiSignals, minutesAgoFromDate, parseDate, parseFeedUrls, parseJsonOrNdjson, readFeedResource } from "./feed-json.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(currentDir, "../fixtures/wechat-posts.json");

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
  return "戏剧";
}

function normaliseWechatPost(post, sourceLabel) {
  const title = cleanText(post.title ?? post.articleTitle ?? post.post_title);
  const body = cleanText(post.summary ?? post.description ?? post.content ?? post.abstract);
  const aiMode = cleanText(post.aiMode ?? post.ai_mode ?? post.techNotes);
  const text = [title, body, aiMode].filter(Boolean).join(". ");
  const collectedAt = parseDate(post.publishedAt ?? post.publish_time ?? post.date);
  const aiSignals =
    inferAiSignals(text, [
      ["ai", "AI"],
      ["aigc", "generative content"],
      ["大模型", "LLM dramaturgy"],
      ["语音", "AI voice"],
      ["数字人", "digital avatar"],
      ["字幕", "subtitle engine"],
      ["投影", "generative projection"],
      ["交互", "audience interaction"],
      ["灯光", "adaptive lighting"],
      ["算法", "algorithmic staging"]
    ]) || [];

  return {
    externalId: cleanText(post.id ?? post.articleId ?? post.link ?? title),
    performanceTitle: cleanText(post.performanceTitle ?? post.showTitle ?? title) || "Untitled WeChat Signal",
    title: title || "Untitled WeChat Signal",
    category: inferCategory(text),
    region: cleanText(post.region) || "亚太",
    country: cleanText(post.country) || "中国",
    city: cleanText(post.city) || "待补充",
    venue: cleanText(post.venue) || `公众号 / ${sourceLabel}`,
    language: cleanText(post.language) || "zh",
    text: text || "WeChat article export with no body.",
    aiSignals: aiSignals.length ? aiSignals : ["curatorial-notes"],
    collectedAt,
    updatedMinutesAgo: minutesAgoFromDate(collectedAt)
  };
}

async function collectLiveWechat({ limit, options, env }) {
  const feedUrls = parseFeedUrls(options.feedUrl ?? options.feedUrls ?? env.WECHAT_FEED_URL);
  if (!feedUrls.length) {
    return {
      reviews: [],
      warnings: ["WECHAT_FEED_URL is empty. Provide a whitelisted article export or institution feed snapshot."]
    };
  }

  const reviews = [];
  const warnings = [];

  for (const resource of feedUrls) {
    try {
      const { text, sourceLabel } = await readFeedResource(resource);
      const items = parseJsonOrNdjson(text);
      for (const item of items.slice(0, limit)) {
        reviews.push(normaliseWechatPost(item, sourceLabel));
      }
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : `Failed to read WeChat feed ${resource}`);
    }
  }

  return {
    reviews: reviews.slice(0, limit),
    warnings
  };
}

export const wechatOfficialAdapter = createSampleAdapter({
  id: "wechat-official",
  label: "WeChat Official Accounts",
  auth: "Whitelist Feed / Export",
  coverage: "机构公告、剧场推文与艺术节发布",
  notes: "最适合确认 AI 到底介入了哪里，建议只接剧场、艺术中心、戏剧节和制作机构白名单，不走全网野抓。",
  market: "china",
  role: "ai-method-verification",
  recommendedFor: "AI 介入说明层 / 官方口径",
  officialAccess: "白名单导出 / 合作方 feed",
  priority: 3,
  envVars: ["WECHAT_FEED_URL"],
  collectLive: collectLiveWechat,
  sampleReviews: [
    {
      performanceTitle: "机械月亮档案馆",
      title: "西岸穹顶剧场发布：机械月亮档案馆技术说明",
      category: "沉浸式演出",
      region: "亚太",
      country: "中国",
      city: "上海",
      venue: "西岸穹顶剧场",
      language: "zh",
      text: "官方推文明确写到作品使用 AI 语音代理、实时字幕系统和观众路径触发机制，这类信息适合作为 AI 介入方式校验层。",
      aiSignals: ["AI voice", "subtitle engine", "audience interaction"],
      updatedMinutesAgo: 35
    },
    {
      performanceTitle: "云端乐池计划",
      title: "制作机构发布：云端乐池计划创作笔记",
      category: "音乐会",
      region: "亚太",
      country: "中国",
      city: "深圳",
      venue: "海上世界文化艺术中心",
      language: "zh",
      text: "机构文章强调算法编曲、空间音频和灯光调度协作逻辑，非常适合作为案例字段补全来源。",
      aiSignals: ["AI composition", "spatial audio", "adaptive lighting"],
      updatedMinutesAgo: 48
    }
  ]
});

export const wechatFixturePath = fixturePath;
