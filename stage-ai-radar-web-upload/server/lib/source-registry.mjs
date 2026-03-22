import { bilibiliAdapter } from "../adapters/bilibili.mjs";
import { damaiAdapter } from "../adapters/damai.mjs";
import { douyinAdapter } from "../adapters/douyin.mjs";
import { mediaRssAdapter } from "../adapters/media-rss.mjs";
import { redditAdapter } from "../adapters/reddit.mjs";
import { ticketingAdapter } from "../adapters/ticketing.mjs";
import { wechatOfficialAdapter } from "../adapters/wechat-official.mjs";
import { xAdapter } from "../adapters/x.mjs";
import { xiaohongshuAdapter } from "../adapters/xiaohongshu.mjs";

const sourceMetadata = {
  damai: {
    market: "china",
    role: "case-discovery",
    recommendedFor: "中国案例发现主入口",
    officialAccess: "合作方导出 / 白名单 feed",
    priority: 1
  },
  xiaohongshu: {
    market: "china",
    role: "audience-reviews",
    recommendedFor: "中国观众口碑主层",
    officialAccess: "导出文件 / partner feed",
    priority: 2
  },
  "wechat-official": {
    market: "china",
    role: "ai-method-verification",
    recommendedFor: "AI 介入方式校验层",
    officialAccess: "白名单导出 / 合作方 feed",
    priority: 3
  },
  bilibili: {
    market: "china",
    role: "long-review-supplement",
    recommendedFor: "长评和幕后复盘补充层",
    officialAccess: "导出文件 / 手工 feed",
    priority: 4
  },
  douyin: {
    market: "china",
    role: "heat-signal",
    recommendedFor: "热度监控辅助层",
    officialAccess: "手工 feed / 授权数据",
    priority: 5
  },
  media: {
    market: "global",
    role: "critic-reviews",
    recommendedFor: "专业媒体和深度文章",
    officialAccess: "RSS / XML",
    priority: 6
  },
  reddit: {
    market: "global",
    role: "audience-reviews",
    recommendedFor: "全球英文长评论补充",
    officialAccess: "OAuth",
    priority: 7
  },
  x: {
    market: "global",
    role: "heat-signal",
    recommendedFor: "国际热度监控辅助层",
    officialAccess: "OAuth / Bearer Token",
    priority: 8
  },
  ticketing: {
    market: "global",
    role: "post-purchase-reviews",
    recommendedFor: "购票后高质量反馈",
    officialAccess: "Partner API / Scraper",
    priority: 9
  }
};

const adapters = [
  damaiAdapter,
  xiaohongshuAdapter,
  wechatOfficialAdapter,
  bilibiliAdapter,
  douyinAdapter,
  mediaRssAdapter,
  redditAdapter,
  xAdapter,
  ticketingAdapter
];

function enrichSnapshot(snapshot) {
  return {
    ...snapshot,
    ...(sourceMetadata[snapshot.id] ?? {})
  };
}

export function getSourceAdapters() {
  return adapters;
}

export function getSourceSnapshot() {
  return adapters
    .map((adapter) => enrichSnapshot(adapter.getSnapshot()))
    .sort((left, right) => (left.priority ?? 99) - (right.priority ?? 99));
}

export function getSourceAdapter(sourceId) {
  return adapters.find((adapter) => adapter.id === sourceId) ?? null;
}

export function getChinaSourceStrategy() {
  return getSourceSnapshot().filter((source) => source.market === "china");
}

export async function collectEnabledSources() {
  return getSourceSnapshot().map((source) => ({
    sourceId: source.id,
    collected: 0,
    status: source.enabled ? "live-placeholder" : "waiting-for-credentials",
    supportsSampleMode: source.supportsSampleMode,
    market: source.market,
    role: source.role,
    priority: source.priority
  }));
}

export async function collectFromSource(sourceId, options = {}) {
  const adapter = getSourceAdapter(sourceId);
  if (!adapter) {
    throw new Error(`Unknown source adapter: ${sourceId}`);
  }
  return adapter.collect(options);
}
