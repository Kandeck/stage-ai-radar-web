export const FILTER_ALL = "全部";

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function computePulseScore(item) {
  return Math.round(item.audienceSentiment * 0.6 + item.aiInvolvement * 0.25 + item.integrationQuality * 0.15);
}

export function getScoreTone(score) {
  if (score >= 88) {
    return { label: "强势上升", className: "tone-positive" };
  }
  if (score >= 78) {
    return { label: "值得关注", className: "tone-mixed" };
  }
  return { label: "持续观察", className: "tone-watch" };
}

export function enrichPerformance(item) {
  const pulseScore = item.pulseScore ?? computePulseScore(item);
  return {
    ...item,
    pulseScore,
    scoreTone: item.scoreTone ?? getScoreTone(pulseScore)
  };
}

export function buildOverview(items) {
  const reviewTotal = items.reduce((sum, item) => sum + (item.reviewCount ?? 0), 0);
  const sourceTotal = new Set(items.flatMap((item) => item.sources ?? [])).size;
  const averageAiInvolvement = items.length
    ? Math.round(items.reduce((sum, item) => sum + (item.aiInvolvement ?? 0), 0) / items.length)
    : 0;
  const averagePulseScore = items.length
    ? Math.round(items.reduce((sum, item) => sum + computePulseScore(item), 0) / items.length)
    : 0;

  return {
    signalCount: items.length,
    reviewTotal,
    sourceTotal,
    averageAiInvolvement,
    averagePulseScore
  };
}

const positiveKeywords = [
  "amazing",
  "stunning",
  "beautiful",
  "immersive",
  "excellent",
  "brilliant",
  "best",
  "powerful",
  "自然",
  "惊艳",
  "高级",
  "喜欢",
  "震撼",
  "完整",
  "精彩",
  "流畅"
];

const negativeKeywords = [
  "bad",
  "awkward",
  "boring",
  "confusing",
  "gimmick",
  "weak",
  "broken",
  "disappointing",
  "生硬",
  "割裂",
  "糟糕",
  "尴尬",
  "廉价",
  "失望",
  "问题"
];

const aiKeywords = [
  "ai",
  "llm",
  "voice clone",
  "synthetic",
  "generative",
  "avatar",
  "machine",
  "algorithm",
  "模型",
  "生成式",
  "语音合成",
  "数字人",
  "字幕引擎",
  "实时交互",
  "投影"
];

function keywordHits(text, keywords) {
  const input = String(text ?? "").toLowerCase();
  return keywords.reduce((count, keyword) => count + (input.includes(keyword.toLowerCase()) ? 1 : 0), 0);
}

export function estimateSentimentScore(text = "") {
  if (!String(text).trim()) {
    return 50;
  }

  const positiveHits = keywordHits(text, positiveKeywords);
  const negativeHits = keywordHits(text, negativeKeywords);
  return clamp(60 + positiveHits * 8 - negativeHits * 10);
}

export function estimateAiInvolvement(text = "", aiSignals = []) {
  const keywordScore = keywordHits(text, aiKeywords) * 10;
  const signalScore = (aiSignals ?? []).length * 8;
  return clamp(28 + keywordScore + signalScore);
}

function createSyntheticTrend(baseScore) {
  const anchors = [-10, -7, -4, -2, 0, 2, 4, 6];
  return anchors.map((offset) => clamp(baseScore + offset));
}

function toId(input, fallback) {
  const normalized = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

export function normalizeIngestedReview(review, index = 0) {
  const performanceTitle = review.performanceTitle?.trim() || review.title?.trim() || `Untitled Signal ${index + 1}`;
  const text = review.text?.trim() || "";
  const audienceSentiment = review.audienceSentiment ?? estimateSentimentScore(text);
  const aiInvolvement = review.aiInvolvement ?? estimateAiInvolvement(text, review.aiSignals ?? []);
  const integrationQuality =
    review.integrationQuality ?? clamp(Math.round(audienceSentiment * 0.52 + aiInvolvement * 0.48));

  return {
    id: toId(performanceTitle, `ingested-${index + 1}`),
    performanceTitle,
    title: review.title?.trim() || performanceTitle,
    category: review.category?.trim() || "未分类演出",
    city: review.city?.trim() || "待补充",
    country: review.country?.trim() || "待补充",
    region: review.region?.trim() || "全球",
    venue: review.venue?.trim() || "待补充",
    source: review.source?.trim() || "manual-intake",
    language: review.language?.trim() || "unknown",
    text,
    audienceSentiment,
    aiInvolvement,
    integrationQuality,
    aiSignals: review.aiSignals ?? [],
    updatedMinutesAgo: review.updatedMinutesAgo ?? 1
  };
}

export function groupIngestedReviews(reviews = []) {
  const grouped = new Map();

  reviews.forEach((review, index) => {
    const normalized = normalizeIngestedReview(review, index);
    const bucket = grouped.get(normalized.id) ?? [];
    bucket.push(normalized);
    grouped.set(normalized.id, bucket);
  });

  return Array.from(grouped.entries()).map(([id, items]) => {
    const first = items[0];
    const audienceSentiment = Math.round(items.reduce((sum, item) => sum + item.audienceSentiment, 0) / items.length);
    const aiInvolvement = Math.round(items.reduce((sum, item) => sum + item.aiInvolvement, 0) / items.length);
    const integrationQuality = Math.round(items.reduce((sum, item) => sum + item.integrationQuality, 0) / items.length);
    const controversy = clamp(100 - audienceSentiment + Math.round(aiInvolvement * 0.2));

    return enrichPerformance({
      id,
      title: first.performanceTitle,
      category: first.category,
      city: first.city,
      country: first.country,
      region: first.region,
      venue: first.venue,
      updatedMinutesAgo: Math.min(...items.map((item) => item.updatedMinutesAgo)),
      reviewCount: items.length,
      audienceSentiment,
      aiInvolvement,
      integrationQuality,
      controversy,
      highlight: items[0].text || "已接收评论，等待更多样本生成摘要。",
      quote: items[0].text || "暂无评论摘要。",
      sources: [...new Set(items.map((item) => item.source))],
      languages: [...new Set(items.map((item) => item.language))],
      stack: [...new Set(items.flatMap((item) => item.aiSignals))].slice(0, 5),
      trend: createSyntheticTrend(Math.round((audienceSentiment + aiInvolvement + integrationQuality) / 3)),
      mix: [
        { label: "观众评价", value: audienceSentiment },
        { label: "AI 介入", value: aiInvolvement },
        { label: "融合完成度", value: integrationQuality },
        { label: "争议压力", value: controversy }
      ]
    });
  });
}
