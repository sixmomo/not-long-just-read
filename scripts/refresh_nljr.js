import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

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

const DATA_DIR = process.env.OPS_DATA_DIR || path.join(ROOT, "ui", "data");
const REGISTRY_PATH = path.join(DATA_DIR, "source-registry.json");
const LEDGER_PATH = path.join(DATA_DIR, "nljr-article-ledger.json");
const FEED_PATH = path.join(DATA_DIR, "nljr-feed.json");
const ARCHIVE_DIR = path.join(DATA_DIR, "content_pipeline", "nljr_archive");

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0 Safari/537.36";
const DISCOVERY_WINDOW_HOURS = 48;
const TOP_ITEM_LIMIT = 10;
const RECOMMENDED_LIMIT = 3;
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

const INSUFFICIENT_CONTENT_REASON = "Insufficient source content to summarize accurately.";
const JOB_ROUNDUP_SKIP_REASON = "Job-board roundup lists openings but does not add enough reusable analysis or framework for this NLJR edition.";
const OFF_FOCUS_SKIP_REASON = "Substantive but off-focus for momo's current AI PM / AI Ops editorial themes.";

export function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitSentences(text) {
  if (!text) return [];
  const normalized = text.replace(/\s+/g, " ").trim();
  // Split on punctuation followed by space
  return normalized.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
}

export function isLowValueSentence(sentence) {
  const lowered = sentence.toLowerCase().trim();
  if (!lowered) return true;
  const blockedPhrases = [
    "watch now |",
    "listen now |",
    "restack this post",
    "join this whatsapp channel",
    "production and marketing by",
    "for inquiries about sponsoring",
    "use claude code with openrouter",
    "leaderboard",
    "get $",
    "annual subscriber",
    "founding subscriber",
    "certification",
    "learn more",
    "check out sentry",
    "get started",
    "bundle",
    "subscribe",
    "sign in",
    "download",
    "sponsor"
  ];
  if (lowered.startsWith("http://") || lowered.startsWith("https://")) return true;
  if (/^\(?\s*\d{1,2}:\d{2}\s*\)?/.test(lowered)) return true; // Timestamp pattern
  return blockedPhrases.some(phrase => lowered.includes(phrase));
}

export function dedupeSentences(sentences) {
  const seen = new Set();
  const ordered = [];
  for (const sentence of sentences) {
    if (isLowValueSentence(sentence)) continue;
    const fingerprint = sentence.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (!fingerprint || seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    ordered.push(sentence);
  }
  return ordered;
}

export function cleanText(text) {
  return stripHtml(text);
}

export function slugify(value) {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug.slice(0, 80) || "item";
}

export function normalizeUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    let pathname = url.pathname.replace(/\/$/, "") || "/";
    
    // Clean up tracking queries
    const trackingKeys = ["fbclid", "gclid", "ref", "source"];
    const params = new URLSearchParams(url.search);
    const cleanParams = new URLSearchParams();
    for (const [key, val] of params.entries()) {
      if (!key.toLowerCase().startsWith("utm_") && !trackingKeys.includes(key.toLowerCase())) {
        cleanParams.append(key, val);
      }
    }
    const searchString = cleanParams.toString();
    return `${url.protocol}//${url.host.toLowerCase()}${pathname}${searchString ? "?" + searchString : ""}`;
  } catch {
    return "";
  }
}

export function parseRss(xmlText) {
  const items = [];
  
  // Try parsing RSS <item> structures
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const content = match[1];
    const titleMatch = content.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = content.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const dateMatch = content.match(/<(?:pubDate|published|updated)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:pubDate|published|updated)>/i);
    if (linkMatch) {
      const url = normalizeUrl(linkMatch[1]);
      if (url) {
        items.push({
          title: titleMatch ? cleanText(titleMatch[1]) : "",
          url,
          publishedAtIso: dateMatch ? new Date(dateMatch[1].trim()).toISOString() : new Date().toISOString(),
          publishedAt: dateMatch ? new Date(dateMatch[1].trim()).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
        });
      }
    }
  }

  // Try parsing Atom <entry> structures if no RSS items found
  if (items.length === 0) {
    const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
    while ((match = entryRegex.exec(xmlText)) !== null) {
      const content = match[1];
      const titleMatch = content.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
      const linkMatch = content.match(/<link[^>]+href=["']([^"']+)["']/i);
      const dateMatch = content.match(/<(?:published|updated)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:published|updated)>/i);
      if (linkMatch) {
        const url = normalizeUrl(linkMatch[1]);
        if (url) {
          items.push({
            title: titleMatch ? cleanText(titleMatch[1]) : "",
            url,
            publishedAtIso: dateMatch ? new Date(dateMatch[1].trim()).toISOString() : new Date().toISOString(),
            publishedAt: dateMatch ? new Date(dateMatch[1].trim()).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
          });
        }
      }
    }
  }

  return items;
}

export function parseHtmlData(htmlText) {
  const titleMatch = htmlText.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || htmlText.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
  const descMatch = htmlText.match(/<meta\s+name="description"\s+content="([^"]+)"/i) || htmlText.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
  
  const title = titleMatch ? cleanText(titleMatch[1]) : "";
  const description = descMatch ? cleanText(descMatch[1]) : "";
  
  const paragraphs = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = pRegex.exec(htmlText)) !== null) {
    const rawText = match[1];
    const text = stripHtml(rawText);
    if (text.length > 70 && !isLowValueSentence(text)) {
      paragraphs.push(text);
      if (paragraphs.length >= 8) break;
    }
  }
  return { title, description, paragraphs };
}

function articleCutoff(source) {
  if (source.lastCheckedAt) {
    try {
      return new Date(source.lastCheckedAt);
    } catch {
      // Fallback below
    }
  }
  return new Date(Date.now() - DISCOVERY_WINDOW_HOURS * 60 * 60 * 1000);
}

function sourceScanUrl(source, preferHtml = false) {
  if (preferHtml) {
    return (source.archiveUrl || source.homepageUrl || source.url || source.feedUrl || "").trim();
  }
  return (source.feedUrl || source.archiveUrl || source.homepageUrl || source.url || "").trim();
}

function canonicalCandidates(source) {
  return new Set([
    normalizeUrl(source.feedUrl),
    normalizeUrl(source.archiveUrl),
    normalizeUrl(source.homepageUrl),
    normalizeUrl(source.url)
  ].filter(Boolean));
}

function isDirectArticleUrl(source, url) {
  const normalized = normalizeUrl(url);
  if (!normalized) return false;
  if (canonicalCandidates(source).has(normalized)) return false;
  
  try {
    const parsed = new URL(normalized);
    if (parsed.pathname === "" || parsed.pathname === "/") return false;
    
    const loweredPath = parsed.pathname.toLowerCase();
    
    // Block typical assets/media files
    const blockedExtensions = [
      ".css", ".js", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
      ".woff", ".woff2", ".ttf", ".eot", ".mp4", ".mp3", ".wav", ".pdf"
    ];
    if (blockedExtensions.some(ext => loweredPath.endsWith(ext))) return false;
    
    const blockedSegments = [
      "/archive", "/feed", "/tag/", "/tags/", "/category/",
      "/privacy", "/ccpa", "/tos", "/terms", "/about", "/contact",
      "/help", "/support", "/login", "/signup", "/signin", "/signout",
      "/logout", "/podcast"
    ];
    if (blockedSegments.some(segment => loweredPath.includes(segment))) return false;
    
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath, fallback) {
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

async function fetchWithTimeout(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal
    });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function discoverArticles(source, cutoff) {
  const scanUrl = sourceScanUrl(source);
  if (!scanUrl) return [];

  const response = await fetchWithTimeout(scanUrl);
  if (!response.ok) throw new Error(`HTTP error ${response.status} fetching ${scanUrl}`);
  
  const text = await response.text();
  const discoveries = parseRss(text);

  // If RSS parse yields nothing, try scanning HTML links as a fallback (similar to Python logic)
  if (discoveries.length === 0) {
    const urlPattern = /href=["']([^"']+)["']/gi;
    const seen = new Set();
    const cleanScanUrl = normalizeUrl(scanUrl);
    const scanPath = cleanScanUrl ? new URL(cleanScanUrl).pathname.replace(/\/$/, "") : "";
    
    let match;
    while ((match = urlPattern.exec(text)) !== null) {
      let href = match[1];
      if (href.startsWith("/")) {
        try {
          const base = new URL(scanUrl);
          href = `${base.protocol}//${base.host}${href}`;
        } catch {}
      }
      const normalizedHref = normalizeUrl(href);
      if (!normalizedHref || seen.has(normalizedHref) || !isDirectArticleUrl(source, normalizedHref)) {
        continue;
      }
      
      try {
        const parsedHref = new URL(normalizedHref);
        if (scanPath && scanPath !== "/" && !parsedHref.pathname.startsWith(scanPath + "/")) {
          continue;
        }
      } catch {
        continue;
      }
      
      seen.add(normalizedHref);
      discoveries.push({
        title: normalizedHref,
        url: normalizedHref,
        publishedAtIso: new Date().toISOString(),
        publishedAt: new Date().toISOString().slice(0, 10)
      });
    }
  }

  // Filter items published after the cutoff date
  return discoveries.filter(item => {
    try {
      if (item.url && item.url.includes("/shorts/")) {
        return false;
      }
      const pubDate = new Date(item.publishedAtIso);
      return pubDate > cutoff;
    } catch {
      return false;
    }
  });
}

async function latestSeenTitle(source) {
  try {
    const scanUrl = sourceScanUrl(source);
    if (!scanUrl) return "";
    const res = await fetchWithTimeout(scanUrl);
    if (!res.ok) return "";
    const xmlText = await res.text();
    const discoveries = parseRss(xmlText);
    return discoveries.length ? discoveries[0].title : "";
  } catch {
    return "";
  }
}

function ledgerUrlIndex(ledger, feed) {
  const urls = new Set();
  if (Array.isArray(ledger.articles)) {
    ledger.articles.forEach(article => {
      const norm = normalizeUrl(article.url);
      if (norm) urls.add(norm);
    });
  }
  if (feed.today && Array.isArray(feed.today.items)) {
    feed.today.items.forEach(item => {
      const norm = normalizeUrl(item.url);
      if (norm) urls.add(norm);
    });
  }
  return urls;
}

function articleId(title, url) {
  const fingerprint = crypto.createHash("sha1").update(url).digest("hex").slice(0, 10);
  return `article-${slugify(title)}-${fingerprint}`;
}

function addDiscoveryToLedger(ledger, source, discovery, discoveredAt) {
  const article = {
    id: articleId(discovery.title || discovery.url, discovery.url),
    sourceId: source.id,
    sourceName: source.name,
    title: discovery.title || discovery.url,
    url: discovery.url,
    publishedAt: discovery.publishedAt || "",
    discoveredAt,
    relevance: source.relevance || ["Strategy"],
    suggestedUse: buildSuggestedUse(source),
    priority: source.priority || "medium",
    status: "new"
  };
  if (!ledger.articles) ledger.articles = [];
  ledger.articles.unshift(article);
  return article;
}

function buildSuggestedUse(source) {
  const uses = ["Topic seed", "Strategy signal"];
  const relevance = new Set(source.relevance || []);
  if (relevance.has("XHS")) uses.push("XHS angle");
  if (relevance.has("LinkedIn")) uses.push("LinkedIn angle");
  return uses;
}

function sentenceTrim(text, limit = 280) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;
  const cut = normalized.slice(0, limit).trim();
  if (cut.includes(". ")) {
    return cut.slice(0, cut.lastIndexOf(". ") + 1);
  }
  return cut + "...";
}

function summaryFromContent(description, paragraphs) {
  const sentences = splitSentences(description);
  for (const paragraph of paragraphs.slice(0, 4)) {
    sentences.push(...splitSentences(paragraph));
  }
  const ordered = dedupeSentences(sentences);
  if (ordered.length === 0) return "";
  return sentenceTrim(ordered.slice(0, 4).join(" "), 700);
}

function buildWhyItMatters(article, source) {
  const sourceName = source.name || "this source";
  const tags = (source.tags || []).join(", ");
  const summary = sentenceTrim(article.summary || article.title || "This post", 220);
  if (tags) {
    return `${sourceName} is a tracked source for ${tags}. ${summary} This is relevant because it adds a fresh signal from that stream without repeating older NLJR items.`;
  }
  return `${sourceName} is an active NLJR subscription. ${summary} This is relevant because it is newly published and not yet represented in the ledger.`;
}

function buildConciseWhyRelevant(article, source) {
  const title = article.title || "This piece";
  const tags = (source.tags || []).slice(0, 2).join(", ");
  if (tags) {
    return sentenceTrim(`${title} is a fresh ${tags} signal with reuse potential for momo's strategy work.`, 180);
  }
  return sentenceTrim(`${title} is newly published and worth scanning for reusable strategy language.`, 180);
}

function buildTopicAngle(article, source) {
  const title = article.title || "this post";
  const tags = source.tags || [];
  if (tags.length) {
    return sentenceTrim(`${title} is a current ${tags.slice(0, 3).join(", ")} signal worth tracking for future commentary.`);
  }
  return sentenceTrim(`${title} is a fresh signal from ${source.name || "a tracked source"}.`);
}async function summarizeArticle(article, source) {
  if (article.curatedSummary) return;
  const response = await fetchWithTimeout(article.url);
  if (!response.ok) throw new Error(`HTTP error ${response.status} fetching article page ${article.url}`);
  
  const text = await response.text();
  const pageData = parseHtmlData(text);
  
  if (pageData.paragraphs.length === 0 && !pageData.description) {
    throw new Error(INSUFFICIENT_CONTENT_REASON);
  }

  const title = pageData.title || article.title || article.url;
  article.title = title;

  const fallbackSummary = summaryFromContent(pageData.description, pageData.paragraphs);
  const finalFallback = fallbackSummary || sentenceTrim(pageData.description || `${title} is a new post from ${source.name || "this source"}.`, 700);

  if (process.env.OPENAI_API_KEY) {
    try {
      console.log(`Using OpenAI to summarize: ${title}...`);
      const contentToSummarize = `Title: ${title}\nDescription: ${pageData.description}\n\nContent:\n${pageData.paragraphs.slice(0, 12).join("\n\n")}`;
      
      const systemPrompt = `Act as a professional newsletter curator. Based on the 24-hour new updates from subscription list, including newsletters, or technical deep dives. Please extract and format the core information into a 'Not-Long-Just-Read' daily briefing using the following structure:
The Hook/TL;DR: Start with a one-sentence summary of the main topic.
The Core Insight: Provide one punchy, high-level takeaway that explains the 'why' or 'so what.'
Key Takeaways (List): Provide 3-5 numbered bullet points. Each point should be concise (1-2 sentences) and focus on actionable insights, specific tools mentioned, or clear shifts in strategy.
Actionable Workflows: If the source material describes a specific process or tool setup, summarize it in a 1-2 sentence 'How-To' format. (If there are no workflows, omit this section).
Closing Thought: One sentence summarizing the broader implication of this content for a professional or builder.

Tone & Style Guidelines:
Maintain an expert, direct, and efficient voice.
Prioritize clarity over fluff; remove all marketing preamble.
If technical terms are used, ensure they are contextualized simply.
Do not include links, ads, or promotional content.`;

      const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Please summarize this article:\n\n${contentToSummarize}` }
          ],
          temperature: 0.3
        })
      });

      if (apiRes.ok) {
        const apiData = await apiRes.json();
        const llmSummary = apiData.choices?.[0]?.message?.content;
        if (llmSummary) {
          article.summary = llmSummary.trim();
          
          const hookMatch = article.summary.match(/The Hook\/TL;DR:\s*(.*)/i);
          article.conciseSummary = hookMatch ? hookMatch[1].trim() : sentenceTrim(splitSentences(article.summary).slice(0, 2).join(" "), 280);
          
          const coreInsightMatch = article.summary.match(/The Core Insight:\s*(.*)/i);
          article.whyItMatters = coreInsightMatch ? coreInsightMatch[1].trim() : buildWhyItMatters(article, source);
          article.conciseWhyRelevant = buildConciseWhyRelevant(article, source);
          article.topicAngle = buildTopicAngle(article, source);
          article.relevance = source.relevance || article.relevance || ["Strategy"];
          article.suggestedUse = buildSuggestedUse(source);
          article.priority = source.priority || article.priority || "medium";
          return;
        }
      } else {
        console.error(`OpenAI API failed: HTTP ${apiRes.status}`);
      }
    } catch (err) {
      console.error("OpenAI summarization failed, using local fallback:", err.message);
    }
  }

  article.summary = finalFallback;
  article.conciseSummary = sentenceTrim(splitSentences(article.summary).slice(0, 2).join(" "), 280);
  article.whyItMatters = buildWhyItMatters(article, source);
  article.conciseWhyRelevant = buildConciseWhyRelevant(article, source);
  article.topicAngle = buildTopicAngle(article, source);
  article.relevance = source.relevance || article.relevance || ["Strategy"];
  article.suggestedUse = buildSuggestedUse(source);
  article.priority = source.priority || article.priority || "medium";
}

function postSummarySkipReason(article, source) {
  const title = String(article.title || "").toLowerCase();
  const summary = String(article.summary || "").toLowerCase();
  const sourceId = String(source.id || "");
  const sourceTags = new Set((source.tags || []).map(t => String(t).toLowerCase()));
  
  if (sourceId === "subscription-career-brew") return JOB_ROUNDUP_SKIP_REASON;
  if (
    (title.includes("jobs") || title.includes("job") || title.includes("hiring")) &&
    (sourceTags.has("jobs") || sourceTags.has("career")) &&
    ((summary.match(/hiring/g) || []).length >= 2 || summary.includes("paying up to"))
  ) {
    return JOB_ROUNDUP_SKIP_REASON;
  }
  
  const offFocusTerms = ["artemis", "nasa", "moon", "lunar", "astronaut", "spaceflight", "rocket", "mars"];
  const focusTerms = [
    " ai", "agent", "model", "llm", "gpu", "cloud", "product", "growth",
    "pm", "workflow", "startup", "company", "business", "customer",
    "coding", "software", "research", "team"
  ];
  
  const combined = `${title} ${summary}`;
  if (offFocusTerms.some(term => combined.includes(term)) && !focusTerms.some(term => combined.includes(term))) {
    return OFF_FOCUS_SKIP_REASON;
  }
  return "";
}

function sortFeedArticles(articles) {
  return [...articles].sort((a, b) => {
    if (a.forceInclude && !b.forceInclude) return -1;
    if (!a.forceInclude && b.forceInclude) return 1;
    
    const priorityDiff = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
    if (priorityDiff !== 0) return priorityDiff;
    
    const dateA = String(a.publishedAt || a.discoveredAt || "");
    const dateB = String(b.publishedAt || b.discoveredAt || "");
    return dateB.localeCompare(dateA);
  });
}

function releaseScheduledArticles(ledger, registry, date) {
  const sourceModes = {};
  if (Array.isArray(registry.sources)) {
    registry.sources.forEach(s => {
      if (s.id) sourceModes[s.id] = s.sourceMode;
    });
  }
  if (Array.isArray(ledger.articles)) {
    ledger.articles.forEach(article => {
      const scheduledFor = String(article.scheduledFor || "");
      if (
        article.status === "queued" &&
        scheduledFor &&
        scheduledFor <= date &&
        sourceModes[article.sourceId] === "subscription"
      ) {
        article.status = "new";
      }
    });
  }
}

function selectArticles(ledger) {
  const candidates = (ledger.articles || []).filter(article => article.status === "new");
  return sortFeedArticles(candidates).slice(0, TOP_ITEM_LIMIT);
}

function markArticleSkipped(article, reason, timestamp) {
  article.status = "skipped";
  article.skippedAt = timestamp;
  article.skipReason = reason;
}

function buildFeedItem(article, date, index) {
  return {
    id: `${date}-${slugify(article.id || article.title || article.url)}-${index + 1}`,
    articleId: article.id,
    sourceId: article.sourceId,
    sourceName: article.sourceName || "Unknown source",
    title: article.title || "Untitled article",
    url: article.url || "",
    publishedAt: article.publishedAt || "",
    summary: article.summary || "",
    whyItMatters: article.whyItMatters || "",
    conciseSummary: article.conciseSummary || "",
    conciseWhyRelevant: article.conciseWhyRelevant || "",
    relevance: article.relevance || [],
    suggestedUse: article.suggestedUse || ["Topic seed", "Strategy signal"],
    topicAngle: article.topicAngle || "",
    priority: article.priority || "medium",
    detailLevel: index < RECOMMENDED_LIMIT ? "recommended" : "brief"
  };
}

function buildArchiveMarkdown(todayFeed) {
  const items = todayFeed.items || [];
  const recommendedIds = new Set(todayFeed.recommendedItemIds || []);
  
  const recommended = items.filter((item, index) =>
    recommendedIds.size ? recommendedIds.has(item.articleId || item.id) : index < RECOMMENDED_LIMIT
  );
  const recommendedItemIds = new Set(recommended.map(item => item.id));
  const additional = items.filter(item => !recommendedItemIds.has(item.id));
  
  const lines = [
    `# NLJR Daily Feed - ${todayFeed.date}`,
    "",
    `Generated at: ${todayFeed.generatedAt}`,
    "",
    "## Recommended Deep Reads",
    ""
  ];

  if (recommended.length === 0) {
    lines.push("No new qualifying posts were found.", "");
  }

  recommended.forEach((item, index) => {
    lines.push(
      `### ${index + 1}. ${item.title}`,
      "",
      `Source: ${item.sourceName}`,
      `URL: ${item.url}`,
      `Published: ${item.publishedAt}`,
      "",
      "#### Summary",
      "",
      item.summary,
      "",
      "#### Why It Matters",
      "",
      item.whyItMatters,
      "",
      "#### Relevance",
      "",
      item.relevance.join(", "),
      "",
      "#### Suggested Use",
      "",
      item.suggestedUse.join(", "),
      "",
      "#### Topic Angle",
      "",
      item.topicAngle,
      "",
      `#### Priority\n\n${item.priority}`,
      ""
    );
  });

  lines.push("## More New Feeds", "");
  if (additional.length === 0) {
    lines.push("No additional qualifying feeds.", "");
  }

  additional.forEach((item, index) => {
    lines.push(
      `### ${index + recommended.length + 1}. ${item.title}`,
      "",
      `Source: ${item.sourceName}`,
      `URL: ${item.url}`,
      `Published: ${item.publishedAt}`,
      "",
      item.conciseSummary || item.summary,
      "",
      `Why read: ${item.conciseWhyRelevant || item.whyItMatters}`,
      ""
    );
  });

  const health = todayFeed.sourceHealth || {};
  lines.push(
    "## Source Health",
    "",
    `- Active sources: ${health.activeSources || 0}`,
    `- Active subscriptions: ${health.activeSubscriptions || 0}`,
    `- Sources checked: ${health.sourcesChecked || 0}`,
    `- Source errors: ${health.sourceErrors || 0}`,
    `- Need URL confirmation: ${health.needsUrlConfirmation || 0}`,
    `- Keyword watches: ${health.keywordWatches || 0}`,
    `- New articles available: ${health.newArticlesAvailable || 0}`,
    `- Processed articles: ${health.processedArticles || 0}`,
    ""
  );

  if (health.errorSources && health.errorSources.length > 0) {
    lines.push("## Source Errors", "");
    health.errorSources.forEach(item => {
      lines.push(`- ${item.name}: ${item.reason}`);
    });
    lines.push("");
  }
  return lines.join("\n");
}

export async function refresh(dryRun = false) {
  const registry = await readJson(REGISTRY_PATH, { meta: {}, sources: [] });
  const ledger = await readJson(LEDGER_PATH, { meta: { name: "NLJR Article Ledger", updatedAt: "" }, articles: [] });
  const feed = await readJson(FEED_PATH, { today: {}, archive: [] });
  
  const scanTime = new Date().toISOString();
  const date = new Date().toISOString().slice(0, 10);
  
  releaseScheduledArticles(ledger, registry, date);
  
  const activeSources = (registry.sources || []).filter(s => s.status === "active");
  const activeSubscriptions = activeSources.filter(s => s.sourceMode === "subscription");
  const keywordWatches = activeSources.filter(s => s.sourceMode === "keyword_watch");
  const needsUrl = activeSources.filter(s => String(s.sourceConfidence || "").includes("needs"));
  
  const existingUrls = ledgerUrlIndex(ledger, feed);
  let newArticlesDiscovered = 0;
  const sourceErrors = [];

  // Parallel scanning of subscriptions using native Promise.all
  console.log(`Scanning ${activeSubscriptions.length} subscriptions in parallel...`);
  const scanPromises = activeSubscriptions.map(async (source) => {
    const cutoff = articleCutoff(source);
    try {
      const discoveries = await discoverArticles(source, cutoff);
      // Sort newest first
      discoveries.sort((a, b) => b.publishedAtIso.localeCompare(a.publishedAtIso));
      
      const uniqueDiscoveries = [];
      const localSeen = new Set();
      for (const disc of discoveries) {
        const norm = normalizeUrl(disc.url);
        if (norm && !existingUrls.has(norm) && !localSeen.has(norm)) {
          localSeen.add(norm);
          uniqueDiscoveries.push(disc);
        }
      }

      if (!dryRun) {
        for (const disc of uniqueDiscoveries) {
          addDiscoveryToLedger(ledger, source, disc, scanTime);
          existingUrls.add(disc.url);
        }
      }

      let newestTitle = "";
      if (discoveries.length) {
        newestTitle = discoveries[0].title || discoveries[0].url || "";
      } else {
        newestTitle = await latestSeenTitle(source);
      }

      if (!dryRun) {
        source.scanStatus = uniqueDiscoveries.length ? "healthy" : "no_new_posts";
        source.lastCheckedAt = scanTime;
        source.lastItemSeen = newestTitle;
        source.lastError = "";
      }

      return { sourceId: source.id, count: uniqueDiscoveries.length };
    } catch (err) {
      if (!dryRun) {
        source.scanStatus = "error";
        source.lastCheckedAt = scanTime;
        source.lastError = err.message;
      }
      sourceErrors.push({ sourceId: source.id, name: source.name, reason: err.message });
      return { sourceId: source.id, count: 0 };
    }
  });

  const scanResults = await Promise.all(scanPromises);
  newArticlesDiscovered = scanResults.reduce((sum, res) => sum + res.count, 0);

  // Select new articles to process and summarize
  const selectedArticles = selectArticles(ledger);
  console.log(`Summarizing ${selectedArticles.length} articles in parallel...`);
  
  // Parallel fetching/processing of summaries
  const summaryPromises = selectedArticles.map(async (article) => {
    const source = (registry.sources || []).find(s => s.id === article.sourceId) || {};
    try {
      await summarizeArticle(article, source);
      const skipReason = postSummarySkipReason(article, source);
      if (skipReason && !dryRun) {
        markArticleSkipped(article, skipReason, scanTime);
      }
    } catch (err) {
      if (!dryRun) {
        if (err.message === INSUFFICIENT_CONTENT_REASON) {
          markArticleSkipped(article, err.message, scanTime);
        } else {
          article.status = "failed";
          article.lastError = err.message;
        }
      }
    }
  });
  await Promise.all(summaryPromises);

  // Finalize ledger statuses
  const processedArticles = [];
  if (!dryRun) {
    const selectedIds = new Set(selectedArticles.filter(a => a.status === "new").map(a => a.id));
    (ledger.articles || []).forEach(article => {
      if (selectedIds.has(article.id)) {
        article.status = "processed";
        article.processedAt = scanTime;
        article.includedIn = date;
      }
    });

    // Capture today's processed articles
    (ledger.articles || []).forEach(article => {
      if (article.status === "processed" && article.includedIn === date) {
        processedArticles.push(article);
      }
    });
  } else {
    processedArticles.push(...selectedArticles);
  }

  const feedArticles = sortFeedArticles(processedArticles).slice(0, TOP_ITEM_LIMIT);
  const items = feedArticles.map((article, index) => buildFeedItem(article, date, index));

  if (!dryRun) {
    if (ledger.meta) ledger.meta.updatedAt = date;
    if (registry.meta) registry.meta.updatedAt = date;
  }

  const todayFeed = {
    date,
    status: items.length ? "generated" : "no_new_posts",
    generatedAt: scanTime,
    items,
    recommendedItemIds: items.slice(0, RECOMMENDED_LIMIT).map(item => item.articleId || item.id),
    sourceHealth: {
      activeSources: activeSources.length,
      activeSubscriptions: activeSubscriptions.length,
      sourcesChecked: activeSubscriptions.length,
      sourceErrors: sourceErrors.length,
      needsUrlConfirmation: needsUrl.length,
      keywordWatches: keywordWatches.length,
      newArticlesAvailable: (ledger.articles || []).filter(a => a.status === "new").length,
      processedArticles: (ledger.articles || []).filter(a => a.status === "processed").length,
      newArticlesDiscovered,
      errorSources: sourceErrors
    }
  };

  const archiveMarkdown = buildArchiveMarkdown(todayFeed);
  const archivePath = path.join(ARCHIVE_DIR, `${date}.md`);
  const relativeArchivePath = `content_pipeline/nljr_archive/${date}.md`;

  if (!dryRun) {
    await fs.mkdir(ARCHIVE_DIR, { recursive: true });
    await fs.writeFile(archivePath, archiveMarkdown, "utf8");

    const archiveEntry = {
      date,
      path: relativeArchivePath,
      itemCount: items.length,
      generatedAt: scanTime,
      summary: items.map(item => item.sourceName).join(", ") || "No new qualifying posts."
    };

    const newArchive = [archiveEntry, ...(feed.archive || []).filter(entry => entry.date !== date)];
    const feedData = { today: todayFeed, archive: newArchive };

    await writeJson(REGISTRY_PATH, registry);
    await writeJson(LEDGER_PATH, ledger);
    await writeJson(FEED_PATH, feedData);
  }

  return {
    date,
    generatedAt: scanTime,
    newArticlesDiscovered,
    itemsIncluded: items.length,
    sourcesChecked: activeSubscriptions.length,
    sourceErrors,
    archivePath: relativeArchivePath,
    validation: {
      sourceCount: registry.sources ? registry.sources.length : 0,
      articleCount: ledger.articles ? ledger.articles.length : 0,
      itemCount: items.length
    }
  };
}

// Support CLI execution directly
const args = process.argv.slice(2);
const isMain = process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();
if (isMain) {
  const isDryRun = args.includes("--dry-run") || args.includes("--test");
  if (isDryRun) console.log("Running in DRY-RUN mode. No changes will be written to files.");
  
  refresh(isDryRun)
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error("Refresh failed:", err);
      process.exit(1);
    });
}
