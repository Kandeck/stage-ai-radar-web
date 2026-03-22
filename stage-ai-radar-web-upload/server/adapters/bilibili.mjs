import { createSampleAdapter } from "./base.mjs";

export const bilibiliAdapter = createSampleAdapter({
  id: "bilibili",
  label: "Bilibili",
  auth: "Export / Manual Feed",
  coverage: "长视频观后感与幕后解析",
  notes: "适合作为中国长评补充层，用来接观后感视频、二创解析和幕后讲解，不建议把它当成第一层案例发现源。",
  market: "china",
  role: "long-review-supplement",
  recommendedFor: "长评与视频复盘补充",
  officialAccess: "导出文件 / 手工 feed",
  priority: 4,
  sampleReviews: [
    {
      performanceTitle: "机械月亮档案馆",
      title: "B站观后感：机械月亮档案馆到底值不值得刷第二次",
      category: "沉浸式演出",
      region: "亚太",
      country: "中国",
      city: "上海",
      venue: "西岸穹顶剧场",
      language: "zh",
      text: "长视频里最常被反复提到的是演员和 AI 语音的配合节奏，以及观众互动后现场声场真的会变。",
      aiSignals: ["AI voice", "audience interaction", "adaptive sound"],
      updatedMinutesAgo: 55
    }
  ]
});
