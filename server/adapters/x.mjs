import { createSampleAdapter } from "./base.mjs";

export const xAdapter = createSampleAdapter({
  id: "x",
  label: "X / Twitter",
  auth: "Bearer Token",
  coverage: "实时舆情与热词",
  notes: "适合高频热度监控、巡演期间事件告警。",
  envVars: ["X_BEARER_TOKEN"],
  sampleReviews: [
    {
      performanceTitle: "Cloud Script Ceremony",
      title: "Cloud Script Ceremony",
      category: "沉浸式演出",
      region: "亚太",
      country: "新加坡",
      city: "新加坡",
      venue: "ArtScience Museum",
      language: "en",
      text: "Audience movement changed the projected script in real time. This is the most convincing AI staging I've seen.",
      aiSignals: ["realtime projection", "audience tracking", "adaptive script"],
      updatedMinutesAgo: 2
    },
    {
      performanceTitle: "Proxy Choir",
      title: "Proxy Choir",
      category: "音乐会",
      region: "欧洲",
      country: "德国",
      city: "柏林",
      venue: "Radialsystem",
      language: "de",
      text: "Amazing sound design, but the voice cloning made some people around me uncomfortable.",
      aiSignals: ["voice cloning", "choral synthesis", "spatial audio"],
      updatedMinutesAgo: 6
    }
  ]
});
