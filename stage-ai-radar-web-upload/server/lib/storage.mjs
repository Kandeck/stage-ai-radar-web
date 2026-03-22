import { loadEnvFiles } from "./env.mjs";
import * as legacyDb from "./db.mjs";

loadEnvFiles();

const databaseUrl = String(process.env.DATABASE_URL ?? "").trim();
const preferredStorageMode = String(process.env.STAGE_AI_RADAR_STORAGE ?? (databaseUrl ? "postgres" : "json"))
  .trim()
  .toLowerCase();

let backendPromise = null;
let postgresFallbackReason = null;

async function resolveBackend() {
  if (backendPromise) {
    return backendPromise;
  }

  if (preferredStorageMode !== "postgres") {
    backendPromise = Promise.resolve({ kind: "legacy", api: legacyDb });
    return backendPromise;
  }

  backendPromise = import("./db-postgres.mjs")
    .then((api) => api.getDatabaseStats().then(() => ({ kind: "postgres", api })))
    .catch((error) => {
      postgresFallbackReason = error instanceof Error ? error.message : "Unknown PostgreSQL initialization error";
      return { kind: "legacy", api: legacyDb };
    });

  return backendPromise;
}

async function callStorage(methodName, ...args) {
  const backend = await resolveBackend();
  return backend.api[methodName](...args);
}

function withFallbackReason(payload) {
  if (!postgresFallbackReason || preferredStorageMode !== "postgres") {
    return payload;
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return {
      ...payload,
      fallbackReason: postgresFallbackReason
    };
  }

  return payload;
}

export async function getDatabasePath() {
  return callStorage("getDatabasePath");
}

export async function getStorageMode() {
  return callStorage("getStorageMode");
}

export async function listStoredReviews() {
  return callStorage("listStoredReviews");
}

export async function listRetrievalEvents(limit = 1000) {
  return callStorage("listRetrievalEvents", limit);
}

export async function listStoredReviewsBySignalId(signalId) {
  return callStorage("listStoredReviewsBySignalId", signalId);
}

export async function listRetrievalEventsBySignalId(signalId, limit = 100000) {
  return callStorage("listRetrievalEventsBySignalId", signalId, limit);
}

export async function listPersistedSignals(filters = {}) {
  return callStorage("listPersistedSignals", filters);
}

export async function listPersistedMentions(options = {}) {
  return callStorage("listPersistedMentions", options);
}

export async function getSignalStorageEstimate(signalId, signalSnapshot = null) {
  return callStorage("getSignalStorageEstimate", signalId, signalSnapshot);
}

export async function persistReviews(reviews = [], options = {}) {
  return callStorage("persistReviews", reviews, options);
}

export async function createCollectionRun(options) {
  return callStorage("createCollectionRun", options);
}

export async function finalizeCollectionRun(runId, options) {
  return callStorage("finalizeCollectionRun", runId, options);
}

export async function listCollectionRuns(limit = 20) {
  return callStorage("listCollectionRuns", limit);
}

export async function getDatabaseStats() {
  return withFallbackReason(await callStorage("getDatabaseStats"));
}
