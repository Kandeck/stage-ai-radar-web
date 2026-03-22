import { runSourceCollection } from "../lib/api.mjs";
import { getSourceSnapshot } from "../lib/source-registry.mjs";

function parseBoolean(value, fallback) {
  if (value == null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function parseArgs(argv) {
  const options = {
    mode: "sample",
    persist: true,
    limit: 3,
    sourceIds: []
  };

  for (const argument of argv) {
    if (!argument.startsWith("--")) {
      continue;
    }

    const [rawKey, ...rest] = argument.slice(2).split("=");
    const value = rest.join("=");

    switch (rawKey) {
      case "mode":
        options.mode = value || options.mode;
        break;
      case "persist":
        options.persist = parseBoolean(value, options.persist);
        break;
      case "limit":
        options.limit = Math.max(1, Number(value) || options.limit);
        break;
      case "source":
      case "sources":
        options.sourceIds = String(value)
          .split(/[,\s]+/)
          .map((item) => item.trim())
          .filter(Boolean);
        break;
      default:
        break;
    }
  }

  return options;
}

function resolveSourceIds(requestedSourceIds) {
  const availableIds = getSourceSnapshot().map((item) => item.id);

  if (!requestedSourceIds.length) {
    return availableIds;
  }

  const validSourceIds = requestedSourceIds.filter((item) => availableIds.includes(item));
  const invalidSourceIds = requestedSourceIds.filter((item) => !availableIds.includes(item));

  if (invalidSourceIds.length) {
    console.warn(`Unknown source ids ignored: ${invalidSourceIds.join(", ")}`);
  }

  return validSourceIds;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const sourceIds = resolveSourceIds(options.sourceIds);

  if (!sourceIds.length) {
    throw new Error("No valid source ids selected for collection.");
  }

  const runs = [];

  for (const sourceId of sourceIds) {
    try {
      const result = await runSourceCollection({
        sourceId,
        mode: options.mode,
        persist: options.persist,
        limit: options.limit
      });

      runs.push({
        sourceId,
        status: "completed",
        reviews: result.reviews.length,
        inserted: result.persistence?.inserted ?? 0,
        duplicates: result.persistence?.duplicates ?? 0,
        warnings: result.warnings ?? [],
        storageMode: result.storage?.storageMode ?? "unknown"
      });
    } catch (error) {
      runs.push({
        sourceId,
        status: "failed",
        reviews: 0,
        inserted: 0,
        duplicates: 0,
        warnings: [error instanceof Error ? error.message : "Unknown collection error"],
        storageMode: "unknown"
      });
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    mode: options.mode,
    persist: options.persist,
    limit: options.limit,
    sourceIds,
    totals: {
      sources: runs.length,
      completed: runs.filter((item) => item.status === "completed").length,
      failed: runs.filter((item) => item.status === "failed").length,
      reviews: runs.reduce((sum, item) => sum + item.reviews, 0),
      inserted: runs.reduce((sum, item) => sum + item.inserted, 0),
      duplicates: runs.reduce((sum, item) => sum + item.duplicates, 0)
    },
    runs
  };

  console.log(JSON.stringify(summary, null, 2));

  if (summary.totals.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Collection runner failed");
  process.exitCode = 1;
});
