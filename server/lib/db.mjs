import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { loadEnvFiles } from "./env.mjs";
import { FILTER_ALL, groupIngestedReviews } from "../../shared/scoring-clean.js";

loadEnvFiles();

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, "../..");
const dataDir = path.join(projectRoot, "data");
const sqlitePath = path.join(dataDir, "stage-ai-radar.sqlite");
const jsonPath = path.join(dataDir, "stage-ai-radar.store.json");
const preferredStorageMode = String(process.env.STAGE_AI_RADAR_STORAGE ?? "json").trim().toLowerCase();

mkdirSync(dataDir, { recursive: true });

function createEmptyStore() {
  return {
    rawReviews: [],
    retrievalEvents: [],
    collectionRuns: [],
    nextReviewId: 1,
    nextEventId: 1,
    nextRunId: 1
  };
}

function ensureJsonStore() {
  if (!existsSync(jsonPath)) {
    writeFileSync(jsonPath, JSON.stringify(createEmptyStore(), null, 2), "utf8");
  }
}

function readJsonStore() {
  ensureJsonStore();
  const store = JSON.parse(readFileSync(jsonPath, "utf8"));
  if (!Array.isArray(store.rawReviews)) {
    store.rawReviews = [];
  }
  if (!Array.isArray(store.retrievalEvents)) {
    store.retrievalEvents = [];
  }
  if (!Array.isArray(store.collectionRuns)) {
    store.collectionRuns = [];
  }
  if (typeof store.nextReviewId !== "number") {
    store.nextReviewId = store.rawReviews.length + 1;
  }
  if (typeof store.nextEventId !== "number") {
    store.nextEventId = store.retrievalEvents.length + 1;
  }
  if (typeof store.nextRunId !== "number") {
    store.nextRunId = store.collectionRuns.length + 1;
  }
  return store;
}

function writeJsonStore(store) {
  writeFileSync(jsonPath, JSON.stringify(store, null, 2), "utf8");
}

function initializeStorage() {
  if (preferredStorageMode !== "sqlite") {
    ensureJsonStore();
    return {
      mode: "json",
      sqlite: null,
      fallbackReason: null
    };
  }

  try {
    const sqlite = new DatabaseSync(sqlitePath);
    sqlite.exec(`
      PRAGMA journal_mode = DELETE;
      PRAGMA synchronous = NORMAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS raw_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dedupe_key TEXT NOT NULL UNIQUE,
        source_id TEXT NOT NULL,
        external_id TEXT,
        performance_title TEXT NOT NULL,
        title TEXT,
        category TEXT,
        region TEXT,
        country TEXT,
        city TEXT,
        venue TEXT,
        language TEXT,
        text TEXT NOT NULL,
        ai_signals_json TEXT NOT NULL DEFAULT '[]',
        audience_sentiment INTEGER,
        ai_involvement INTEGER,
        integration_quality INTEGER,
        raw_payload_json TEXT NOT NULL,
        collected_at TEXT NOT NULL,
        inserted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS collection_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id TEXT NOT NULL,
        mode TEXT NOT NULL,
        status TEXT NOT NULL,
        collected_count INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        started_at TEXT NOT NULL,
        finished_at TEXT
      );

      CREATE TABLE IF NOT EXISTS retrieval_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id INTEGER,
        source_id TEXT NOT NULL,
        mode TEXT,
        dedupe_key TEXT NOT NULL,
        external_id TEXT,
        performance_title TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        collected_at TEXT NOT NULL,
        inserted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_raw_reviews_source_id ON raw_reviews (source_id);
      CREATE INDEX IF NOT EXISTS idx_raw_reviews_inserted_at ON raw_reviews (inserted_at DESC);
      CREATE INDEX IF NOT EXISTS idx_collection_runs_source_id ON collection_runs (source_id, started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_retrieval_events_source_id ON retrieval_events (source_id, inserted_at DESC);
      CREATE INDEX IF NOT EXISTS idx_retrieval_events_performance_title ON retrieval_events (performance_title);
    `);

    return {
      mode: "sqlite",
      sqlite,
      fallbackReason: null
    };
  } catch (error) {
    ensureJsonStore();
    return {
      mode: "json",
      sqlite: null,
      fallbackReason: error instanceof Error ? error.message : "Unknown SQLite initialization error"
    };
  }
}

const storage = initializeStorage();

const statements =
  storage.mode === "sqlite"
    ? {
        insertReview: storage.sqlite.prepare(`
          INSERT OR IGNORE INTO raw_reviews (
            dedupe_key,
            source_id,
            external_id,
            performance_title,
            title,
            category,
            region,
            country,
            city,
            venue,
            language,
            text,
            ai_signals_json,
            audience_sentiment,
            ai_involvement,
            integration_quality,
            raw_payload_json,
            collected_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
          )
        `),
        insertCollectionRun: storage.sqlite.prepare(`
          INSERT INTO collection_runs (
            source_id,
            mode,
            status,
            collected_count,
            notes,
            started_at,
            finished_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `),
        updateCollectionRun: storage.sqlite.prepare(`
          UPDATE collection_runs
          SET status = ?, collected_count = ?, notes = ?, finished_at = ?
          WHERE id = ?
        `),
        insertRetrievalEvent: storage.sqlite.prepare(`
          INSERT INTO retrieval_events (
            run_id,
            source_id,
            mode,
            dedupe_key,
            external_id,
            performance_title,
            payload_json,
            collected_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
      }
    : null;

function buildDedupeKey(review) {
  const basis = [
    review.source ?? "unknown",
    review.externalId ?? "",
    review.performanceTitle ?? review.title ?? "",
    review.city ?? "",
    review.language ?? "",
    review.text ?? ""
  ].join("::");

  return createHash("sha1").update(basis).digest("hex");
}

function minutesAgoFromIso(value) {
  const delta = Date.now() - new Date(value).getTime();
  return Math.max(1, Math.round(delta / 60000));
}

function toSignalId(input) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function mapReviewRecord(record) {
  return {
    source: record.source,
    externalId: record.externalId,
    performanceTitle: record.performanceTitle,
    title: record.title,
    category: record.category,
    region: record.region,
    country: record.country,
    city: record.city,
    venue: record.venue,
    language: record.language,
    text: record.text,
    aiSignals: record.aiSignals ?? [],
    audienceSentiment: record.audienceSentiment ?? undefined,
    aiInvolvement: record.aiInvolvement ?? undefined,
    integrationQuality: record.integrationQuality ?? undefined,
    updatedMinutesAgo: minutesAgoFromIso(record.collectedAt),
    collectedAt: record.collectedAt,
    insertedAt: record.insertedAt
  };
}

function mapSqlRowToReview(row) {
  return mapReviewRecord({
    source: row.source_id,
    externalId: row.external_id,
    performanceTitle: row.performance_title,
    title: row.title,
    category: row.category,
    region: row.region,
    country: row.country,
    city: row.city,
    venue: row.venue,
    language: row.language,
    text: row.text,
    aiSignals: JSON.parse(row.ai_signals_json),
    audienceSentiment: row.audience_sentiment ?? undefined,
    aiInvolvement: row.ai_involvement ?? undefined,
    integrationQuality: row.integration_quality ?? undefined,
    collectedAt: row.collected_at,
    insertedAt: row.inserted_at
  });
}

function mapRetrievalEventRecord(record) {
  return {
    id: record.id,
    runId: record.runId ?? null,
    source: record.source,
    mode: record.mode ?? null,
    dedupeKey: record.dedupeKey,
    externalId: record.externalId ?? null,
    performanceTitle: record.performanceTitle,
    payload: record.payload ?? null,
    collectedAt: record.collectedAt,
    insertedAt: record.insertedAt,
    signalId: toSignalId(record.performanceTitle)
  };
}

function mapSqlRowToRetrievalEvent(row) {
  return mapRetrievalEventRecord({
    id: row.id,
    runId: row.run_id,
    source: row.source_id,
    mode: row.mode,
    dedupeKey: row.dedupe_key,
    externalId: row.external_id,
    performanceTitle: row.performance_title,
    payload: JSON.parse(row.payload_json),
    collectedAt: row.collected_at,
    insertedAt: row.inserted_at
  });
}

function includesQuery(item, query) {
  if (!query) {
    return true;
  }

  return [item.title, item.city, item.country, item.venue, ...(item.sources ?? []), ...(item.stack ?? [])]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function filterSignals(items, { category = FILTER_ALL, region = FILTER_ALL, search = "" } = {}) {
  const query = search.trim().toLowerCase();
  return items.filter((item) => {
    const matchesCategory = category === FILTER_ALL || item.category === category;
    const matchesRegion = region === FILTER_ALL || item.region === region;
    return matchesCategory && matchesRegion && includesQuery(item, query);
  });
}

function listStoredReviewsFromSqlite() {
  return storage.sqlite
    .prepare(`
      SELECT *
      FROM raw_reviews
      ORDER BY inserted_at DESC, id DESC
    `)
    .all()
    .map(mapSqlRowToReview);
}

function listStoredReviewsFromJson() {
  const store = readJsonStore();
  return [...store.rawReviews]
    .sort((left, right) => new Date(right.insertedAt).getTime() - new Date(left.insertedAt).getTime())
    .map(mapReviewRecord);
}

function listRetrievalEventsFromSqlite(limit = 1000) {
  return storage.sqlite
    .prepare(`
      SELECT id, run_id, source_id, mode, dedupe_key, external_id, performance_title, payload_json, collected_at, inserted_at
      FROM retrieval_events
      ORDER BY id DESC
      LIMIT ?
    `)
    .all(limit)
    .map(mapSqlRowToRetrievalEvent);
}

function listRetrievalEventsFromJson(limit = 1000) {
  return [...readJsonStore().retrievalEvents]
    .sort((left, right) => right.id - left.id)
    .slice(0, limit)
    .map(mapRetrievalEventRecord);
}

export function getDatabasePath() {
  return storage.mode === "sqlite" ? sqlitePath : jsonPath;
}

export function getStorageMode() {
  return storage.mode;
}

export function listStoredReviews() {
  return storage.mode === "sqlite" ? listStoredReviewsFromSqlite() : listStoredReviewsFromJson();
}

export function listRetrievalEvents(limit = 1000) {
  return storage.mode === "sqlite" ? listRetrievalEventsFromSqlite(limit) : listRetrievalEventsFromJson(limit);
}

export function listStoredReviewsBySignalId(signalId) {
  return listStoredReviews()
    .filter((review) => toSignalId(review.performanceTitle) === signalId)
    .sort((left, right) => new Date(left.collectedAt).getTime() - new Date(right.collectedAt).getTime());
}

export function listRetrievalEventsBySignalId(signalId, limit = 100000) {
  return listRetrievalEvents(limit)
    .filter((event) => event.signalId === signalId)
    .sort((left, right) => new Date(left.collectedAt).getTime() - new Date(right.collectedAt).getTime());
}

export function listPersistedSignals(filters = {}) {
  const groupedSignals = groupIngestedReviews(listStoredReviews());
  return filterSignals(groupedSignals, filters);
}

export function listPersistedMentions({ signals = [], region = FILTER_ALL, limit = 6, offset = 0 } = {}) {
  const signalIds = new Set(signals.map((item) => item.id));
  const items = listStoredReviews()
    .filter((review) => {
      const reviewId = toSignalId(review.performanceTitle);
      if (signals.length && !signalIds.has(reviewId)) {
        return false;
      }
      if (region !== FILTER_ALL && review.region !== region) {
        return false;
      }
      return true;
    })
    .map((review) => ({
      signalId: toSignalId(review.performanceTitle),
      source: review.source,
      region: review.region,
      language: review.language,
      minutesAgo: review.updatedMinutesAgo,
      tone: (review.audienceSentiment ?? 50) >= 80 ? "positive" : (review.audienceSentiment ?? 50) >= 65 ? "mixed" : "watch",
      text: review.text
    }));

  if (!items.length) {
    return [];
  }

  return Array.from({ length: Math.min(limit, items.length) }, (_, index) => items[(offset + index) % items.length]);
}

function writeRetrievalEvent(review, { runId = null, mode = null } = {}) {
  const dedupeKey = buildDedupeKey(review);
  const collectedAt = review.collectedAt ?? new Date().toISOString();

  if (storage.mode === "sqlite") {
    statements.insertRetrievalEvent.run(
      runId,
      review.source ?? "manual-intake",
      mode,
      dedupeKey,
      review.externalId ?? null,
      review.performanceTitle ?? review.title ?? "Untitled Performance",
      JSON.stringify(review),
      collectedAt
    );
    return;
  }

  const store = readJsonStore();
  store.retrievalEvents.push({
    id: store.nextEventId++,
    runId,
    source: review.source ?? "manual-intake",
    mode,
    dedupeKey,
    externalId: review.externalId ?? null,
    performanceTitle: review.performanceTitle ?? review.title ?? "Untitled Performance",
    payload: review,
    collectedAt,
    insertedAt: new Date().toISOString()
  });
  writeJsonStore(store);
}

function byteSizeOf(value) {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

export function getSignalStorageEstimate(signalId, signalSnapshot = null) {
  const storedReviews = listStoredReviews().filter((review) => toSignalId(review.performanceTitle) === signalId);
  const retrievalEvents = listRetrievalEvents(100000).filter((event) => event.signalId === signalId);
  const persistedSignal = listPersistedSignals().find((item) => item.id === signalId) ?? signalSnapshot;
  const reviewBytes = storedReviews.reduce((sum, item) => sum + byteSizeOf(item), 0);
  const retrievalBytes = retrievalEvents.reduce((sum, item) => sum + byteSizeOf(item), 0);
  const signalBytes = persistedSignal ? byteSizeOf(persistedSignal) : 0;
  const totalBytes = reviewBytes + retrievalBytes + signalBytes;

  return {
    signalId,
    performanceTitle: persistedSignal?.title ?? storedReviews[0]?.performanceTitle ?? signalSnapshot?.title ?? null,
    storedReviewCount: storedReviews.length,
    retrievalEventCount: retrievalEvents.length,
    reviewBytes,
    retrievalBytes,
    signalBytes,
    totalBytes,
    totalKilobytes: Number((totalBytes / 1024).toFixed(2)),
    storagePath: getDatabasePath(),
    storageMode: getStorageMode()
  };
}

export function persistReviews(reviews = [], options = {}) {
  if (storage.mode === "sqlite") {
    let inserted = 0;
    let duplicates = 0;

    for (const review of reviews) {
      writeRetrievalEvent(review, options);
      const dedupeKey = buildDedupeKey(review);
      const result = statements.insertReview.run(
        dedupeKey,
        review.source ?? "manual-intake",
        review.externalId ?? null,
        review.performanceTitle ?? review.title ?? "Untitled Performance",
        review.title ?? review.performanceTitle ?? null,
        review.category ?? null,
        review.region ?? null,
        review.country ?? null,
        review.city ?? null,
        review.venue ?? null,
        review.language ?? null,
        review.text ?? "",
        JSON.stringify(review.aiSignals ?? []),
        review.audienceSentiment ?? null,
        review.aiInvolvement ?? null,
        review.integrationQuality ?? null,
        JSON.stringify(review),
        review.collectedAt ?? new Date().toISOString()
      );

      if (result.changes > 0) {
        inserted += 1;
      } else {
        duplicates += 1;
      }
    }

    return {
      received: reviews.length,
      logged: reviews.length,
      inserted,
      duplicates
    };
  }

  const store = readJsonStore();
  const existingKeys = new Set(store.rawReviews.map((item) => item.dedupeKey));
  let inserted = 0;
  let duplicates = 0;

  for (const review of reviews) {
    store.retrievalEvents.push({
      id: store.nextEventId++,
      runId: options.runId ?? null,
      source: review.source ?? "manual-intake",
      mode: options.mode ?? null,
      dedupeKey: buildDedupeKey(review),
      externalId: review.externalId ?? null,
      performanceTitle: review.performanceTitle ?? review.title ?? "Untitled Performance",
      payload: review,
      collectedAt: review.collectedAt ?? new Date().toISOString(),
      insertedAt: new Date().toISOString()
    });

    const dedupeKey = buildDedupeKey(review);
    if (existingKeys.has(dedupeKey)) {
      duplicates += 1;
      continue;
    }

    const now = new Date().toISOString();
    store.rawReviews.push({
      id: store.nextReviewId++,
      dedupeKey,
      source: review.source ?? "manual-intake",
      externalId: review.externalId ?? null,
      performanceTitle: review.performanceTitle ?? review.title ?? "Untitled Performance",
      title: review.title ?? review.performanceTitle ?? null,
      category: review.category ?? null,
      region: review.region ?? null,
      country: review.country ?? null,
      city: review.city ?? null,
      venue: review.venue ?? null,
      language: review.language ?? null,
      text: review.text ?? "",
      aiSignals: review.aiSignals ?? [],
      audienceSentiment: review.audienceSentiment ?? null,
      aiInvolvement: review.aiInvolvement ?? null,
      integrationQuality: review.integrationQuality ?? null,
      rawPayload: review,
      collectedAt: review.collectedAt ?? now,
      insertedAt: now
    });
    existingKeys.add(dedupeKey);
    inserted += 1;
  }

  writeJsonStore(store);

  return {
    received: reviews.length,
    logged: reviews.length,
    inserted,
    duplicates
  };
}

export function createCollectionRun({ sourceId, mode, status = "started", collectedCount = 0, notes = null }) {
  if (storage.mode === "sqlite") {
    const result = statements.insertCollectionRun.run(
      sourceId,
      mode,
      status,
      collectedCount,
      notes,
      new Date().toISOString(),
      status === "started" ? null : new Date().toISOString()
    );

    return Number(result.lastInsertRowid);
  }

  const store = readJsonStore();
  const run = {
    id: store.nextRunId++,
    source_id: sourceId,
    mode,
    status,
    collected_count: collectedCount,
    notes,
    started_at: new Date().toISOString(),
    finished_at: status === "started" ? null : new Date().toISOString()
  };
  store.collectionRuns.push(run);
  writeJsonStore(store);
  return run.id;
}

export function finalizeCollectionRun(runId, { status, collectedCount, notes = null }) {
  if (storage.mode === "sqlite") {
    statements.updateCollectionRun.run(status, collectedCount, notes, new Date().toISOString(), runId);
    return;
  }

  const store = readJsonStore();
  const run = store.collectionRuns.find((item) => item.id === runId);
  if (!run) {
    return;
  }
  run.status = status;
  run.collected_count = collectedCount;
  run.notes = notes;
  run.finished_at = new Date().toISOString();
  writeJsonStore(store);
}

export function listCollectionRuns(limit = 20) {
  if (storage.mode === "sqlite") {
    return storage.sqlite
      .prepare(`
        SELECT id, source_id, mode, status, collected_count, notes, started_at, finished_at
        FROM collection_runs
        ORDER BY id DESC
        LIMIT ?
      `)
      .all(limit);
  }

  return readJsonStore()
    .collectionRuns.sort((left, right) => right.id - left.id)
    .slice(0, limit);
}

export function getDatabaseStats() {
  const reviews = listStoredReviews();
  const retrievalEvents = listRetrievalEvents(100000);
  const runs = listCollectionRuns(100000);
  const dbPath = getDatabasePath();
  const dbFileBytes = existsSync(dbPath) ? statSync(dbPath).size : 0;

  return {
    storageMode: storage.mode,
    dbPath,
    sqlitePath,
    rawRetrievalCount: retrievalEvents.length,
    rawReviewCount: reviews.length,
    collectionRunCount: runs.length,
    lastInsertedAt: reviews[0]?.insertedAt ?? null,
    dbFileBytes,
    dbFileKilobytes: Number((dbFileBytes / 1024).toFixed(2)),
    fallbackReason: storage.fallbackReason
  };
}
