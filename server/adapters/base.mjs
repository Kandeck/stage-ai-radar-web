import { loadEnvFiles } from "../lib/env.mjs";

function envSnapshot(envVars = []) {
  loadEnvFiles();
  const missing = envVars.filter((key) => !process.env[key]);
  return {
    configured: missing.length === 0,
    missing
  };
}

function withSourceId(reviews = [], sourceId) {
  return reviews.map((review) => ({
    source: sourceId,
    ...review
  }));
}

export function createSampleAdapter({
  id,
  label,
  auth,
  coverage,
  notes,
  market = "global",
  role = "audience-reviews",
  recommendedFor = "",
  officialAccess = "",
  priority = 99,
  envVars = [],
  sampleReviews = [],
  collectLive = null
}) {
  return {
    id,
    label,
    auth,
    coverage,
    notes,
    market,
    role,
    recommendedFor,
    officialAccess,
    priority,
    envVars,
    getSnapshot() {
      const envState = envSnapshot(envVars);
      return {
        id,
        label,
        auth,
        coverage,
        notes,
        market,
        role,
        recommendedFor,
        officialAccess,
        priority,
        status: collectLive ? (envState.configured ? "live-ready" : "waiting-for-credentials") : "skeleton",
        enabled: collectLive ? envState.configured : true,
        missingEnv: envState.missing,
        supportsSampleMode: sampleReviews.length > 0,
        supportsLiveMode: Boolean(collectLive)
      };
    },
    async collect({ mode = "sample", limit = 5, ...options } = {}) {
      if (mode === "sample") {
        return {
          sourceId: id,
          mode,
          reviews: sampleReviews.slice(0, limit).map((review, index) => ({
            ...withSourceId([review], id)[0],
            externalId: `${id}-sample-${index + 1}`
          })),
          warnings: sampleReviews.length ? [] : ["No sample reviews configured for this adapter."]
        };
      }

      const envState = envSnapshot(envVars);
      if (collectLive) {
        const result = await collectLive({ mode, limit, options, env: process.env, envState });
        return {
          sourceId: id,
          mode,
          reviews: withSourceId(result.reviews ?? [], id),
          warnings: result.warnings ?? []
        };
      }

      return {
        sourceId: id,
        mode,
        reviews: [],
        warnings: envState.configured
          ? ["Live collection is not implemented in this local skeleton yet."]
          : [`Missing environment variables: ${envState.missing.join(", ")}`]
      };
    }
  };
}
