import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDatabaseStats, getStorageMode, persistReviews } from "../lib/storage.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, "../..");
const jsonPath = path.join(projectRoot, "data", "stage-ai-radar.store.json");

function normalizeReview(item) {
  const raw = item?.rawPayload && typeof item.rawPayload === "object" ? item.rawPayload : {};
  return {
    source: item?.source ?? raw.source ?? "legacy-import",
    externalId: item?.externalId ?? raw.externalId ?? null,
    performanceTitle: item?.performanceTitle ?? raw.performanceTitle ?? raw.title ?? "Untitled Performance",
    title: item?.title ?? raw.title ?? item?.performanceTitle ?? raw.performanceTitle ?? null,
    category: item?.category ?? raw.category ?? null,
    region: item?.region ?? raw.region ?? null,
    country: item?.country ?? raw.country ?? null,
    city: item?.city ?? raw.city ?? null,
    venue: item?.venue ?? raw.venue ?? null,
    language: item?.language ?? raw.language ?? null,
    text: item?.text ?? raw.text ?? "",
    aiSignals: item?.aiSignals ?? raw.aiSignals ?? [],
    audienceSentiment: item?.audienceSentiment ?? raw.audienceSentiment ?? null,
    aiInvolvement: item?.aiInvolvement ?? raw.aiInvolvement ?? null,
    integrationQuality: item?.integrationQuality ?? raw.integrationQuality ?? null,
    collectedAt: item?.collectedAt ?? raw.collectedAt ?? item?.insertedAt ?? null
  };
}

async function main() {
  const storageMode = await getStorageMode();
  if (storageMode !== "postgres") {
    throw new Error("Migration target is not PostgreSQL. Set STAGE_AI_RADAR_STORAGE=postgres and DATABASE_URL first.");
  }

  if (!existsSync(jsonPath)) {
    throw new Error(`Legacy JSON store not found: ${jsonPath}`);
  }

  const store = JSON.parse(readFileSync(jsonPath, "utf8"));
  const reviews = Array.isArray(store.rawReviews) ? store.rawReviews.map(normalizeReview) : [];

  if (!reviews.length) {
    console.log(
      JSON.stringify(
        {
          migrated: false,
          reason: "No rawReviews found in legacy JSON store.",
          storage: await getDatabaseStats()
        },
        null,
        2
      )
    );
    return;
  }

  const result = await persistReviews(reviews, {
    mode: "legacy-import"
  });

  console.log(
    JSON.stringify(
      {
        migrated: true,
        sourcePath: jsonPath,
        note: "This migration imports deduplicated reviews and writes one retrieval log per imported review.",
        result,
        storage: await getDatabaseStats()
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "JSON migration failed");
  process.exitCode = 1;
});
