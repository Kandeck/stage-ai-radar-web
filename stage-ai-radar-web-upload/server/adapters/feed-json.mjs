import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function parseFeedUrls(input) {
  return String(input ?? "")
    .split(/[,\r\n]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function readFeedResource(resource) {
  if (/^https?:\/\//i.test(resource)) {
    const response = await fetch(resource, {
      headers: {
        "User-Agent": "Stage-AI-Radar/0.1"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch feed ${resource}: ${response.status}`);
    }

    return {
      text: await response.text(),
      sourceLabel: resource
    };
  }

  const filePath = resource.startsWith("file://") ? fileURLToPath(resource) : resource;
  return {
    text: await readFile(filePath, "utf8"),
    sourceLabel: path.basename(filePath)
  };
}

export function parseJsonOrNdjson(input) {
  const trimmed = String(input ?? "").trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (Array.isArray(parsed.items)) {
      return parsed.items;
    }
    if (Array.isArray(parsed.data)) {
      return parsed.data;
    }
    if (Array.isArray(parsed.posts)) {
      return parsed.posts;
    }
    return [parsed];
  } catch {
    return trimmed
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }
}

export function cleanText(input = "") {
  return String(input).replace(/\s+/g, " ").trim();
}

export function parseDate(value) {
  const candidate = String(value ?? "").trim();
  if (!candidate) {
    return new Date().toISOString();
  }

  const date = new Date(candidate);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

export function minutesAgoFromDate(value) {
  const delta = Date.now() - new Date(value).getTime();
  return Math.max(1, Math.round(delta / 60000));
}

export function inferAiSignals(text = "", dictionary = []) {
  const input = String(text ?? "").toLowerCase();
  const hits = [];

  for (const [keyword, label] of dictionary) {
    if (input.includes(String(keyword).toLowerCase()) && !hits.includes(label)) {
      hits.push(label);
    }
  }

  return hits;
}
