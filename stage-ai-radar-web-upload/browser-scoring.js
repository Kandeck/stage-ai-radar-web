window.StageAiRadarScoring = (() => {
  const FILTER_ALL = "全部";

  function computePulseScore(item) {
    return Math.round(item.audienceSentiment * 0.6 + item.aiInvolvement * 0.25 + item.integrationQuality * 0.15);
  }

  function getScoreTone(score) {
    if (score >= 88) {
      return { label: "强势上升", className: "tone-positive" };
    }
    if (score >= 78) {
      return { label: "值得关注", className: "tone-mixed" };
    }
    return { label: "持续观察", className: "tone-watch" };
  }

  function buildOverview(items) {
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

  return {
    FILTER_ALL,
    buildOverview,
    computePulseScore,
    getScoreTone
  };
})();
