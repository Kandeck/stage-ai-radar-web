import { graphLinks, graphNodes, mentions, performances } from "../../demo-data-clean.js";
import { stageAiCaseCatalog as caseTimeline } from "../../data/stage-ai-case-catalog.mjs";
import {
  FILTER_ALL,
  buildOverview,
  enrichPerformance,
  groupIngestedReviews
} from "../../shared/scoring-clean.js";
import {
  createCollectionRun,
  finalizeCollectionRun,
  getDatabaseStats,
  getSignalStorageEstimate,
  listCollectionRuns,
  listPersistedMentions,
  listPersistedSignals,
  listRetrievalEventsBySignalId,
  listStoredReviewsBySignalId,
  persistReviews
} from "./storage.mjs";
import { collectEnabledSources, collectFromSource, getSourceSnapshot } from "./source-registry.mjs";

const demoSignals = performances.map(enrichPerformance);

function includesQuery(item, query) {
  if (!query) {
    return true;
  }

  return [item.title, item.city, item.country, item.venue, ...(item.sources ?? []), ...(item.stack ?? [])]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function filterDemoSignals({ category = FILTER_ALL, region = FILTER_ALL, search = "" } = {}) {
  const query = search.trim().toLowerCase();
  return demoSignals.filter((item) => {
    const matchesCategory = category === FILTER_ALL || item.category === category;
    const matchesRegion = region === FILTER_ALL || item.region === region;
    return matchesCategory && matchesRegion && includesQuery(item, query);
  });
}

export async function filterSignals(filters = {}) {
  return [...(await listPersistedSignals(filters)), ...filterDemoSignals(filters)].sort((left, right) => right.pulseScore - left.pulseScore);
}

export async function getSignalById(id) {
  return (await filterSignals()).find((item) => item.id === id) ?? null;
}

export async function getSignalStoragePayload(id) {
  const signal = await getSignalById(id);
  if (!signal) {
    return null;
  }

  return {
    signal,
    storage: await getSignalStorageEstimate(id, signal)
  };
}

function formatExportTimestamp(value) {
  return new Date(value).toISOString();
}

function formatExportReview(review) {
  return {
    collectedAt: review.collectedAt,
    insertedAt: review.insertedAt,
    source: review.source,
    externalId: review.externalId ?? null,
    language: review.language,
    city: review.city,
    country: review.country,
    venue: review.venue,
    text: review.text,
    aiSignals: review.aiSignals ?? [],
    audienceSentiment: review.audienceSentiment ?? null,
    aiInvolvement: review.aiInvolvement ?? null,
    integrationQuality: review.integrationQuality ?? null
  };
}

function formatExportRetrievalEvent(event) {
  return {
    eventId: event.id,
    runId: event.runId,
    collectedAt: event.collectedAt,
    insertedAt: event.insertedAt,
    source: event.source,
    mode: event.mode,
    externalId: event.externalId ?? null,
    text: event.payload?.text ?? "",
    payload: event.payload
  };
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, "\"\"")}"`;
}

function toDownloadFileName(input) {
  return String(input ?? "signal-comments")
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "signal-comments";
}

function getTimelineCases() {
  const today = new Date().toISOString().slice(0, 10);
  return [...caseTimeline]
    .filter((item) => item.startDate >= "2024-01-01" && item.startDate <= today)
    .sort((left, right) => right.startDate.localeCompare(left.startDate));
}

export async function getSignalCommentsPayload(id) {
  const signal = await getSignalById(id);
  if (!signal) {
    return null;
  }

  const reviews = (await listStoredReviewsBySignalId(id)).map(formatExportReview);
  const retrievalEvents = (await listRetrievalEventsBySignalId(id)).map(formatExportRetrievalEvent);

  return {
    signal: {
      id: signal.id,
      title: signal.title,
      category: signal.category,
      city: signal.city,
      country: signal.country,
      venue: signal.venue
    },
    exportedAt: formatExportTimestamp(Date.now()),
    reviewCount: reviews.length,
    retrievalEventCount: retrievalEvents.length,
    reviews,
    retrievalEvents
  };
}

export async function buildSignalCommentsExport(id, format = "csv") {
  const payload = await getSignalCommentsPayload(id);
  if (!payload) {
    return null;
  }

  const baseName = `${toDownloadFileName(payload.signal.title)}-${new Date().toISOString().slice(0, 10)}`;

  if (format === "json") {
    return {
      fileName: `${baseName}.json`,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify(payload, null, 2)
    };
  }

  const header = [
    "performanceTitle",
    "collectedAt",
    "insertedAt",
    "source",
    "externalId",
    "language",
    "city",
    "country",
    "venue",
    "audienceSentiment",
    "aiInvolvement",
    "integrationQuality",
    "aiSignals",
    "text"
  ];

  const rows = payload.reviews.map((review) =>
    [
      payload.signal.title,
      review.collectedAt,
      review.insertedAt,
      review.source,
      review.externalId,
      review.language,
      review.city,
      review.country,
      review.venue,
      review.audienceSentiment,
      review.aiInvolvement,
      review.integrationQuality,
      (review.aiSignals ?? []).join(" | "),
      review.text
    ]
      .map(csvEscape)
      .join(",")
  );

  return {
    fileName: `${baseName}.csv`,
    contentType: "text/csv; charset=utf-8",
    body: `\uFEFF${header.join(",")}\n${rows.join("\n")}`
  };
}

function getDemoMentionFeed({ signalIds, region = FILTER_ALL } = {}) {
  return mentions.filter((item) => {
    if (signalIds.size && !signalIds.has(item.signalId)) {
      return false;
    }
    if (region !== FILTER_ALL && item.region !== region) {
      return false;
    }
    return true;
  });
}

export async function getMentionFeed({ signals = null, region = FILTER_ALL, limit = 6, offset = 0 } = {}) {
  const resolvedSignals = signals ?? (await filterSignals());
  const signalIds = new Set(resolvedSignals.map((item) => item.id));
  const scoped = [...(await listPersistedMentions({ signals: resolvedSignals, region, limit: 1000, offset: 0 })), ...getDemoMentionFeed({ signalIds, region })].sort(
    (left, right) => left.minutesAgo - right.minutesAgo
  );

  const pool = scoped.length ? scoped : mentions;
  return Array.from({ length: Math.min(limit, pool.length) }, (_, index) => pool[(offset + index) % pool.length]);
}

export function getGraphPayload() {
  return { nodes: graphNodes, links: graphLinks };
}

export async function buildBootstrapPayload(filters = {}) {
  const signals = await filterSignals(filters);
  const sourceStatus = await buildSourceStatusPayload();
  return {
    meta: {
      generatedAt: new Date().toISOString(),
      mode: "api",
      overview: buildOverview(signals),
      storage: await getDatabaseStats()
    },
    signals,
    mentions: await getMentionFeed({ signals, region: filters.region }),
    caseTimeline: getTimelineCases(),
    graph: getGraphPayload(),
    sources: getSourceSnapshot(),
    sourceStatus
  };
}

export async function buildSourceStatusPayload() {
  return {
    items: getSourceSnapshot(),
    collectionPreview: await collectEnabledSources(),
    storage: await getDatabaseStats(),
    recentRuns: await listCollectionRuns()
  };
}

export async function previewIngestion(payload = {}) {
  const incoming = Array.isArray(payload) ? payload : payload.items;
  const items = Array.isArray(incoming) ? incoming : [];
  const signals = groupIngestedReviews(items);

  return {
    received: items.length,
    generatedSignals: signals.length,
    signals,
    overview: buildOverview(signals)
  };
}

export async function commitIngestion(payload = {}) {
  const incoming = Array.isArray(payload) ? payload : payload.items;
  const items = Array.isArray(incoming) ? incoming : [];
  const persistence = await persistReviews(items, {
    mode: payload.mode ?? "manual"
  });
  const previewSignals = groupIngestedReviews(items);

  return {
    ...persistence,
    generatedSignals: previewSignals.length,
    signals: previewSignals,
    storage: await getDatabaseStats()
  };
}

export async function runSourceCollection(payload = {}) {
  const sourceId = payload.sourceId;
  const mode = payload.mode ?? "sample";
  const limit = Number(payload.limit ?? 5);
  const persist = payload.persist !== false;

  if (!sourceId) {
    throw new Error("sourceId is required");
  }

  const runId = await createCollectionRun({
    sourceId,
    mode,
    status: "started",
    collectedCount: 0,
    notes: null
  });

  try {
    const { sourceId: _sourceId, mode: _mode, limit: _limit, persist: _persist, ...collectorOptions } = payload;
    const collected = await collectFromSource(sourceId, { mode, limit, ...collectorOptions });
    const persistence = persist
      ? await persistReviews(collected.reviews, {
          runId,
          mode
        })
      : { received: collected.reviews.length, logged: 0, inserted: 0, duplicates: 0 };

    await finalizeCollectionRun(runId, {
      status: "completed",
      collectedCount: persist ? persistence.inserted : collected.reviews.length,
      notes: collected.warnings.join(" | ") || null
    });

    return {
      runId,
      ...collected,
      persistence,
      storage: await getDatabaseStats(),
      recentRuns: await listCollectionRuns()
    };
  } catch (error) {
    await finalizeCollectionRun(runId, {
      status: "failed",
      collectedCount: 0,
      notes: error instanceof Error ? error.message : "Unknown collection error"
    });
    throw error;
  }
}
