import { createServer } from "node:http";
import http from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = __dirname;
import { refresh as refreshNljr } from "./not-long-just-read/scripts/refresh_nljr.js";
// Load dotenv values if file exists
try {
  const envContent = await readFile(path.join(rootDir, ".env"), "utf8");
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

const NLJR_ROOT = process.env.NLJR_ROOT || "./not-long-just-read";
const NLJR_DATA_DIR = process.env.OPS_DATA_DIR || path.join(NLJR_ROOT, "data");
const NLJR_REGISTRY_PATH = path.join(NLJR_DATA_DIR, "source-registry.json");
const NLJR_LEDGER_PATH = path.join(NLJR_DATA_DIR, "nljr-article-ledger.json");
const NLJR_FEED_PATH = path.join(NLJR_DATA_DIR, "nljr-feed.json");
const NLJR_ARCHIVE_DIR = path.join(NLJR_DATA_DIR, "content_pipeline", "nljr_archive");
const NLJR_MD_PATH = path.join(NLJR_DATA_DIR, "NLJR.md");
const port = Number(process.env.PORT || 5177);
const host = process.env.HOST || "0.0.0.0";
const lanHost = process.env.LAN_HOST || getLanHost() || "your-lan-ip";
const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8",
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type });
  res.end(type.startsWith("application/json") ? JSON.stringify(body, null, 2) : body);
}

function safeJoin(...parts) {
  const resolved = path.resolve(rootDir, ...parts);
  if (resolved.startsWith(rootDir)) {
    return resolved;
  }
  if (NLJR_DATA_DIR) {
    const dataDirResolved = path.resolve(NLJR_DATA_DIR);
    if (resolved.startsWith(dataDirResolved)) {
      return resolved;
    }
  }
  throw new Error("Path escapes project root");
}

async function readJson(relativePath) {
  const raw = await readFile(safeJoin(relativePath), "utf8");
  return JSON.parse(raw.replace(/^\uFEFF/, ""));
}

async function writeJson(relativePath, data) {
  await writeFile(safeJoin(relativePath), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function readOptionalJson(relativePath, fallback) {
  try {
    return await readJson(relativePath);
  } catch {
    return fallback;
  }
}

async function readRequestJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").replace(/^\uFEFF/, "");
  return raw ? JSON.parse(raw) : {};
}

function upsertSection(markdown, heading, sectionBody) {
  const section = `## ${heading}\n\n${sectionBody.trim()}\n`;
  const regex = new RegExp(`\\n## ${heading}\\n[\\s\\S]*?(?=\\n## |$)`);
  if (regex.test(markdown)) {
    return markdown.replace(regex, `\n${section}`);
  }
  return `${markdown.trim()}\n\n${section}`;
}

function normalizeOption(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^option\s+[abc]/i.test(raw)) return raw.replace(/^option/i, "Option");
  if (/^[abc]$/i.test(raw)) return `Option ${raw.toUpperCase()}`;
  return raw;
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function getLanHost() {
  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const address of addresses || []) {
      if (address.family === "IPv4" && !address.internal) {
        return address.address;
      }
    }
  }
  return "";
}

function slugify(value) {
  return String(value || "topic")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "topic";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function briefMarkdownFromTopic(topic) {
  return `# Why This Post

## Recommended Because

- It sits inside the pillar: **${topic.pillar || "Unassigned"}**.
- It directly tests the AI portfolio / project coaching wedge.
- It speaks to a concrete anxiety: "I want to transition to AI PM, but I do not know what project will survive interview follow-up."
- It can attract high-quality comments from readers sharing their background, target role, or project idea.

## What Signal To Watch

- Saves: readers treat the checklist as reusable.
- Comments: readers mention background, target role, project idea, or portfolio confusion.
- Lead signal: readers ask for project review, AI PM portfolio help, mock interview, or private diagnosis.

---

# Brief

## Topic

${topic.title}

## What It Does

Turn this selected topic into a concrete post direction before drafting copy.

## Audience

Chinese-speaking professionals targeting AI PM roles, especially non-technical or adjacent-background candidates who need credible project proof.

## Core Pain

They want to transition into AI PM, but they are not sure what project would look credible, relevant, and strong enough to survive interview follow-up.

## Commercial Hypothesis

${topic.hypothesis || "This topic should test whether readers need portfolio, project, or AI PM transition coaching."}

## Suggested Output

- A clear XHS post angle.
- A save-worthy checklist or diagnostic framework.
- A comment prompt that invites background, target role, and project idea.
- A next step into Generate Draft after this brief is accepted mentally.

## Next Step

Click Generate Draft to create the actual post copy. Review belongs to the draft stage, not the topic-add stage.
`;
}

function draftMarkdownFromBrief(post, topic, brief) {
  const briefPath = post.sourceAssets?.brief || post.sourcePath || post.assets?.brief || "No brief file recorded.";
  return `# Draft

## Title Options

1. ${post.title}
2. 非技术背景转 AI PM，别再做炫技 demo
3. 你的 AI project 要证明的不是技术，而是 PM 判断

## XHS Caption Draft

很多想转 AI PM 的人，第一反应是：

> 我是不是应该先做一个很酷的 AI demo？

但如果你是非技术背景，真正要解决的问题不是“demo 看起来多高级”，而是：

> 面试官看完之后，会不会相信你能像 AI PM 一样定义问题、做取舍、解释价值？

一个更适合转型候选人的 AI project，通常要回答 5 件事：

1. **Problem**：你到底在解决谁的什么问题？
2. **User**：这个用户为什么现在会痛？
3. **Workflow**：AI 放进去之后，工作流发生了什么变化？
4. **Metric**：怎么判断这个 project 有用？
5. **Tradeoff**：你知道它的风险、边界和下一步吗？

所以不要一上来就问：

> 我要用什么模型？我要做什么酷功能？

先问：

> 我过去的经历里，有没有一个我真的懂的 workflow？这个 workflow 里，AI 可以减少哪一步摩擦？

比如 BA / Ops / Consulting / TPM 背景的人，可以从这些方向切入：

- 重复判断很多的 workflow
- 信息整理成本很高的 workflow
- 用户需要被引导做选择的 workflow
- 团队现在靠人工经验完成的 workflow

你的 AI portfolio 不需要证明你是 AI engineer。

它要证明：

> 你能用 PM 的方式，找到一个值得 AI 化的问题，并把它讲清楚。

## Carousel Structure

1. 封面：非技术背景转 AI PM，应该做什么 AI project？
2. 反常识：不是越技术越好，而是越能证明 PM 判断越好
3. 判断标准：problem / user / workflow / metric / tradeoff
4. 错误示范：只做炫技 demo，面试官追问就塌
5. 正确方向：从你熟悉的 workflow 找 AI project
6. 背景映射：BA / Ops / Consulting / TPM 可以怎么选题
7. 面试表达：这个 project 要怎么被讲成 AI PM proof
8. 评论引导：留下你的背景和目标 role，我帮你判断 project 方向

## Comment Prompt

如果你也在想转 AI PM，可以评论：

- 你的当前背景
- 目标 role
- 你正在想做的 AI project idea

我可以帮你判断它更像“炫技 demo”，还是更像一个能证明 PM 判断的 portfolio project。

## Source Brief

- Post: ${post.title}
- Pillar: ${post.pillar || topic?.pillar || "Unassigned"}
- Topic hypothesis: ${topic?.hypothesis || "No topic hypothesis found."}
- Brief file: ${briefPath}
`;
}

function copyReviewMarkdownFromDraft(post, topic) {
  return `# Review

## Review

This review checks whether the draft is ready to move from Drafted into Visual Direction. It should judge the post against strategy fit, save value, comment potential, and commercial subtlety.

## Overall Verdict

This draft is aligned with the account strategy because it connects a high-intent audience pain, non-technical AI PM transition, to the commercial wedge: AI portfolio / project coaching.

## Strategy Fit

- Audience fit: strong for non-technical, BA, Ops, Consulting, and TPM backgrounds.
- Commercial fit: strong because readers may ask whether their own project idea is credible.
- Persona fit: strong for momo as a practical North America PM helping candidates translate AI learning into PM proof.

## Strengths

- Clear pain: candidates do not know what AI project to build.
- Strong save potential: the 5-part standard can become a checklist.
- Good comment potential: asks readers to share background, target role, and project idea.
- Avoids overclaiming technical authority.

## Risks

- The draft should avoid sounding too generic; add concrete examples when possible.
- If the carousel becomes too text-heavy, split the 5-part standard across pages.
- The CTA should stay consultative, not salesy.

## Revision Suggestions

1. Add one concrete mini-example for BA, Ops, or Consulting.
2. Keep page 1 direct and high-anxiety.
3. Make page 7 explicitly interview-facing: "how to present this project when challenged."
4. End with a comment prompt, not a hard Calendly push.

`;
}

function inferTopicStatus(data, topic) {
  if (topic.status === "new" || topic.status === "generated") return "funnel";
  if (topic.status === "deselected") return "cancelled";
  if (topic.status) return topic.status;
  const selected = [...(data.posts || []), ...(data.publishedPosts || [])].some(
    (post) => post.topicId === topic.id || post.title === topic.title,
  );
  return selected ? "selected" : "funnel";
}

function normalizeTopicMetadata(data) {
  data.topics = (data.topics || []).map((topic, index) => ({
    ...topic,
    priority: Number.isFinite(Number(topic.priority)) ? Number(topic.priority) : index + 1,
    status: inferTopicStatus(data, topic),
    platform: topic.platform || "XHS",
  }));
  return data;
}

function uniquePostId(data, basePostId) {
  const existingIds = new Set([...(data.posts || []), ...(data.publishedPosts || [])].map((post) => post.id));
  if (!existingIds.has(basePostId)) return basePostId;
  let counter = 2;
  while (existingIds.has(`${basePostId}-${counter}`)) counter += 1;
  return `${basePostId}-${counter}`;
}

async function createPostFromTopic(topic, data = {}) {
  const date = today();
  const shortSlug = slugify(topic.title);
  const postId = uniquePostId(data, `${date}-${shortSlug}`);
  const filename = `${date}_${shortSlug}_brief.md`;
  const sourcePath = `content_pipeline/drafts/${filename}`;
  const uiPath = `data/pipeline/${filename}`;
  const brief = briefMarkdownFromTopic(topic);
  await mkdir(safeJoin("content_pipeline", "drafts"), { recursive: true });
  await mkdir(safeJoin("ui", "data", "pipeline"), { recursive: true });
  await writeFile(safeJoin(sourcePath), brief, "utf8");
  await writeFile(safeJoin("ui", uiPath), brief, "utf8");
  return {
    id: postId,
    topicId: topic.id,
    title: topic.title,
    status: "Added",
    pillar: topic.pillar,
    owner: "momo",
    date,
    sourcePath,
    nextStep: "Brief is ready. Generate Draft next.",
    assets: {
      brief: uiPath,
    },
    sourceAssets: {
      brief: sourcePath,
    },
    workflowState: {
      briefGenerated: true,
    },
  };
}

async function updateTopicStatus(body) {
  const { topicId, status } = body;
  const allowed = new Set(["funnel", "selected", "cancelled"]);
  if (!topicId || !allowed.has(status)) {
    return { ok: false, error: "topicId and valid status are required" };
  }

  const data = normalizeTopicMetadata(await readJson("ui/data/xhs-data.json"));
  const topic = data.topics.find((item) => item.id === topicId);
  if (!topic) return { ok: false, error: `Topic not found: ${topicId}` };

  topic.status = status;
  if (status === "selected") {
    const exists = (data.posts || []).some(
      (post) =>
        post.status !== "Archived" &&
        (post.topicId === topic.id || post.title === topic.title),
    );
    const publishedExists = (data.publishedPosts || []).some(
      (post) => post.topicId === topic.id || post.title === topic.title,
    );
    if (!exists && !publishedExists) {
      data.posts = [await createPostFromTopic(topic, data), ...(data.posts || [])];
    }
  }

  await writeJson("ui/data/xhs-data.json", data);
  return { ok: true, topic, data };
}

async function updateTopicPlatform(body) {
  const { topicId, platform } = body;
  const allowed = new Set(["XHS", "LinkedIn", "Both"]);
  if (!topicId || !allowed.has(platform)) {
    return { ok: false, error: "topicId and valid platform are required" };
  }

  const data = normalizeTopicMetadata(await readJson("ui/data/xhs-data.json"));
  const topic = data.topics.find((item) => item.id === topicId);
  if (!topic) return { ok: false, error: `Topic not found: ${topicId}` };

  topic.platform = platform;
  await writeJson("ui/data/xhs-data.json", data);
  return { ok: true, topic, data };
}

async function readLinkedInOverrides() {
  const data = await readOptionalJson("ui/data/linkedin-overrides.json", {});
  return {
    topicPlatforms: data.topicPlatforms || {},
  };
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
      description:
        data.meta?.description || "Unified input list for Not Long; Just Read daily feed signals.",
      updatedAt: data.meta?.updatedAt || today(),
    },
    sources: Array.isArray(data.sources) ? data.sources : [],
  };
}

async function readSourceRegistry() {
  return normalizeSourceRegistry(await readOptionalJson(NLJR_REGISTRY_PATH, {}));
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
  await writeJson(NLJR_REGISTRY_PATH, registry);
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

async function autoDiscoverSource(body) {
  let { name, url: inputUrl } = body;
  inputUrl = (inputUrl || "").trim();
  if (!inputUrl) {
    throw new Error("URL is required");
  }

  if (!/^https?:\/\//i.test(inputUrl)) {
    inputUrl = "https://" + inputUrl;
  }

  let feedUrl = "";
  let scrapedName = "";
  let scrapedDescription = "";

  const parsedUrl = new URL(inputUrl);
  const isYoutube = parsedUrl.host.includes("youtube.com") || parsedUrl.host.includes("youtu.be");

  if (isYoutube) {
    let channelId = "";
    try {
      const res = await fetch(inputUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (res.ok) {
        const html = await res.text();
        const metaMatch = html.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/i) ||
                         html.match(/<meta\s+itemprop="identifier"\s+content="(UC[a-zA-Z0-9_-]{22})"/i) ||
                         html.match(/<meta\s+itemprop="channelId"\s+content="([^"]+)"/i) ||
                         html.match(/"channelId"\s*:\s*"([^"]+)"/);
        if (metaMatch) {
          channelId = metaMatch[1];
        }
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch) {
          scrapedName = titleMatch[1].replace(" - YouTube", "").trim();
        }
        const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) ||
                           html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
        if (descMatch) {
          scrapedDescription = descMatch[1];
        }
      }
    } catch (e) {
      console.error("YouTube auto-discover fetch failed:", e.message);
    }

    if (channelId) {
      feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    } else {
      const params = new URLSearchParams(parsedUrl.search);
      const queryId = params.get("channel_id");
      if (queryId) {
        feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${queryId}`;
      }
    }
  } else {
    try {
      const res = await fetch(inputUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (res.ok) {
        const html = await res.text();
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch) {
          scrapedName = titleMatch[1].replace(/ - Substack| \| Substack/i, "").trim();
        }
        const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) ||
                           html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
        if (descMatch) {
          scrapedDescription = descMatch[1];
        }

        const rssLinkMatch = html.match(/<link[^>]+type=["']application\/(rss\+xml|atom\+xml)["'][^>]*>/i);
        if (rssLinkMatch) {
          const hrefMatch = rssLinkMatch[0].match(/href=["']([^"']+)["']/i);
          if (hrefMatch) {
            let href = hrefMatch[1];
            if (href.startsWith("/")) {
              feedUrl = `${parsedUrl.protocol}//${parsedUrl.host}${href}`;
            } else if (!/^https?:\/\//i.test(href)) {
              feedUrl = new URL(href, inputUrl).toString();
            } else {
              feedUrl = href;
            }
          }
        }

        if (!feedUrl) {
          if (inputUrl.includes("substack.com")) {
            feedUrl = `${parsedUrl.protocol}//${parsedUrl.host}/feed`;
          }
        }
      }
    } catch (e) {
      console.error("Standard site auto-discover fetch failed:", e.message);
    }
  }

  const finalName = (name || scrapedName || parsedUrl.host || "New Subscription").trim();
  const id = `subscription-${slugify(finalName)}-${Date.now()}`;
  
  // Smart Type Classification
  let type = "website";
  const urlLower = inputUrl.toLowerCase();
  const titleLower = finalName.toLowerCase();
  const descLower = scrapedDescription.toLowerCase();

  if (isYoutube) {
    type = "youtube";
  } else if (urlLower.includes("/podcast") || urlLower.includes("/podcasts") || descLower.includes("podcast") || titleLower.includes("podcast")) {
    type = "podcast";
  } else if (urlLower.includes("substack.com") || urlLower.includes("newsletter") || descLower.includes("newsletter") || titleLower.includes("newsletter")) {
    type = "newsletter";
  } else if (urlLower.includes("/blog") || urlLower.includes("blog.") || descLower.includes("blog") || titleLower.includes("blog")) {
    type = "blog";
  }

  // Smart Tag Suggestions
  const tags = [];
  const textToScan = `${titleLower} ${descLower} ${urlLower}`;
  
  if (/\b(ai|llm|gpt|claude|openai|lats|deepseek|machine learning|artificial intelligence)\b/i.test(textToScan)) {
    tags.push("ai");
  }
  if (/\b(product|pm|product management|roadmap|spec)\b/i.test(textToScan)) {
    tags.push("product");
  }
  if (/\b(growth|marketing|viral|acquisition|seo|metrics)\b/i.test(textToScan)) {
    tags.push("growth");
  }
  if (/\b(startup|startups|venture|founder|funding|vc)\b/i.test(textToScan)) {
    tags.push("startups");
  }
  if (/\b(engineering|developer|software|code|coder|tech|coding)\b/i.test(textToScan)) {
    tags.push("engineering");
  }
  if (/\b(design|ux|ui|user experience|interface)\b/i.test(textToScan)) {
    tags.push("design");
  }
  if (/\b(career|job|hiring|interview|resume)\b/i.test(textToScan)) {
    tags.push("career");
  }

  const newSource = {
    id,
    name: finalName,
    sourceMode: "subscription",
    type: type,
    status: "active",
    scanStatus: "never_checked",
    lastError: "",
    priority: "medium",
    relevance: ["Strategy"],
    tags: tags,
    notes: scrapedDescription || "",
    url: inputUrl,
    feedUrl: feedUrl,
    lastCheckedAt: "",
    lastItemSeen: ""
  };

  const registry = await readSourceRegistry();
  registry.sources = [newSource, ...registry.sources.filter(s => s.id !== newSource.id)];
  await saveSourceRegistry(registry);

  return { ok: true, source: newSource, data: registry };
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
  return normalizeNLJRFeed(await readOptionalJson(NLJR_FEED_PATH, {}));
}

async function readNLJRArticleLedger() {
  const data = await readOptionalJson(NLJR_LEDGER_PATH, {});
  return {
    meta: data.meta || { name: "NLJR Article Ledger", updatedAt: "" },
    articles: Array.isArray(data.articles) ? data.articles : [],
  };
}

async function saveNLJRArticleLedger(data) {
  const ledger = {
    meta: {
      name: data.meta?.name || "NLJR Article Ledger",
      description:
        data.meta?.description ||
        "Tracks discovered subscription posts so a processed article is never included in NLJR again.",
      updatedAt: today(),
    },
    articles: Array.isArray(data.articles) ? data.articles : [],
  };
  await writeJson(NLJR_LEDGER_PATH, ledger);
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
  const archiveDir = safeJoin(NLJR_ARCHIVE_DIR);
  await mkdir(archiveDir, { recursive: true });
  const archivePath = safeJoin(path.join(NLJR_ARCHIVE_DIR, `${date}.md`));
  const relativeArchivePath = `${NLJR_ROOT}/content_pipeline/nljr_archive/${date}.md`;
  await writeFile(archivePath, buildNLJRMarkdown(todayFeed), "utf8");
  const archiveEntry = {
    date,
    path: relativeArchivePath,
    itemCount: items.length,
    generatedAt,
    summary: items.length ? items.map((item) => item.sourceName).join(", ") : "No NLJR items generated.",
  };
  const archive = [archiveEntry, ...(feed.archive || []).filter((entry) => entry.date !== date)];
  const data = { today: todayFeed, archive };
  await writeJson(NLJR_FEED_PATH, data);
  return { ok: true, data, archivePath: relativeArchivePath };
}

async function updateMarkdownIndices(dateStr) {
  const dateObj = new Date(dateStr + "T00:00:00");
  const prettyDate = dateObj.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  const homePath = "00 Home.md";

  // 1. Update NLJR.md in the sibling/standalone folder
  try {
    let nljrContent = await readFile(safeJoin(NLJR_MD_PATH), "utf8");
    nljrContent = nljrContent.replace(
      /## Latest Edition\s*\n\s*\[\[(?:not-long-just-read\/)?content_pipeline\/nljr_archive\/[^|]+\|[^\]]+\]\]/g,
      `## Latest Edition\n\n[[not-long-just-read/content_pipeline/nljr_archive/${dateStr}|${prettyDate}]]`
    );
    const newLink = `- [[not-long-just-read/content_pipeline/nljr_archive/${dateStr}|${prettyDate}]]`;
    if (!nljrContent.includes(newLink)) {
      nljrContent = nljrContent.replace(
        /## Daily Editions\s*\n/g,
        `## Daily Editions\n\n${newLink}\n`
      );
    }
    await writeFile(safeJoin(NLJR_MD_PATH), nljrContent, "utf8");
  } catch (e) {
    console.error("Failed to update NLJR.md:", e);
  }

  // 2. Update 00 Home.md
  try {
    let homeContent = await readFile(safeJoin(homePath), "utf8");
    homeContent = homeContent.replace(
      /updated: \d{4}-\d{2}-\d{2}/g,
      `updated: ${dateStr}`
    );
    homeContent = homeContent.replace(
      /- \[\[(?:not-long-just-read\/)?content_pipeline\/nljr_archive\/[^|]+\|Latest Edition — [^\]]+\]\]/g,
      `- [[not-long-just-read/content_pipeline/nljr_archive/${dateStr}|Latest Edition — ${prettyDate}]]`
    );
    await writeFile(safeJoin(homePath), homeContent, "utf8");
  } catch (e) {
    console.error("Failed to update 00 Home.md:", e);
  }
}

async function updateLinkedInTopicPlatform(body) {
  const { topicId, platform } = body;
  const allowed = new Set(["XHS", "LinkedIn", "Both"]);
  if (!topicId || !allowed.has(platform)) {
    return { ok: false, error: "topicId and valid platform are required" };
  }

  const data = await readLinkedInOverrides();
  data.topicPlatforms[topicId] = platform;
  await writeJson("ui/data/linkedin-overrides.json", data);
  return { ok: true, topicId, platform, data };
}

async function addTopicToPosts(body) {
  const { topicId } = body;
  if (!topicId) return { ok: false, error: "topicId is required" };

  const data = normalizeTopicMetadata(await readJson("ui/data/xhs-data.json"));
  const topic = data.topics.find((item) => item.id === topicId);
  if (!topic) return { ok: false, error: `Topic not found: ${topicId}` };

  const existing = [...(data.posts || []), ...(data.publishedPosts || [])].find(
    (post) =>
      post.status !== "Archived" &&
      (post.topicId === topic.id || post.title === topic.title),
  );
  topic.status = "selected";

  if (!existing) {
    data.posts = [await createPostFromTopic(topic, data), ...(data.posts || [])];
  }

  await writeJson("ui/data/xhs-data.json", data);
  return { ok: true, topic, post: existing || data.posts[0], data };
}

async function cancelPostDraft(body) {
  const { postId } = body;
  if (!postId) return { ok: false, error: "postId is required" };

  const data = normalizeTopicMetadata(await readJson("ui/data/xhs-data.json"));
  const post = (data.posts || []).find((item) => item.id === postId);
  if (!post) return { ok: false, error: `Active post draft not found: ${postId}` };

  post.status = "Archived";
  post.nextStep = "Archived. Topic returned to funnel.";
  post.workflowState = {
    ...(post.workflowState || {}),
    cancelledAt: new Date().toISOString(),
    returnedTopicToFunnel: true,
  };

  const topic = (data.topics || []).find((item) => item.id === post.topicId || item.title === post.title);
  if (topic) {
    topic.status = "funnel";
  }

  await writeJson("ui/data/xhs-data.json", data);
  return { ok: true, post, topic, data };
}

async function acceptDraft(body) {
  const { postId } = body;
  if (!postId) return { ok: false, error: "postId is required" };

  const data = normalizeTopicMetadata(await readJson("ui/data/xhs-data.json"));
  const post = (data.posts || []).find((item) => item.id === postId);
  if (!post) return { ok: false, error: `Post draft not found: ${postId}` };
  if (post.status === "Archived") return { ok: false, error: "Archived post drafts cannot be accepted." };

  post.status = "Drafted";
  post.nextStep = "Draft accepted. Start Generate Image next.";
  post.workflowState = {
    ...(post.workflowState || {}),
    draftGenerated: true,
    draftAccepted: true,
    draftAcceptedAt: new Date().toISOString(),
  };

  await writeJson("ui/data/xhs-data.json", data);
  return { ok: true, post, data };
}

async function generateDraft(body) {
  const { postId } = body;
  if (!postId) return { ok: false, error: "postId is required" };

  const data = normalizeTopicMetadata(await readJson("ui/data/xhs-data.json"));
  const post = [...(data.posts || []), ...(data.publishedPosts || [])].find((item) => item.id === postId);
  if (!post) return { ok: false, error: `Post not found: ${postId}` };
  if (!post.sourceAssets?.brief) return { ok: false, error: "This post has no brief asset yet." };

  const topic = (data.topics || []).find((item) => item.id === post.topicId || item.title === post.title);
  const brief = await readFile(safeJoin(post.sourceAssets.brief), "utf8");
  const baseName = post.sourceAssets.brief
    .replace(/^content_pipeline\/drafts\//, "")
    .replace(/_brief\.md$/, "");
  const publishFilename = `${baseName}_publish-copy.md`;
  const reviewFilename = `${baseName}_copy-review.md`;
  const publishSourcePath = `content_pipeline/drafts/${publishFilename}`;
  const reviewSourcePath = `content_pipeline/drafts/${reviewFilename}`;
  const publishUiPath = `data/pipeline/${publishFilename}`;
  const reviewUiPath = `data/pipeline/${reviewFilename}`;
  const publishCopy = draftMarkdownFromBrief(post, topic, brief);
  const copyReview = copyReviewMarkdownFromDraft(post, topic);

  await mkdir(safeJoin("content_pipeline", "drafts"), { recursive: true });
  await mkdir(safeJoin("ui", "data", "pipeline"), { recursive: true });
  await writeFile(safeJoin(publishSourcePath), publishCopy, "utf8");
  await writeFile(safeJoin(reviewSourcePath), copyReview, "utf8");
  await writeFile(safeJoin("ui", publishUiPath), publishCopy, "utf8");
  await writeFile(safeJoin("ui", reviewUiPath), copyReview, "utf8");

  if (post.status !== "Archived" && !post.workflowState?.draftAccepted) {
    post.status = "Added";
  }
  post.nextStep = "Draft and copy review are ready. Review and accept draft next.";
  post.assets = {
    ...(post.assets || {}),
    publishCopy: publishUiPath,
    copyReview: reviewUiPath,
  };
  post.sourceAssets = {
    ...(post.sourceAssets || {}),
    publishCopy: publishSourcePath,
    copyReview: reviewSourcePath,
  };
  post.workflowState = {
    ...(post.workflowState || {}),
    draftGenerated: true,
  };

  await writeJson("ui/data/xhs-data.json", data);
  return { ok: true, post, publishCopyPath: publishSourcePath, copyReviewPath: reviewSourcePath, data };
}

function getPost(data, postId) {
  return [...(data.posts || []), ...(data.publishedPosts || [])].find((item) => item.id === postId);
}

function getTopic(data, post) {
  return (data.topics || []).find((item) => item.id === post.topicId || item.title === post.title);
}

async function readDraftCaption(post) {
  const draftPath = post.sourceAssets?.publishCopy;
  if (!draftPath) return "";
  const text = await readFile(safeJoin(draftPath), "utf8").catch(() => "");
  const match = text.match(/## XHS Caption Draft\s+([\s\S]*?)(?=\n## |$)/);
  return match?.[1]?.trim() || "";
}

function workflowFromBody(post, body) {
  const workflow = {
    ...(post.workflowState?.imageWorkflow || {}),
    imageRequired: body.imageRequired !== false,
    styleOption: normalizeOption(body.styleOption || post.workflowState?.imageWorkflow?.styleOption || "Option B"),
    goals: Array.isArray(body.goals) ? body.goals : [],
    latestComment: body.comment || "",
    updatedAt: new Date().toISOString(),
  };
  post.workflowState = {
    ...(post.workflowState || {}),
    imageWorkflow: workflow,
  };
  return workflow;
}

function styleLabel(option) {
  const labels = {
    "Option A": "Dark Case Room",
    "Option B": "Clean Notion Workbook",
    "Option C": "North America PM Desk",
  };
  return labels[option] || option || "Option B";
}

function carouselScriptMarkdown(post, topic, workflow) {
  const goals = workflow.goals?.length ? workflow.goals.join(", ") : "save, trust";
  return `# Carousel Script

## Post

${post.title}

## Visual Direction

- Image required: ${workflow.imageRequired ? "yes" : "no"}
- Style option: ${workflow.styleOption} - ${styleLabel(workflow.styleOption)}
- Goals: ${goals}
- Adjustment: ${workflow.latestComment || "None"}

## Page Plan

1. Cover: make the target audience stop because this feels like their portfolio problem.
2. Diagnosis: explain why a shiny AI demo does not prove AI PM readiness.
3. Reframe: portfolio should prove PM judgment, not engineering cosplay.
4. Framework: problem, user, workflow, metric, tradeoff.
5. Example: show how an adjacent-background candidate can pick a credible workflow.
6. Interview angle: how to explain the project under follow-up questions.
7. Action checklist: what to fix before calling it an AI portfolio.
8. Comment prompt: invite readers to share background, target role, and project idea.

## Source

- Pillar: ${post.pillar || topic?.pillar || "Unassigned"}
- Hypothesis: ${topic?.hypothesis || "No topic hypothesis found."}
`;
}

function imagePromptsMarkdown(post, workflow) {
  const style = `${workflow.styleOption} - ${styleLabel(workflow.styleOption)}`;
  const goals = workflow.goals?.length ? workflow.goals.join(", ") : "save, trust";
  const pages = [
    "Cover: AI portfolio is not a flashy demo",
    "Diagnosis: shiny demo vs PM proof",
    "Reframe: PM judgment over AI buzzwords",
    "Framework: problem user workflow metric tradeoff",
    "Example workflow from BA Ops Consulting TPM background",
    "Interview follow-up simulation",
    "Portfolio fix checklist",
    "Comment invitation and soft coaching signal",
  ];
  return `# Image Prompts

## Global Style

- Style: ${style}
- Goals: ${goals}
- Format: Xiaohongshu 3:4 vertical carousel, premium Chinese-English PM coaching visual.
- Constraints: no cheap blue-purple gradient, no PPT-looking flat cards, minimal readable text inside generated images.

${pages
  .map(
    (title, index) => `## Page ${index + 1}

Prompt:
\`\`\`text
Create a 3:4 Xiaohongshu carousel image for "${post.title}". Page ${index + 1}: ${title}. Use ${style}. Keep visual hierarchy editorial, premium, and mobile-readable. Include visual metaphors for AI PM portfolio coaching, North America PM interview readiness, and structured product judgment. Avoid clutter and avoid hard-sell coaching language.
\`\`\`

Review criteria:
- Supports goal: ${goals}
- Can hold concise Chinese overlay text later
- Feels credible for a 10+ year North America PM persona
`,
  )
  .join("\n")}
`;
}

function imageReviewMarkdown(post, workflow) {
  const images = workflow.generatedImages?.length
    ? workflow.generatedImages
    : Array.from({ length: 8 }, (_, index) => {
        const filename = `page-${String(index + 1).padStart(2, "0")}.svg`;
        return `content_pipeline/generated_images/${post.id}/${filename}`;
      });
  workflow.generatedImages = images;
  return `# Image Review

## Post

${post.title}

## Generated Image Queue

${images.map((item) => `- ${item}`).join("\n")}

## Preview

${images.map((item, index) => `![Page ${index + 1}](${item})`).join("\n\n")}

## Review Notes

These image files were generated by the current workflow. Without an API key, they are local SVG carousel images for layout and content review. With an image API key, they are generated image files.
`;
}

function escapeSvg(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrapSvgText(text, maxChars = 18) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    if ((current + word).length > maxChars && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current.trim());
  return lines.slice(0, 5);
}

function localCarouselSvg(post, workflow, page, title) {
  const style = workflow.styleOption || "Option B";
  const dark = style === "Option A";
  const bg = dark ? "#151515" : style === "Option C" ? "#f4f0e8" : "#f7f8f5";
  const ink = dark ? "#f5f1e8" : "#1f2428";
  const muted = dark ? "#9da6a0" : "#66706a";
  const accent = style === "Option A" ? "#d85f45" : style === "Option C" ? "#2f6f73" : "#2f8f66";
  const lines = wrapSvgText(title, 20);
  const subtitle = page === 1 ? post.title : "AI PM portfolio coaching";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1365" viewBox="0 0 1024 1365">
  <rect width="1024" height="1365" fill="${bg}"/>
  <rect x="72" y="72" width="880" height="1221" rx="28" fill="${dark ? "#202020" : "#ffffff"}" stroke="${dark ? "#3c3c3c" : "#d9ded7"}" stroke-width="3"/>
  <text x="112" y="145" fill="${accent}" font-family="Arial, sans-serif" font-size="34" font-weight="700">PAGE ${page}</text>
  <text x="112" y="205" fill="${muted}" font-family="Arial, sans-serif" font-size="28">momo · North America AI PM</text>
  ${lines.map((line, index) => `<text x="112" y="${365 + index * 74}" fill="${ink}" font-family="Arial, sans-serif" font-size="58" font-weight="800">${escapeSvg(line)}</text>`).join("\n  ")}
  <rect x="112" y="790" width="800" height="2" fill="${dark ? "#3c3c3c" : "#d9ded7"}"/>
  <text x="112" y="855" fill="${muted}" font-family="Arial, sans-serif" font-size="30">${escapeSvg(subtitle).slice(0, 70)}</text>
  <g transform="translate(112 940)">
    <rect width="800" height="210" rx="18" fill="${dark ? "#171717" : "#f1f4ef"}"/>
    <circle cx="72" cy="72" r="28" fill="${accent}"/>
    <text x="120" y="82" fill="${ink}" font-family="Arial, sans-serif" font-size="34" font-weight="700">problem · user · workflow · metric · tradeoff</text>
    <text x="120" y="142" fill="${muted}" font-family="Arial, sans-serif" font-size="26">designed for save-worthy XHS carousel review</text>
  </g>
  <text x="112" y="1235" fill="${muted}" font-family="Arial, sans-serif" font-size="24">Generated locally without API key</text>
</svg>`;
}

async function generateLocalSvgImages(post, workflow) {
  const titles = [
    "AI portfolio is not a flashy demo",
    "Shiny demo does not prove PM readiness",
    "PM judgment beats AI buzzwords",
    "Problem User Workflow Metric Tradeoff",
    "Find project ideas from your real workflow",
    "Prepare for interview follow-up questions",
    "Fix your portfolio before calling it AI PM",
    "Comment your background and target role",
  ];
  const outputDir = safeJoin("content_pipeline", "generated_images", post.id);
  await mkdir(outputDir, { recursive: true });
  const generated = [];
  for (const [index, title] of titles.entries()) {
    const filename = `page-${String(index + 1).padStart(2, "0")}.svg`;
    const outputPath = path.join(outputDir, filename);
    await writeFile(outputPath, localCarouselSvg(post, workflow, index + 1, title), "utf8");
    generated.push(path.relative(rootDir, outputPath).replaceAll("\\", "/"));
  }
  return generated;
}

function imagesIndexHtml(post, images = []) {
  const cards = images
    .map((item, index) => {
      const filename = path.basename(item);
      return `<article>
        <a href="./${filename}" target="_blank" rel="noreferrer">
          <img src="./${filename}" alt="Page ${index + 1}" />
        </a>
        <p>Page ${index + 1}</p>
      </article>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeSvg(post.title)} images</title>
  <style>
    body{margin:0;padding:24px;background:#f7f8f5;color:#1f2428;font-family:Arial,sans-serif}
    h1{font-size:24px;line-height:1.25}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px}
    article{background:#fff;border:1px solid #d9ded7;border-radius:8px;padding:12px}
    img{width:100%;aspect-ratio:3/4;object-fit:contain;background:#f1f4ef;border-radius:6px}
    p{margin:10px 0 0;color:#66706a;font-size:13px;font-weight:700}
  </style>
</head>
<body>
  <h1>${escapeSvg(post.title)}</h1>
  <div class="grid">${cards}</div>
</body>
</html>`;
}

async function writePostAsset(post, key, filenameSuffix, content) {
  const baseName = (post.sourceAssets?.brief || `content_pipeline/drafts/${post.id}_brief.md`)
    .replace(/^content_pipeline\/drafts\//, "")
    .replace(/_brief\.md$/, "");
  const filename = `${baseName}_${filenameSuffix}.md`;
  const sourcePath = `content_pipeline/drafts/${filename}`;
  const uiPath = `data/pipeline/${filename}`;
  await mkdir(safeJoin("content_pipeline", "drafts"), { recursive: true });
  await mkdir(safeJoin("ui", "data", "pipeline"), { recursive: true });
  await writeFile(safeJoin(sourcePath), content, "utf8");
  await writeFile(safeJoin("ui", uiPath), content, "utf8");
  post.assets = { ...(post.assets || {}), [key]: uiPath };
  post.sourceAssets = { ...(post.sourceAssets || {}), [key]: sourcePath };
  return { sourcePath, uiPath };
}

async function generateCarouselScript(body) {
  const data = normalizeTopicMetadata(await readJson("ui/data/xhs-data.json"));
  const post = getPost(data, body.postId);
  if (!post) return { ok: false, error: `Post not found: ${body.postId}` };
  const topic = getTopic(data, post);
  const workflow = workflowFromBody(post, body);
  const content = carouselScriptMarkdown(post, topic, workflow);
  await writePostAsset(post, "carouselScript", "carousel", content);
  workflow.carouselScriptPreview = content;
  workflow.carouselScriptGenerated = true;
  workflow.carouselScriptAccepted = false;
  post.status = "Generate Image";
  post.nextStep = "Carousel script generated. Review and accept it to generate image prompts.";
  await writeJson("ui/data/xhs-data.json", data);
  return { ok: true, message: "Carousel script generated.", post, data };
}

async function generateWorkflowImagePrompts(body) {
  const data = normalizeTopicMetadata(await readJson("ui/data/xhs-data.json"));
  const post = getPost(data, body.postId);
  if (!post) return { ok: false, error: `Post not found: ${body.postId}` };
  const workflow = workflowFromBody(post, body);
  workflow.carouselScriptAccepted = true;
  const content = imagePromptsMarkdown(post, workflow);
  await writePostAsset(post, "imagePrompts", "image-prompts", content);
  workflow.imagePromptsPreview = content;
  workflow.imagePromptsGenerated = true;
  workflow.imagePromptsAccepted = false;
  post.status = "Generate Image";
  post.nextStep = "Image prompts generated. Review and accept them to generate images.";
  await writeJson("ui/data/xhs-data.json", data);
  return { ok: true, message: "Image prompts generated.", post, data };
}

async function generateWorkflowImages(body) {
  const data = normalizeTopicMetadata(await readJson("ui/data/xhs-data.json"));
  const post = getPost(data, body.postId);
  if (!post) return { ok: false, error: `Post not found: ${body.postId}` };
  const workflow = workflowFromBody(post, body);
  workflow.imagePromptsAccepted = true;
  await mkdir(safeJoin("content_pipeline", "generated_images", post.id), { recursive: true });
  if (process.env.OPENAI_API_KEY && post.sourceAssets?.imagePrompts) {
    const prompts = await extractPromptsFromMarkdown(post.sourceAssets.imagePrompts, [1, 2, 3, 4, 5, 6, 7, 8]);
    const generated = [];
    for (const item of prompts) {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: imageModel,
          prompt: item.prompt,
          size: "1024x1536",
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI image API failed for page ${item.page}: ${errorText}`);
      }
      const result = await response.json();
      const b64 = result.data?.[0]?.b64_json;
      if (!b64) throw new Error(`No image data returned for page ${item.page}`);
      const filename = `page-${String(item.page).padStart(2, "0")}.png`;
      const outputPath = safeJoin("content_pipeline", "generated_images", post.id, filename);
      await writeFile(outputPath, Buffer.from(b64, "base64"));
      generated.push(path.relative(rootDir, outputPath).replaceAll("\\", "/"));
    }
    workflow.generatedImages = generated;
    post.generatedImages = generated;
  } else {
    const generated = await generateLocalSvgImages(post, workflow);
    workflow.generatedImages = generated;
    post.generatedImages = generated;
  }
  const content = imageReviewMarkdown(post, workflow);
  workflow.imageReviewPreview = content;
  const sourcePath = `content_pipeline/generated_images/${post.id}/image_review.md`;
  await writeFile(safeJoin(sourcePath), content, "utf8");
  await writeFile(
    safeJoin("content_pipeline", "generated_images", post.id, "index.html"),
    imagesIndexHtml(post, workflow.generatedImages || []),
    "utf8",
  );
  post.generatedImages = workflow.generatedImages;
  workflow.imagesGenerated = true;
  workflow.imagesAccepted = false;
  post.status = "Generate Image";
  post.nextStep = "Image review package generated. Review and accept images to mark Ready.";
  await writeJson("ui/data/xhs-data.json", data);
  return { ok: true, message: "Image review package generated.", post, data };
}

async function acceptImagePackage(body) {
  const data = normalizeTopicMetadata(await readJson("ui/data/xhs-data.json"));
  const post = getPost(data, body.postId);
  if (!post) return { ok: false, error: `Post not found: ${body.postId}` };
  const workflow = workflowFromBody(post, body);
  workflow.imagesAccepted = true;
  const caption = await readDraftCaption(post);
  const packageDir = safeJoin("content_pipeline", "post_packages", post.id);
  await mkdir(packageDir, { recursive: true });
  const packageContent = `# Ready Package

## Title

${post.title}

## XHS Caption Draft

${caption || "Use accepted draft copy."}

## Images

${(workflow.generatedImages || post.generatedImages || []).map((item) => `- ${item}`).join("\n") || "- No images required."}

## Images Folder

[Open images folder](/content_pipeline/generated_images/${post.id}/index.html)

## Final Comment

${workflow.latestComment || "Accepted without extra comment."}
`;
  workflow.readyPackagePreview = packageContent;
  await writeFile(path.join(packageDir, "ready_package.md"), packageContent, "utf8");
  post.assets = { ...(post.assets || {}), readyPackage: `content_pipeline/post_packages/${post.id}/ready_package.md` };
  post.status = "Ready";
  post.nextStep = "Ready package saved. Publish manually on XHS.";
  await writeJson("ui/data/xhs-data.json", data);
  return { ok: true, message: "Ready package saved.", post, data };
}

async function createCodexTask(kind, payload) {
  const taskDir = safeJoin("content_pipeline", "tasks", "pending");
  await mkdir(taskDir, { recursive: true });
  const filename = `${timestampSlug()}_${kind}.md`;
  const taskPath = path.join(taskDir, filename);
  const body = `# Codex Task: ${kind}

Created: ${new Date().toISOString()}

\`\`\`json
${JSON.stringify(payload, null, 2)}
\`\`\`
`;
  await writeFile(taskPath, body, "utf8");
  return path.relative(rootDir, taskPath).replaceAll("\\", "/");
}

async function selectVisualOption(body) {
  const { postId, selectedOption, adjustment = "" } = body;
  const normalizedOption = normalizeOption(selectedOption);
  if (!postId || !normalizedOption) {
    return { ok: false, error: "postId and selectedOption are required" };
  }

  const data = await readJson("ui/data/xhs-data.json");
  const post = [...data.posts, ...data.publishedPosts].find((item) => item.id === postId);
  if (!post) return { ok: false, error: `Post not found: ${postId}` };

  post.visualDecision = {
    selectedOption: normalizedOption,
    adjustment,
    decisionDate: new Date().toISOString().slice(0, 10),
    nextAction: "generate_image_prompts",
  };
  post.status = "Generate Image";
  post.nextStep = `Visual option selected: ${normalizedOption}. Generate image prompts next.`;

  const sourcePath = post.sourceAssets?.visualStyleOptions;
  const uiPath = post.assets?.visualStyleOptions;
  const decisionMarkdown = `\`\`\`yaml
selected_option: "${normalizedOption}"
style_adjustment: "${String(adjustment).replaceAll('"', "'")}"
decision_date: ${post.visualDecision.decisionDate}
next_action: generate_image_prompts
\`\`\``;

  for (const relativePath of [sourcePath, uiPath ? `ui/${uiPath}` : ""].filter(Boolean)) {
    const fullPath = safeJoin(relativePath);
    const existing = await readFile(fullPath, "utf8");
    await writeFile(fullPath, upsertSection(existing, "Selected Visual Option", decisionMarkdown), "utf8");
  }

  await writeJson("ui/data/xhs-data.json", data);
  return { ok: true, postId, selectedOption: normalizedOption, adjustment, data: post };
}

async function markImagePromptsReady(body) {
  const { postId } = body;
  if (!postId) return { ok: false, error: "postId is required" };

  const data = await readJson("ui/data/xhs-data.json");
  const post = [...data.posts, ...data.publishedPosts].find((item) => item.id === postId);
  if (!post) return { ok: false, error: `Post not found: ${postId}` };

  if (!post.assets?.imagePrompts) {
    const taskPath = await createCodexTask("generate-image-prompts", {
      postId,
      visualDecision: post.visualDecision || null,
      instruction:
        "Generate Image Prompts from the selected Visual Style Options, then update the post assets.",
    });
    post.status = "Generate Image";
    post.nextStep = "Image prompt generation task created for Codex.";
    await writeJson("ui/data/xhs-data.json", data);
    return { ok: true, mode: "codex_task", taskPath, post };
  }

  post.status = "Generate Image";
  post.nextStep = "Image prompts are ready. Use Images to generate carousel pages.";
  await writeJson("ui/data/xhs-data.json", data);
  return { ok: true, mode: "existing_asset", post };
}

async function extractPromptsFromMarkdown(relativePath, pages = []) {
  const markdown = await readFile(safeJoin(relativePath), "utf8");
  const selectedPages = new Set((pages || []).map((page) => String(page)));
  const chunks = markdown.split(/\n## Page\s+/).slice(1);
  const prompts = [];

  for (const chunk of chunks) {
    const pageMatch = chunk.match(/^(\d+)/);
    const page = pageMatch?.[1];
    if (!page || (selectedPages.size && !selectedPages.has(page))) continue;
    const promptMatch = chunk.match(/Prompt:\s*\n+```text\s*([\s\S]*?)```/);
    if (promptMatch?.[1]?.trim()) {
      prompts.push({ page, prompt: promptMatch[1].trim() });
    }
  }
  return prompts;
}

async function generateImages(body) {
  const { postId, pages = [1, 4] } = body;
  if (!postId) return { ok: false, error: "postId is required" };

  const data = await readJson("ui/data/xhs-data.json");
  const post = [...data.posts, ...data.publishedPosts].find((item) => item.id === postId);
  if (!post) return { ok: false, error: `Post not found: ${postId}` };

  const imagePromptPath = post.sourceAssets?.imagePrompts;
  if (!imagePromptPath) return { ok: false, error: "This post has no image prompts asset." };
  const prompts = await extractPromptsFromMarkdown(imagePromptPath, pages);
  if (!prompts.length) return { ok: false, error: "No page prompts found for requested pages." };

  if (!process.env.OPENAI_API_KEY) {
    const taskPath = await createCodexTask("generate-images", {
      postId,
      pages,
      prompts,
      instruction:
        "Use the Codex image generation tool to create these XHS 3:4 carousel pages. Save outputs under content_pipeline/generated_images/{postId}/.",
    });
    post.status = "Generate Image";
    post.nextStep = "Image generation task created for Codex.";
    await writeJson("ui/data/xhs-data.json", data);
    return { ok: true, mode: "codex_task", taskPath, prompts, post };
  }

  const outputDir = safeJoin("content_pipeline", "generated_images", postId);
  await mkdir(outputDir, { recursive: true });
  const generated = [];

  for (const item of prompts) {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: imageModel,
        prompt: item.prompt,
        size: "1024x1536",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI image API failed for page ${item.page}: ${errorText}`);
    }

    const result = await response.json();
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error(`No image data returned for page ${item.page}`);
    const filename = `page-${String(item.page).padStart(2, "0")}.png`;
    const outputPath = path.join(outputDir, filename);
    await writeFile(outputPath, Buffer.from(b64, "base64"));
    generated.push({
      page: item.page,
      path: path.relative(rootDir, outputPath).replaceAll("\\", "/"),
    });
  }

  post.generatedImages = [...(post.generatedImages || []), ...generated];
  post.status = "Generate Image";
  post.nextStep = "Images generated. Review mobile readability before publishing.";
  await writeJson("ui/data/xhs-data.json", data);
  return { ok: true, mode: "openai_api", model: imageModel, generated, post };
}

async function handleApi(req, res, url) {
  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      return send(res, 200, {
        ok: true,
        server: "xhs-ops-codex",
        imageMode: process.env.OPENAI_API_KEY ? "openai_api" : "codex_task_queue",
        imageModel,
      });
    }
    if (req.method === "GET" && url.pathname === "/api/data") {
      return send(res, 200, await readJson("ui/data/xhs-data.json"));
    }
    if (req.method === "GET" && url.pathname === "/api/linkedin-overrides") {
      return send(res, 200, await readLinkedInOverrides());
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
    if (req.method === "POST" && url.pathname === "/api/visual-option") {
      return send(res, 200, await selectVisualOption(await readRequestJson(req)));
    }
    if (req.method === "POST" && url.pathname === "/api/generate-image-prompts") {
      return send(res, 200, await markImagePromptsReady(await readRequestJson(req)));
    }
    if (req.method === "POST" && url.pathname === "/api/generate-images") {
      return send(res, 200, await generateImages(await readRequestJson(req)));
    }
    if (req.method === "POST" && url.pathname === "/api/image-workflow/carousel-script") {
      return send(res, 200, await generateCarouselScript(await readRequestJson(req)));
    }
    if (req.method === "POST" && url.pathname === "/api/image-workflow/image-prompts") {
      return send(res, 200, await generateWorkflowImagePrompts(await readRequestJson(req)));
    }
    if (req.method === "POST" && url.pathname === "/api/image-workflow/generate-images") {
      return send(res, 200, await generateWorkflowImages(await readRequestJson(req)));
    }
    if (req.method === "POST" && url.pathname === "/api/image-workflow/accept-package") {
      return send(res, 200, await acceptImagePackage(await readRequestJson(req)));
    }
    if (req.method === "POST" && url.pathname === "/api/topics/status") {
      return send(res, 200, await updateTopicStatus(await readRequestJson(req)));
    }
    if (req.method === "POST" && url.pathname === "/api/topics/platform") {
      return send(res, 200, await updateTopicPlatform(await readRequestJson(req)));
    }
    if (req.method === "POST" && url.pathname === "/api/linkedin/topics/platform") {
      return send(res, 200, await updateLinkedInTopicPlatform(await readRequestJson(req)));
    }
    if (req.method === "POST" && url.pathname === "/api/source-registry/autodiscover") {
      return send(res, 200, await autoDiscoverSource(await readRequestJson(req)));
    }
    if (req.method === "POST" && url.pathname === "/api/source-registry/source") {
      return send(res, 200, await addSourceRegistrySource(await readRequestJson(req)));
    }
    if (
      (req.method === "PATCH" || req.method === "POST") &&
      url.pathname === "/api/source-registry/source"
    ) {
      return send(res, 200, await updateSourceRegistrySource(await readRequestJson(req)));
    }
    if (req.method === "POST" && url.pathname === "/api/source-registry/archive") {
      return send(res, 200, await archiveSourceRegistrySource(await readRequestJson(req)));
    }
    if (req.method === "POST" && url.pathname === "/api/nljr-feed/generate") {
      return send(res, 200, await generateNLJRFeed());
    }
    if (req.method === "POST" && url.pathname === "/api/nljr-feed/refresh") {
      const result = await refreshNljr();
      if (result && result.date) {
        await updateMarkdownIndices(result.date);
      }
      return send(res, 200, { ok: true, result });
    }
    if (req.method === "POST" && url.pathname === "/api/topics/add-to-posts") {
      return send(res, 200, await addTopicToPosts(await readRequestJson(req)));
    }
    if (req.method === "POST" && url.pathname === "/api/posts/cancel") {
      return send(res, 200, await cancelPostDraft(await readRequestJson(req)));
    }
    if (req.method === "POST" && url.pathname === "/api/drafts/accept") {
      return send(res, 200, await acceptDraft(await readRequestJson(req)));
    }
    if (req.method === "POST" && url.pathname === "/api/generate-draft") {
      return send(res, 200, await generateDraft(await readRequestJson(req)));
    }
    return send(res, 404, { ok: false, error: "API route not found" });
  } catch (error) {
    return send(res, 500, { ok: false, error: error.message });
  }
}

async function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  let requested;

  if (pathname === "/" || pathname === "/index.html") {
    res.writeHead(302, { Location: "/xhs" });
    res.end();
    return;
  } else if (pathname === "/xhs") {
    pathname = "/ui/index.html";
  } else if (pathname === "/NLJR" || pathname === "/nljr") {
    pathname = "/ui/nljr.html";
  }

  if (pathname.startsWith("/not-long-just-read/content_pipeline/") || pathname === "/not-long-just-read/NLJR.md") {
    const relative = pathname.substring("/not-long-just-read/".length);
    requested = path.join(NLJR_DATA_DIR, relative);
  } else {
    // Try resolving it relative to the root
    const rootPath = safeJoin(pathname.replace(/^\/+/, ""));
    const rootStat = await stat(rootPath).catch(() => null);
    if (rootStat && rootStat.isFile()) {
      requested = rootPath;
    } else {
      // Try finding it under ui/ subfolder
      const uiPath = safeJoin(path.join("ui", pathname.replace(/^\/+/, "")));
      const uiStat = await stat(uiPath).catch(() => null);
      if (uiStat && uiStat.isFile()) {
        requested = uiPath;
      } else {
        requested = rootPath; // fallback to root path for 404 handling
      }
    }
  }

  const fileStat = await stat(requested).catch(() => null);
  if (!fileStat?.isFile()) {
    return send(res, 404, "Not found", "text/plain; charset=utf-8");
  }
  const extension = path.extname(requested).toLowerCase();
  res.writeHead(200, { "Content-Type": contentTypes[extension] || "application/octet-stream" });
  createReadStreamSafe(requested, res);
}

function createReadStreamSafe(filePath, res) {
  const stream = createReadStreamCompat(filePath);
  stream.on("error", () => send(res, 500, "Could not read file", "text/plain; charset=utf-8"));
  stream.pipe(res);
}

function createReadStreamCompat(filePath) {
  return createReadStream(filePath);
}

createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || `127.0.0.1:${port}`}`);
  if (url.pathname.startsWith("/api/")) {
    return handleApi(req, res, url);
  }
  return serveStatic(req, res, url).catch((error) => {
    send(res, 500, error.message, "text/plain; charset=utf-8");
  });
}).listen(port, host, () => {
  console.log(`XHS Ops server running locally at http://127.0.0.1:${port}/ui/index.html`);
  console.log(`LAN access URL: http://${lanHost}:${port}/ui/index.html`);
});
