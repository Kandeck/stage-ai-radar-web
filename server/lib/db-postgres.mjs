import { createHash } from "node:crypto";
import { loadEnvFiles } from "./env.mjs";
import { FILTER_ALL, groupIngestedReviews } from "../../shared/scoring-clean.js";

loadEnvFiles();

const databaseUrl = String(process.env.DATABASE_URL ?? "").trim();
const databaseSsl = parseBoolean(process.env.DATABASE_SSL, false);
const databaseSslRejectUnauthorized = parseBoolean(process.env.DATABASE_SSL_REJECT_UNAUTHORIZED, false);
const databaseEnableChannelBinding =
  parseBoolean(process.env.DATABASE_ENABLE_CHANNEL_BINDING, false) || /(?:\?|&)channel_binding=require(?:&|$)/i.test(databaseUrl);

let storagePromise = null;

function parseBoolean(value, fallback = false) {
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

function nowIso() {
  return new Date().toISOString();
}

function toIsoString(value) {
  if (value == null) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
}

function parseJsonValue(value, fallback) {
  if (value == null) {
    return fallback;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
}

function sanitizeDatabaseUrl(value) {
  try {
    const parsed = new URL(value);
    const port = parsed.port ? `:${parsed.port}` : "";
    return `${parsed.protocol}//${parsed.hostname}${port}${parsed.pathname}`;
  } catch {
    return "postgres://configured";
  }
}

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
  return Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
}

function toSignalId(input) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeReviewForInsert(review) {
  return {
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
    aiSignals: Array.isArray(review.aiSignals) ? review.aiSignals : [],
    audienceSentiment: review.audienceSentiment ?? null,
    aiInvolvement: review.aiInvolvement ?? null,
    integrationQuality: review.integrationQuality ?? null,
    collectedAt: toIsoString(review.collectedAt) ?? nowIso(),
    rawPayload: review,
    dedupeKey: buildDedupeKey(review)
  };
}

function mapReviewRow(row) {
  return {
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
    aiSignals: parseJsonValue(row.ai_signals_json, []),
    audienceSentiment: row.audience_sentiment ?? undefined,
    aiInvolvement: row.ai_involvement ?? undefined,
    integrationQuality: row.integration_quality ?? undefined,
    updatedMinutesAgo: minutesAgoFromIso(row.collected_at),
    collectedAt: toIsoString(row.collected_at),
    insertedAt: toIsoString(row.inserted_at)
  };
}

function mapRetrievalEventRow(row) {
  return {
    id: Number(row.id),
    runId: row.run_id == null ? null : Number(row.run_id),
    source: row.source_id,
    mode: row.mode ?? null,
    dedupeKey: row.dedupe_key,
    externalId: row.external_id ?? null,
    performanceTitle: row.performance_title,
    payload: parseJsonValue(row.payload_json, null),
    collectedAt: toIsoString(row.collected_at),
    insertedAt: toIsoString(row.inserted_at),
    signalId: toSignalId(row.performance_title)
  };
}

function mapCollectionRunRow(row) {
  return {
    id: Number(row.id),
    source_id: row.source_id,
    mode: row.mode,
    status: row.status,
    collected_count: Number(row.collected_count ?? 0),
    notes: row.notes ?? null,
    started_at: toIsoString(row.started_at),
    finished_at: toIsoString(row.finished_at)
  };
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

function byteSizeOf(value) {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

async function initializeStorage() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required when STAGE_AI_RADAR_STORAGE=postgres");
  }

  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString: databaseUrl,
    enableChannelBinding: databaseEnableChannelBinding,
    ssl: databaseSsl
      ? {
          rejectUnauthorized: databaseSslRejectUnauthorized
        }
      : undefined
  });

  const schemaStatements = [
    `
      CREATE TABLE IF NOT EXISTS raw_reviews (
        id BIGSERIAL PRIMARY KEY,
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
        ai_signals_json JSONB NOT NULL DEFAULT '[]'::jsonb,
        audience_sentiment INTEGER,
        ai_involvement INTEGER,
        integration_quality INTEGER,
        raw_payload_json JSONB NOT NULL,
        collected_at TIMESTAMPTZ NOT NULL,
        inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS collection_runs (
        id BIGSERIAL PRIMARY KEY,
        source_id TEXT NOT NULL,
        mode TEXT NOT NULL,
        status TEXT NOT NULL,
        collected_count INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        started_at TIMESTAMPTZ NOT NULL,
        finished_at TIMESTAMPTZ
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS retrieval_events (
        id BIGSERIAL PRIMARY KEY,
        run_id BIGINT,
        source_id TEXT NOT NULL,
        mode TEXT,
        dedupe_key TEXT NOT NULL,
        external_id TEXT,
        performance_title TEXT NOT NULL,
        payload_json JSONB NOT NULL,
        collected_at TIMESTAMPTZ NOT NULL,
        inserted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `,
    "CREATE INDEX IF NOT EXISTS idx_raw_reviews_source_id ON raw_reviews (source_id)",
    "CREATE INDEX IF NOT EXISTS idx_raw_reviews_inserted_at ON raw_reviews (inserted_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_collection_runs_source_id ON collection_runs (source_id, started_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_retrieval_events_source_id ON retrieval_events (source_id, inserted_at DESC)",
    "CREATE INDEX IF NOT EXISTS idx_retrieval_events_performance_title ON retrieval_events (performance_title)"
  ];

  const client = await pool.connect();
  try {
    for (const statement of schemaStatements) {
      await client.query(statement);
    }
  } finally {
    client.release();
  }

  return { pool };
}

async function getStorage() {
  if (!storagePromise) {
    storagePromise = initializeStorage();
  }
  return storagePromise;
}

export async function getDatabasePath() {
  return sanitizeDatabaseUrl(databaseUrl);
}

export async function getStorageMode() {
  return "postgres";
}

export async function listStoredReviews() {
  const { pool } = await getStorage();
  const result = await pool.query(`
    SELECT
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
      collected_at,
      inserted_at
    FROM raw_reviews
    ORDER BY inserted_at DESC, id DESC
  `);

  return result.rows.map(mapReviewRow);
}

export async function listRetrievalEvents(limit = 1000) {
  const { pool } = await getStorage();
  const result = await pool.query(
    `
      SELECT id, run_id, source_id, mode, dedupe_key, external_id, performance_title, payload_json, collected_at, inserted_at
      FROM retrieval_events
      ORDER BY id DESC
      LIMIT $1
    `,
    [limit]
  );

  return result.rows.map(mapRetrievalEventRow);
}

export async function listStoredReviewsBySignalId(signalId) {
  return (await listStoredReviews())
    .filter((review) => toSignalId(review.performanceTitle) === signalId)
    .sort((left, right) => new Date(left.collectedAt).getTime() - new Date(right.collectedAt).getTime());
}

export async function listRetrievalEventsBySignalId(signalId, limit = 100000) {
  return (await listRetrievalEvents(limit))
    .filter((event) => event.signalId === signalId)
    .sort((left, right) => new Date(left.collectedAt).getTime() - new Date(right.collectedAt).getTime());
}

export async function listPersistedSignals(filters = {}) {
  return filterSignals(groupIngestedReviews(await listStoredReviews()), filters);
}

export async function listPersistedMentions({ signals = [], region = FILTER_ALL, limit = 6, offset = 0 } = {}) {
  const signalIds = new Set(signals.map((item) => item.id));
  const items = (await listStoredReviews())
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

export async function getSignalStorageEstimate(signalId, signalSnapshot = null) {
  const storedReviews = (await listStoredReviews()).filter((review) => toSignalId(review.performanceTitle) === signalId);
  const retrievalEvents = (await listRetrievalEvents(100000)).filter((event) => event.signalId === signalId);
  const persistedSignal = (await listPersistedSignals()).find((item) => item.id === signalId) ?? signalSnapshot;
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
    storagePath: await getDatabasePath(),
    storageMode: "postgres"
  };
}

async function insertRetrievalEvent(review, { runId = null, mode = null } = {}) {
  const { pool } = await getStorage();
  await pool.query(
    `
      INSERT INTO retrieval_events (
        run_id,
        source_id,
        mode,
        dedupe_key,
        external_id,
        performance_title,
        payload_json,
        collected_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::timestamptz)
    `,
    [
      runId,
      review.source,
      mode,
      review.dedupeKey,
      review.externalId,
      review.performanceTitle,
      JSON.stringify(review.rawPayload),
      review.collectedAt
    ]
  );
}

export async function persistReviews(reviews = [], options = {}) {
  const { pool } = await getStorage();
  let inserted = 0;
  let duplicates = 0;

  for (const input of reviews) {
    const review = normalizeReviewForInsert(input);
    await insertRetrievalEvent(review, options);
    const result = await pool.query(
      `
        INSERT INTO raw_reviews (
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
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $17::jsonb, $18::timestamptz
        )
        ON CONFLICT (dedupe_key) DO NOTHING
        RETURNING id
      `,
      [
        review.dedupeKey,
        review.source,
        review.externalId,
        review.performanceTitle,
        review.title,
        review.category,
        review.region,
        review.country,
        review.city,
        review.venue,
        review.language,
        review.text,
        JSON.stringify(review.aiSignals),
        review.audienceSentiment,
        review.aiInvolvement,
        review.integrationQuality,
        JSON.stringify(review.rawPayload),
        review.collectedAt
      ]
    );

    if (result.rowCount > 0) {
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

export async function createCollectionRun({ sourceId, mode, status = "started", collectedCount = 0, notes = null }) {
  const { pool } = await getStorage();
  const result = await pool.query(
    `
      INSERT INTO collection_runs (
        source_id,
        mode,
        status,
        collected_count,
        notes,
        started_at,
        finished_at
      ) VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7::timestamptz)
      RETURNING id
    `,
    [sourceId, mode, status, collectedCount, notes, nowIso(), status === "started" ? null : nowIso()]
  );

  return Number(result.rows[0]?.id);
}

export async function finalizeCollectionRun(runId, { status, collectedCount, notes = null }) {
  const { pool } = await getStorage();
  await pool.query(
    `
      UPDATE collection_runs
      SET status = $1, collected_count = $2, notes = $3, finished_at = $4::timestamptz
      WHERE id = $5
    `,
    [status, collectedCount, notes, nowIso(), runId]
  );
}

export async function listCollectionRuns(limit = 20) {
  const { pool } = await getStorage();
  const result = await pool.query(
    `
      SELECT id, source_id, mode, status, collected_count, notes, started_at, finished_at
      FROM collection_runs
      ORDER BY id DESC
      LIMIT $1
    `,
    [limit]
  );

  return result.rows.map(mapCollectionRunRow);
}

export async function getDatabaseStats() {
  const { pool } = await getStorage();
  const [reviewCountResult, retrievalCountResult, runCountResult, lastInsertResult] = await Promise.all([
    pool.query("SELECT COUNT(*)::bigint AS count FROM raw_reviews"),
    pool.query("SELECT COUNT(*)::bigint AS count FROM retrieval_events"),
    pool.query("SELECT COUNT(*)::bigint AS count FROM collection_runs"),
    pool.query("SELECT MAX(inserted_at) AS last_inserted_at FROM raw_reviews")
  ]);

  return {
    storageMode: "postgres",
    dbPath: sanitizeDatabaseUrl(databaseUrl),
    sqlitePath: null,
    rawRetrievalCount: Number(retrievalCountResult.rows[0]?.count ?? 0),
    rawReviewCount: Number(reviewCountResult.rows[0]?.count ?? 0),
    collectionRunCount: Number(runCountResult.rows[0]?.count ?? 0),
    lastInsertedAt: toIsoString(lastInsertResult.rows[0]?.last_inserted_at),
    dbFileBytes: null,
    dbFileKilobytes: null,
    fallbackReason: null
  };
}
