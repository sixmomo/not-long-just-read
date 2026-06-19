const state = {
  feed: { today: { items: [], sourceHealth: {} }, archive: [] },
  registry: { sources: [] },
  ledger: { articles: [] },
};

const $ = (selector) => document.querySelector(selector);

async function readJson(url, fallback) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.warn(`Could not load ${url}: ${error.message}`);
    return fallback;
  }
}

async function load() {
  [state.feed, state.registry, state.ledger] = await Promise.all([
    readJson("/api/nljr-feed", state.feed),
    readJson("/api/source-registry", state.registry),
    readJson("/api/nljr-article-ledger", state.ledger),
  ]);
  render();
}

function render() {
  renderHealth();
  renderToday();
  renderArchive();
  renderSources();
  renderLedger();
}

function renderHealth() {
  const health = state.feed.today?.sourceHealth || {};
  const metrics = [
    ["Active sources", health.activeSources ?? activeSources().length],
    ["Subscriptions", health.activeSubscriptions ?? activeSubscriptions().length],
    ["Processed", health.processedArticles ?? processedArticles().length],
    ["Need URL", health.needsUrlConfirmation ?? needsUrlSources().length],
  ];
  $("#healthStrip").innerHTML = metrics
    .map(
      ([label, value]) =>
        `<article class="metric"><p class="eyebrow">${escapeHtml(label)}</p><strong>${escapeHtml(String(value))}</strong></article>`,
    )
    .join("");
}

function renderToday() {
  const today = state.feed.today || {};
  const items = today.items || [];
  $("#todayDate").textContent = today.date || "Pending";
  if (items.length) {
    $("#todayItems").innerHTML = items.slice(0, 3).map(renderItem).join("");
    return;
  }
  const message =
    today.status === "no_new_posts"
      ? "Today's scan completed. No new qualifying posts were found."
      : "Today's live source scan is pending.";
  $("#todayItems").innerHTML = `<div class="empty">${escapeHtml(message)}</div>`;
}

function renderItem(item) {
  return `
    <article class="item-card">
      <div>
        <p class="eyebrow">${escapeHtml(item.sourceName || "Source")}</p>
        <h3>${escapeHtml(item.title || "Untitled article")}</h3>
      </div>
      <div>
        <strong>Summary</strong>
        <p>${escapeHtml(item.summary || "")}</p>
      </div>
      <div>
        <strong>Why it matters</strong>
        <p>${escapeHtml(item.whyItMatters || "")}</p>
      </div>
      <div>
        <strong>Topic angle</strong>
        <p>${escapeHtml(item.topicAngle || "")}</p>
      </div>
      <div class="card-meta">
        ${(item.relevance || []).map((label) => `<span class="pill">${escapeHtml(label)}</span>`).join("")}
      </div>
      ${item.url ? `<a class="source-link" href="${escapeAttr(item.url)}" target="_blank" rel="noreferrer">Open article</a>` : ""}
    </article>
  `;
}

function renderArchive() {
  const entries = [...(state.feed.archive || [])]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 8);
  $("#archiveList").innerHTML = entries.length
    ? entries
        .map(
          (entry) => `
            <article class="archive-row">
              <div>
                <strong>${escapeHtml(entry.date || "No date")}</strong>
                <p>${escapeHtml(entry.summary || `${entry.itemCount || 0} items`)}</p>
              </div>
              <span class="pill">${escapeHtml(String(entry.itemCount || 0))} items</span>
            </article>
          `,
        )
        .join("")
    : `<div class="empty">No archive entries yet.</div>`;
}

function renderSources() {
  const sources = state.registry.sources || [];
  $("#sourceList").innerHTML = sources.length
    ? sources
        .filter((source) => source.sourceMode === "subscription")
        .map(
          (source) => `
            <article class="source-row">
              <div>
                <strong>${escapeHtml(source.name || "Unnamed source")}</strong>
                <p>${escapeHtml(source.feedUrl || source.archiveUrl || source.url || "URL not confirmed")}</p>
                <small>Last checked: ${escapeHtml(source.lastCheckedAt || "Never")}</small>
              </div>
              <div class="status-stack">
                <span class="pill">${escapeHtml(source.status || "active")}</span>
                <span class="pill ${source.scanStatus === "error" ? "warning" : ""}">${escapeHtml(source.scanStatus || "never_checked")}</span>
              </div>
            </article>
          `,
        )
        .join("")
    : `<div class="empty">No subscriptions yet.</div>`;
}

function renderLedger() {
  const articles = [...(state.ledger.articles || [])].sort((a, b) =>
    String(b.processedAt || b.discoveredAt || "").localeCompare(
      String(a.processedAt || a.discoveredAt || ""),
    ),
  );
  $("#ledgerList").innerHTML = articles.length
    ? articles
        .slice(0, 12)
        .map(
          (article) => `
            <article class="ledger-row">
              <div>
                <p class="eyebrow">${escapeHtml(article.sourceName || article.sourceId || "Source")}</p>
                <strong>${escapeHtml(article.title || "Untitled article")}</strong>
                <p>${escapeHtml(article.url || "")}</p>
              </div>
              <div class="status-stack">
                <span class="pill">${escapeHtml(article.status || "unknown")}</span>
                <small>${escapeHtml(article.includedIn || article.publishedAt || "")}</small>
              </div>
            </article>
          `,
        )
        .join("")
    : `<div class="empty">No articles have been discovered yet.</div>`;
}

function activeSources() {
  return (state.registry.sources || []).filter((source) => source.status === "active");
}

function activeSubscriptions() {
  return activeSources().filter((source) => source.sourceMode === "subscription");
}

function needsUrlSources() {
  return activeSources().filter((source) =>
    String(source.sourceConfidence || "").includes("needs"),
  );
}

function processedArticles() {
  return (state.ledger.articles || []).filter((article) => article.status === "processed");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

load();
