import { createServer } from "node:http";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { refresh as refreshNljr } from "./scripts/refresh_nljr.js";

const PORT = 8765;
const HOST = "127.0.0.1";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname);

// Load dotenv values if file exists
try {
  const envContent = await fs.readFile(path.join(ROOT, ".env"), "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = (match[2] || "").trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  }
} catch (e) {
  // Ignore missing .env
}

const DATA_DIR = process.env.OPS_DATA_DIR || path.join(ROOT, "data");

const REGISTRY_PATH = path.join(DATA_DIR, "source-registry.json");
const LEDGER_PATH = path.join(DATA_DIR, "nljr-article-ledger.json");
const FEED_PATH = path.join(DATA_DIR, "nljr-feed.json");
const ARCHIVE_DIR = path.join(DATA_DIR, "content_pipeline", "nljr_archive");
const NLJR_MD_PATH = path.join(DATA_DIR, "NLJR.md");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function safeJoin(unsafePath) {
  const normalized = path.normalize(unsafePath).replace(/^(\.\.(\/|\\|$))+/, "");
  return path.join(ROOT, normalized);
}

function send(res, status, data, contentType = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": contentType });
  if (typeof data === "string") {
    res.end(data);
  } else {
    res.end(JSON.stringify(data, null, 2));
  }
}

async function readRequestJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch (err) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", (err) => reject(err));
  });
}

async function readOptionalJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "item";
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSourceRegistry(data = {}) {
  return {
    meta: {
      name: data.meta?.name || "NLJR Source Registry",
      description: data.meta?.description || "Unified input list for Not Long; Just Read daily feed signals.",
      updatedAt: data.meta?.updatedAt || today(),
    },
    sources: Array.isArray(data.sources) ? data.sources : [],
  };
}

async function readSourceRegistry() {
  return normalizeSourceRegistry(await readOptionalJson(REGISTRY_PATH, {}));
}

function sourceDefaults(source = {}) {
  const sourceMode = source.sourceMode || "subscription";
  const id = source.id || `${sourceMode}-${slugify(source.name || "new-source")}-${Date.now()}`;
  const normalized = {
    id,
    name: source.name || "New Source",
    sourceMode,
    type: source.type || (sourceMode === "keyword_watch" ? "keyword" : sourceMode === "manual_inbox" ? "manual" : "website"),
    status: source.status || "active",
    scanStatus: source.scanStatus || (sourceMode === "subscription" ? "never_checked" : ""),
    lastError: source.lastError || "",
    priority: source.priority || "medium",
    relevance: normalizeList(source.relevance || ["Strategy"]),
    tags: normalizeList(source.tags || []),
    notes: source.notes || "",
    ...source,
    id,
    sourceMode,
  };
  ["relevance", "tags", "keywords", "platforms", "language", "acceptedFormats", "defaultRelevance"].forEach((key) => {
    if (key in normalized) normalized[key] = normalizeList(normalized[key]);
  });
  if (sourceMode === "keyword_watch") normalized.lookbackHours = Number(normalized.lookbackHours) || 24;
  return normalized;
}

async function saveSourceRegistry(data) {
  const registry = normalizeSourceRegistry(data);
  registry.meta.updatedAt = today();
  await writeJson(REGISTRY_PATH, registry);
  return registry;
}

async function addSourceRegistrySource(body) {
  const registry = await readSourceRegistry();
  const source = sourceDefaults(body.source || {});
  registry.sources = [source, ...registry.sources.filter((item) => item.id !== source.id)];
  return { ok: true, source, data: await saveSourceRegistry(registry) };
}

async function updateSourceRegistrySource(body) {
  const { sourceId, updates = {} } = body;
  if (!sourceId) return { ok: false, error: "sourceId is required" };
  const registry = await readSourceRegistry();
  const source = registry.sources.find((item) => item.id === sourceId);
  if (!source) return { ok: false, error: `Source not found: ${sourceId}` };
  Object.entries(updates).forEach(([key, value]) => {
    if (["relevance", "tags", "keywords", "platforms", "language", "acceptedFormats", "defaultRelevance"].includes(key)) {
      source[key] = normalizeList(value);
    } else if (key === "lookbackHours") {
      source[key] = Number(value) || 24;
    } else {
      source[key] = value;
    }
  });
  return { ok: true, source, data: await saveSourceRegistry(registry) };
}

async function archiveSourceRegistrySource(body) {
  const { sourceId } = body;
  if (!sourceId) return { ok: false, error: "sourceId is required" };
  return updateSourceRegistrySource({ sourceId, updates: { status: "archived" } });
}

function normalizeNLJRFeed(data = {}) {
  return {
    today: data.today || {
      date: "",
      status: "not_generated",
      generatedAt: "",
      items: [],
      sourceHealth: {},
    },
    archive: Array.isArray(data.archive) ? data.archive : [],
  };
}

async function readNLJRFeed() {
  return normalizeNLJRFeed(await readOptionalJson(FEED_PATH, {}));
}

async function readNLJRArticleLedger() {
  const data = await readOptionalJson(LEDGER_PATH, {});
  return {
    meta: data.meta || { name: "NLJR Article Ledger", updatedAt: "" },
    articles: Array.isArray(data.articles) ? data.articles : [],
  };
}

async function saveNLJRArticleLedger(data) {
  const ledger = {
    meta: {
      name: data.meta?.name || "NLJR Article Ledger",
      description: data.meta?.description || "Tracks discovered subscription posts so a processed article is never included in NLJR again.",
      updatedAt: today(),
    },
    articles: Array.isArray(data.articles) ? data.articles : [],
  };
  await writeJson(LEDGER_PATH, ledger);
  return ledger;
}

function nljrItemFromArticle(article, source, date, index) {
  return {
    id: `${date}-${slugify(article.id || article.title || article.url)}-${index + 1}`,
    articleId: article.id,
    sourceId: article.sourceId,
    sourceName: article.sourceName || source?.name || "Unknown source",
    title: article.title || "Untitled article",
    url: article.url,
    publishedAt: article.publishedAt || "",
    summary: article.summary || "",
    whyItMatters: article.whyItMatters || "",
    conciseSummary: article.conciseSummary || "",
    conciseWhyRelevant: article.conciseWhyRelevant || "",
    relevance: article.relevance || source?.relevance || [],
    suggestedUse: article.suggestedUse || ["Topic seed", "Strategy signal"],
    topicAngle: article.topicAngle || "",
    priority: article.priority || source?.priority || "medium",
    detailLevel: index < 3 ? "recommended" : "brief",
  };
}

function buildNLJRMarkdown(todayFeed) {
  const items = todayFeed.items || [];
  const recommendedIds = new Set(todayFeed.recommendedItemIds || []);
  const recommended = items.filter((item, index) =>
    recommendedIds.size ? recommendedIds.has(item.articleId || item.id) : index < 3,
  );
  const additional = items.filter(
    (item) => !recommended.some((recommendedItem) => recommendedItem.id === item.id),
  );
  const health = todayFeed.sourceHealth || {};
  return `# NLJR Daily Feed - ${todayFeed.date}

Generated at: ${todayFeed.generatedAt}

## Recommended Deep Reads

${recommended
  .map(
    (item, index) => `### ${index + 1}. ${item.title}

Source: ${item.sourceName}
URL: ${item.url || "N/A"}

#### Summary

${item.summary}

#### Why It Matters

${item.whyItMatters}

#### Suggested Use

${(item.suggestedUse || []).join(", ")}

#### Topic Angle

${item.topicAngle}
`,
  )
  .join("\n")}

## More New Feeds

${additional
  .map(
    (item, index) => `### ${index + 4}. ${item.title}

Source: ${item.sourceName}
URL: ${item.url || "N/A"}

${item.conciseSummary || item.summary}

Why read: ${item.conciseWhyRelevant || item.whyItMatters}
`,
  )
  .join("\n") || "No additional qualifying feeds."}

## Source Health

- Active sources: ${health.activeSources || 0}
- Active subscriptions: ${health.activeSubscriptions || 0}
- Need URL confirmation: ${health.needsUrlConfirmation || 0}
- Keyword watches: ${health.keywordWatches || 0}
- New articles available: ${health.newArticlesAvailable || 0}
- Processed articles: ${health.processedArticles || 0}

## Skipped Sources

${(health.skippedSources || []).map((item) => `- ${item.name}: ${item.reason}`).join("\n") || "- None"}
`;
}

async function generateNLJRFeed() {
  const registry = await readSourceRegistry();
  const feed = await readNLJRFeed();
  const ledger = await readNLJRArticleLedger();
  const date = today();
  const generatedAt = new Date().toISOString();
  const activeSources = registry.sources.filter((source) => source.status !== "archived");
  const subscriptions = activeSources.filter((source) => source.sourceMode === "subscription");
  const keywordWatches = activeSources.filter((source) => source.sourceMode === "keyword_watch");
  const needsUrl = activeSources.filter((source) => String(source.sourceConfidence || "").includes("needs"));
  const sourceById = new Map(registry.sources.map((source) => [source.id, source]));
  const priorityRank = { high: 0, medium: 1, low: 2 };
  const selectedArticles = ledger.articles
    .filter((article) => article.status === "new" && article.url)
    .sort((a, b) => {
      const priorityDiff = (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9);
      if (priorityDiff) return priorityDiff;
      return String(b.publishedAt || b.discoveredAt || "").localeCompare(
        String(a.publishedAt || a.discoveredAt || ""),
      );
    })
    .slice(0, 10);
  const items = selectedArticles.map((article, index) =>
    nljrItemFromArticle(article, sourceById.get(article.sourceId), date, index),
  );
  const selectedIds = new Set(selectedArticles.map((article) => article.id));
  ledger.articles = ledger.articles.map((article) =>
    selectedIds.has(article.id)
      ? { ...article, status: "processed", processedAt: generatedAt, includedIn: date }
      : article,
  );
  await saveNLJRArticleLedger(ledger);
  const todayFeed = {
    date,
    status: items.length ? "generated" : "no_new_posts",
    generatedAt,
    items,
    recommendedItemIds: items.slice(0, 3).map((item) => item.articleId || item.id),
    sourceHealth: {
      activeSources: activeSources.length,
      activeSubscriptions: subscriptions.length,
      needsUrlConfirmation: needsUrl.length,
      keywordWatches: keywordWatches.length,
      newArticlesAvailable: ledger.articles.filter((article) => article.status === "new").length,
      processedArticles: ledger.articles.filter((article) => article.status === "processed").length,
      skippedSources: needsUrl.map((source) => ({
        sourceId: source.id,
        name: source.name,
        reason: "URL/archive needs confirmation before automated scanning.",
      })),
    },
  };
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  const archivePath = `content_pipeline/nljr_archive/${date}.md`;
  await fs.writeFile(archivePath, buildNLJRMarkdown(todayFeed), "utf8");
  const archiveEntry = {
    date,
    path: `content_pipeline/nljr_archive/${date}.md`,
    itemCount: items.length,
    generatedAt,
    summary: items.length ? items.map((item) => item.sourceName).join(", ") : "No NLJR items generated.",
  };
  const archive = [archiveEntry, ...(feed.archive || []).filter((entry) => entry.date !== date)];
  const data = { today: todayFeed, archive };
  await writeJson(FEED_PATH, data);
  return { ok: true, data, archivePath };
}

async function updateMarkdownIndices(dateStr) {
  const dateObj = new Date(dateStr + "T00:00:00");
  const prettyDate = dateObj.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  // Update NLJR.md
  try {
    let nljrContent = await fs.readFile(NLJR_MD_PATH, "utf8");
    nljrContent = nljrContent.replace(
      /## Latest Edition\s*\n\s*\[\[content_pipeline\/nljr_archive\/[^|]+\|[^\]]+\]\]/g,
      `## Latest Edition\n\n[[content_pipeline/nljr_archive/${dateStr}|${prettyDate}]]`
    );
    const newLink = `- [[content_pipeline/nljr_archive/${dateStr}|${prettyDate}]]`;
    if (!nljrContent.includes(newLink)) {
      nljrContent = nljrContent.replace(
        /## Daily Editions\s*\n/g,
        `## Daily Editions\n\n${newLink}\n`
      );
    }
    await fs.writeFile(NLJR_MD_PATH, nljrContent, "utf8");
  } catch (e) {
    console.error("Failed to update NLJR.md:", e);
  }
}

async function handleApi(req, res, url) {
  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      return send(res, 200, { ok: true, server: "not-long-just-read" });
    }
    if (req.method === "GET" && url.pathname === "/api/source-registry") {
      return send(res, 200, await readSourceRegistry());
    }
    if (req.method === "GET" && url.pathname === "/api/nljr-feed") {
      return send(res, 200, await readNLJRFeed());
    }
    if (req.method === "GET" && url.pathname === "/api/nljr-article-ledger") {
      return send(res, 200, await readNLJRArticleLedger());
    }
    if (req.method === "POST" && url.pathname === "/api/source-registry/source") {
      return send(res, 200, await addSourceRegistrySource(await readRequestJson(req)));
    }
    if ((req.method === "PATCH" || req.method === "POST") && url.pathname === "/api/source-registry/source") {
      return send(res, 200, await updateSourceRegistrySource(await readRequestJson(req)));
    }
    if (req.method === "POST" && url.pathname === "/api/source-registry/archive") {
      return send(res, 200, await archiveSourceRegistrySource(await readRequestJson(req)));
    }
    if (req.method === "POST" && url.pathname === "/api/nljr-feed/generate") {
      const result = await generateNLJRFeed();
      if (result && result.data && result.data.today && result.data.today.date) {
        await updateMarkdownIndices(result.data.today.date);
      }
      return send(res, 200, result);
    }
    if (req.method === "POST" && url.pathname === "/api/nljr-feed/refresh") {
      const result = await refreshNljr();
      if (result && result.date) {
        await updateMarkdownIndices(result.date);
      }
      return send(res, 200, { ok: true, result });
    }
    return send(res, 404, { ok: false, error: "API route not found" });
  } catch (error) {
    return send(res, 500, { ok: false, error: error.message });
  }
}

async function serveStatic(req, res, url) {
  const pathname = decodeURIComponent(url.pathname === "/" ? "/ui/index.html" : url.pathname);
  let requested;
  if (pathname.startsWith("/content_pipeline/") || pathname === "/NLJR.md") {
    requested = path.join(DATA_DIR, pathname.replace(/^\/+/, ""));
  } else {
    requested = safeJoin(pathname.replace(/^\/+/, ""));
  }
  const fileStat = await fs.stat(requested).catch(() => null);
  if (!fileStat || !fileStat.isFile()) {
    return send(res, 404, "Not found", "text/plain; charset=utf-8");
  }
  const extension = path.extname(requested).toLowerCase();
  res.writeHead(200, { "Content-Type": contentTypes[extension] || "application/octet-stream" });
  
  const stream = createReadStream(requested);
  stream.on("error", () => send(res, 500, "Could not read file", "text/plain; charset=utf-8"));
  stream.pipe(res);
}

createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || `127.0.0.1:${PORT}`}`);
  if (url.pathname.startsWith("/api/")) {
    return handleApi(req, res, url);
  }
  return serveStatic(req, res, url).catch((error) => {
    send(res, 500, error.message, "text/plain; charset=utf-8");
  });
}).listen(PORT, HOST, () => {
  console.log(`NLJR Standalone server running locally at http://127.0.0.1:${PORT}/`);
});
