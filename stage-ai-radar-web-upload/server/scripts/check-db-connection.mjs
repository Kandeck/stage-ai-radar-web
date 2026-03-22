import { loadEnvFiles } from "../lib/env.mjs";

loadEnvFiles();

const storageMode = String(process.env.STAGE_AI_RADAR_STORAGE ?? "").trim().toLowerCase();
const databaseUrl = String(process.env.DATABASE_URL ?? "").trim();

async function main() {
  if (storageMode !== "postgres") {
    throw new Error("STAGE_AI_RADAR_STORAGE is not set to postgres.");
  }

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing.");
  }

  const storage = await import("../lib/db-postgres.mjs");
  const stats = await storage.getDatabaseStats();
  console.log(
    JSON.stringify(
      {
        ok: true,
        storageMode: stats.storageMode,
        dbPath: stats.dbPath,
        rawReviewCount: stats.rawReviewCount,
        rawRetrievalCount: stats.rawRetrievalCount,
        collectionRunCount: stats.collectionRunCount
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Database connection check failed");
  process.exitCode = 1;
});
