const state = {
  feed: { today: { items: [], sourceHealth: {} }, archive: [] },
  registry: { sources: [] },
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
  state.feed = await readJson("/api/nljr-feed", state.feed);
  state.registry = await readJson("/api/source-registry", state.registry);
  render();
}

function render() {
  renderHealth();
  renderToday();
  renderArchive();
  renderSources();
}

function renderHealth() {
  const health = state.feed.today?.sourceHealth || {};
  const metrics = [
    ["Active", health.activeSources ?? activeSources().length],
    ["Verified", health.verifiedArchiveSources ?? verifiedArchiveSources().length],
    ["Need URL", health.needsUrlConfirmation ?? needsUrlSources().length],
    ["Adhoc", health.adhocItems ?? manualSources().length],
  ];
  $("#healthStrip").innerHTML = metrics
    .map(([label, value]) => `<article class="metric"><p class="eyebrow">${escapeHtml(label)}</p><strong>${escapeHtml(String(value))}</strong></article>`)
    .join("");
}

function renderToday() {
  const today = state.feed.today || {};
  const items = today.items || [];
  $("#todayDate").textContent = today.date || "Not generated";
  $("#todayItems").innerHTML = items.length
    ? items.slice(0, 3).map(renderItem).join("")
    : `<div class="empty">No NLJR feed has been generated yet.</div>`;
}

function renderItem(item) {
  return `
    <article class="item-card">
      <div>
        <p class="eyebrow">${escapeHtml(item.sourceName || "Source")}</p>
        <h3>${escapeHtml(item.title || "Untitled signal")}</h3>
      </div>
      <p>${escapeHtml(item.summary || "")}</p>
      <div>
        <strong>Why it matters</strong>
        <p>${escapeHtml(item.whyItMatters || "")}</p>
      </div>
      <div class="card-meta">
        ${(item.relevance || []).map((label) => `<span class="pill">${escapeHtml(label)}</span>`).join("")}
      </div>
      ${item.url ? `<a class="source-link" href="${escapeAttr(item.url)}" target="_blank" rel="noreferrer">Open source</a>` : ""}
    </article>
  `;
}

function renderArchive() {
  const entries = [...(state.feed.archive || [])].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 8);
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
        .slice(0, 10)
        .map(
          (source) => `
            <article class="source-row">
              <div>
                <strong>${escapeHtml(source.name || "Unnamed source")}</strong>
                <p>${escapeHtml(source.notes || source.archiveUrl || source.url || "")}</p>
              </div>
              <span class="pill ${String(source.sourceConfidence || "").includes("needs") ? "warning" : ""}">${escapeHtml(source.sourceConfidence || "unknown")}</span>
            </article>
          `,
        )
        .join("")
    : `<div class="empty">No sources yet.</div>`;
}

function activeSources() {
  return (state.registry.sources || []).filter((source) => source.status !== "archived");
}

function verifiedArchiveSources() {
  return activeSources().filter((source) => source.sourceConfidence === "verified_archive" && source.archiveUrl);
}

function needsUrlSources() {
  return activeSources().filter((source) => String(source.sourceConfidence || "").includes("needs"));
}

function manualSources() {
  return activeSources().filter((source) => source.sourceMode === "manual_inbox");
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

$("#generateButton").addEventListener("click", async () => {
  const button = $("#generateButton");
  button.disabled = true;
  button.textContent = "Generating";
  try {
    const response = await fetch("/api/nljr-feed/generate", { method: "POST" });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const result = await response.json();
    state.feed = result.data || state.feed;
    render();
  } catch (error) {
    alert(`Could not generate NLJR: ${error.message}`);
  } finally {
    button.disabled = false;
    button.textContent = "Generate Today";
  }
});

load();
