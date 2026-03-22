import { createSampleAdapter } from "./base.mjs";

export const douyinAdapter = createSampleAdapter({
  id: "douyin",
  label: "Douyin",
  auth: "Manual Feed / Export",
  coverage: "短视频热度与城市打卡",
  notes: "适合看中国项目的爆点传播和现场打卡热度，但不适合作为案例主表或严肃评论主源。",
  market: "china",
  role: "heat-signal",
  recommendedFor: "热度监控辅助层",
  officialAccess: "手工 feed / 授权数据",
  priority: 5,
  sampleReviews: [
    {
      performanceTitle: "云端乐池计划",
      title: "抖音短视频热评摘录",
      category: "音乐会",
      region: "亚太",
      country: "中国",
      city: "深圳",
      venue: "海上世界文化艺术中心",
      language: "zh",
      text: "短视频里最火的是生成式视觉和灯光联动，能快速看见传播爆点，但评论深度明显不够。",
      aiSignals: ["generative visuals", "adaptive lighting"],
      updatedMinutesAgo: 40
    }
  ]
});
