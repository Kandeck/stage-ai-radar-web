import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildSignalCommentsExport,
  buildBootstrapPayload,
  commitIngestion,
  buildSourceStatusPayload,
  filterSignals,
  getGraphPayload,
  getMentionFeed,
  getSignalById,
  getSignalCommentsPayload,
  getSignalStoragePayload,
  previewIngestion,
  runSourceCollection
} from "./lib/api.mjs";
import { getDatabaseStats } from "./lib/storage.mjs";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, "..");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "0.0.0.0";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8"
  });
  response.end(message);
}

function sendDownload(response, { contentType, fileName, body }) {
  response.writeHead(200, {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
    "Cache-Control": "no-store"
  });
  response.end(body);
}

async function parseRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function getFilters(url) {
  return {
    category: url.searchParams.get("category") ?? undefined,
    region: url.searchParams.get("region") ?? undefined,
    search: url.searchParams.get("search") ?? undefined
  };
}

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      date: new Date().toISOString(),
      service: "stage-ai-radar-web"
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/bootstrap") {
    sendJson(response, 200, await buildBootstrapPayload(getFilters(url)));
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/db/stats") {
    sendJson(response, 200, await getDatabaseStats());
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/signals") {
    sendJson(response, 200, {
      items: await filterSignals(getFilters(url))
    });
    return;
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/signals/")) {
    const suffix = decodeURIComponent(url.pathname.replace("/api/signals/", ""));
    if (suffix.endsWith("/comments/export")) {
      const id = suffix.replace(/\/comments\/export$/, "");
      const format = String(url.searchParams.get("format") ?? "csv").trim().toLowerCase();
      const download = await buildSignalCommentsExport(id, format === "json" ? "json" : "csv");
      if (!download) {
        sendJson(response, 404, { error: "Signal not found" });
        return;
      }
      sendDownload(response, download);
      return;
    }

    if (suffix.endsWith("/comments")) {
      const id = suffix.replace(/\/comments$/, "");
      const payload = await getSignalCommentsPayload(id);
      if (!payload) {
        sendJson(response, 404, { error: "Signal not found" });
        return;
      }
      sendJson(response, 200, payload);
      return;
    }

    if (suffix.endsWith("/storage")) {
      const id = suffix.replace(/\/storage$/, "");
      const payload = await getSignalStoragePayload(id);
      if (!payload) {
        sendJson(response, 404, { error: "Signal not found" });
        return;
      }
      sendJson(response, 200, payload);
      return;
    }

    const id = suffix;
    const signal = await getSignalById(id);
    if (!signal) {
      sendJson(response, 404, { error: "Signal not found" });
      return;
    }
    sendJson(response, 200, signal);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/mentions") {
    const signals = await filterSignals(getFilters(url));
    const limit = Number(url.searchParams.get("limit") || 6);
    const offset = Number(url.searchParams.get("offset") || 0);
    sendJson(response, 200, {
      items: await getMentionFeed({ signals: signals.length ? signals : undefined, region: getFilters(url).region, limit, offset })
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/graph") {
    sendJson(response, 200, getGraphPayload());
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/sources") {
    sendJson(response, 200, await buildSourceStatusPayload());
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/intake/reviews") {
    try {
      const body = await parseRequestBody(request);
      sendJson(response, 200, await previewIngestion(body));
    } catch (error) {
      sendJson(response, 400, {
        error: error instanceof Error ? error.message : "Invalid request body"
      });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/intake/reviews/commit") {
    try {
      const body = await parseRequestBody(request);
      sendJson(response, 200, await commitIngestion(body));
    } catch (error) {
      sendJson(response, 400, {
        error: error instanceof Error ? error.message : "Invalid request body"
      });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/sources/collect") {
    try {
      const body = await parseRequestBody(request);
      sendJson(response, 200, await runSourceCollection(body));
    } catch (error) {
      sendJson(response, 400, {
        error: error instanceof Error ? error.message : "Collection request failed"
      });
    }
    return;
  }

  sendJson(response, 404, { error: "API route not found" });
}

async function serveStatic(response, pathname) {
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const safePath = path.normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.resolve(projectRoot, `.${safePath}`);

  if (!filePath.startsWith(projectRoot) || filePath.includes(`${path.sep}server${path.sep}`)) {
    sendText(response, 404, "Not found");
    return;
  }

  try {
    const fileStats = await stat(filePath);
    const targetPath = fileStats.isDirectory() ? path.join(filePath, "index.html") : filePath;
    const content = await readFile(targetPath);
    const extension = path.extname(targetPath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] ?? "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(content);
  } catch {
    sendText(response, 404, "Not found");
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (url.pathname.startsWith("/api/")) {
    await handleApi(request, response, url);
    return;
  }

  await serveStatic(response, url.pathname);
});

server.listen(port, host, () => {
  console.log(`Stage AI Radar server running on http://${host}:${port}`);
});
