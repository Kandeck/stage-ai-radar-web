import { createSampleAdapter } from "./base.mjs";

export const ticketingAdapter = createSampleAdapter({
  id: "ticketing",
  label: "Ticketing Platforms",
  auth: "Partner API / Scraper",
  coverage: "购票后评论",
  notes: "适合高质量购票用户反馈与复购倾向分析。",
  envVars: ["TICKETING_API_KEY"],
  sampleReviews: [
    {
      performanceTitle: "Afterimage Protocol",
      title: "Afterimage Protocol",
      category: "跨界展演",
      region: "北美",
      country: "美国",
      city: "旧金山",
      venue: "Yerba Buena Center",
      language: "en",
      text: "The AI visuals were ambitious, though the pacing became uneven halfway through the experience.",
      aiSignals: ["generative visuals", "pacing engine", "interactive scenes"],
      updatedMinutesAgo: 14
    }
  ]
});
