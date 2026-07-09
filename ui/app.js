const state = {
  showAllArticleLedger: false,
  showAllSubscriptions: false,
  showAllAdhocs: false,
  sourceEditingId: null,
  backendAvailable: false,
  actionMessage: "",
  loading: true,
  error: "",
};

let sourceRegistry = {
  meta: { name: "NLJR Source Registry", updatedAt: "" },
  sources: [],
};

let nljrFeed = {
  today: {
    date: "",
    status: "not_generated",
    generatedAt: "",
    items: [],
    sourceHealth: {},
  },
  archive: [],
};

let nljrArticleLedger = {
  meta: { name: "NLJR Article Ledger", updatedAt: "" },
  articles: [],
};

const $ = (selector) => document.querySelector(selector);

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

function selectOptions(options, selected) {
  return options
    .map(
      (opt) => `<option value="${escapeHtml(opt)}"${opt === selected ? " selected" : ""}>${escapeHtml(opt)}</option>`,
    )
    .join("");
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `${response.status} ${response.statusText}`);
  }
  return await response.json();
}

async function loadRealData() {
  try {
    const [registryData, feedData, ledgerData] = await Promise.all([
      apiRequest("/api/source-registry"),
      apiRequest("/api/nljr-feed"),
      apiRequest("/api/nljr-article-ledger"),
    ]);
    sourceRegistry = registryData;
    nljrFeed = feedData;
    nljrArticleLedger = ledgerData;
    state.backendAvailable = true;
    state.error = "";
  } catch (err) {
    console.error("Could not load data from API server:", err);
    state.backendAvailable = false;
    state.error = `Server unavailable: ${err.message}`;
  } finally {
    state.loading = false;
  }
}

function metricCard(label, value, description) {
  return `
    <article class="metric">
      <p class="eyebrow">${escapeHtml(label)}</p>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(description)}</p>
    </article>
  `;
}

function consoleOverviewPanel() {
  const health = nljrFeed.today?.sourceHealth || {};
  const activeSources = sourceRegistry.sources.filter((source) => source.status !== "archived");
  return `
    <section class="panel console-overview-panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Overview</p>
          <p>Manage keyword watches, subscriptions, and adhoc inputs that will later power the daily Not Long; Just Read feed.</p>
        </div>
        <span class="pill">${activeSources.length} active sources</span>
      </div>
      ${state.actionMessage ? `<p class="action-message">${escapeHtml(state.actionMessage)}</p>` : ""}
      <div class="metrics-grid home-metrics nljr-health-grid" style="margin-top: 20px;">
        ${metricCard("Active sources", String(health.activeSources ?? activeSourceCount()), "Sources currently eligible for NLJR generation.")}
        ${metricCard("Active subscriptions", String(health.activeSubscriptions ?? activeSubscriptionCount()), "Subscriptions checked for newly published posts.")}
        ${metricCard("Need URL confirmation", String(health.needsUrlConfirmation ?? needsUrlConfirmationCount()), "Sources saved but not yet ready for automated scanning.")}
        ${metricCard("Processed articles", String(health.processedArticles ?? processedArticleCount()), "Articles already used and excluded from future NLJR reports.")}
      </div>
    </section>
  `;
}

function activeSourceCount() {
  return sourceRegistry.sources.filter((source) => source.status !== "archived").length;
}

function activeSubscriptionCount() {
  return sourceRegistry.sources.filter(
    (source) => source.status === "active" && source.sourceMode === "subscription",
  ).length;
}

function needsUrlConfirmationCount() {
  return sourceRegistry.sources.filter(
    (source) => source.status !== "archived" && String(source.sourceConfidence || "").includes("needs"),
  ).length;
}

function processedArticleCount() {
  return nljrArticleLedger.articles.filter((article) => article.status === "processed").length;
}

function nljrTodayView() {
  const todayFeed = nljrFeed.today || {};
  const items = todayFeed.items || [];
  return `
    <section class="panel nljr-today-panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Not Long; Just Read</p>
          <h3>Today's Brief — ${escapeHtml(todayFeed.date || todayDateString())}</h3>
          <p>Hand-picked tech industry intelligence summarized and mapped to strategy context.</p>
        </div>
        <div class="panel-action-stack">
          <button class="primary-button compact-action" id="nljr-refresh-button" type="button">Refresh Feeds</button>
          ${
            todayFeed.status === "not_generated"
              ? '<button class="primary-button compact-action" id="nljr-generate-button" type="button">Generate Today</button>'
              : ""
          }
        </div>
      </div>
      ${
        items.length
          ? `<div class="nljr-item-grid">${items.map(nljrItemView).join("")}</div>`
          : `<div class="empty-state">
              ${
                todayFeed.status === "no_new_posts"
                  ? "Today's scan completed. No new qualifying posts were found."
                  : "Today's live source scan is pending. Click Refresh Feeds to start."
              }
             </div>`
      }
    </section>
  `;
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function nljrItemView(item, index) {
  return `
    <article class="nljr-item-card">
      <div class="strategy-card-header">
        <div>
          <p class="eyebrow">${escapeHtml(item.sourceName || "Source")}</p>
          <h3>${escapeHtml(item.title || "Untitled article")}</h3>
        </div>
        <span class="pill nljr-priority-pill ${item.priority}">${escapeHtml(item.priority)}</span>
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
      ${
        item.url
          ? `<div style="margin-top: auto;"><a class="source-link" href="${escapeAttr(item.url)}" target="_blank" rel="noreferrer">Open original article</a></div>`
          : ""
      }
    </article>
  `;
}

function sourceModePanel(title, mode) {
  const sources = sourceRegistry.sources.filter((source) => source.sourceMode === mode && source.status !== "archived");
  
  let displaySources = sources;
  if (mode === "subscription" && !state.showAllSubscriptions) {
    displaySources = sources.slice(0, 5);
  } else if (mode === "manual_inbox" && !state.showAllAdhocs) {
    displaySources = sources.slice(0, 5);
  }

  return `
    <section class="panel source-mode-panel">
      <div class="panel-header compact-panel-header">
        <div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(sourceModeDescription(mode))}</p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          ${(mode === "subscription" && sources.length > 5) ? `
            <button class="ghost-button compact-action" id="toggle-all-subscriptions-button" type="button">
              ${state.showAllSubscriptions ? "Show Less" : "View All"}
            </button>
          ` : ""}
          ${(mode === "manual_inbox" && sources.length > 5) ? `
            <button class="ghost-button compact-action" id="toggle-all-adhocs-button" type="button">
              ${state.showAllAdhocs ? "Show Less" : "View All"}
            </button>
          ` : ""}
          <button class="ghost-button compact-action" type="button" data-add-source-mode="${escapeHtml(mode)}">Add</button>
        </div>
      </div>
      <div class="table-shell">
        <table class="source-table source-table-${escapeHtml(mode)}">
          <thead>
            ${sourceTableHeader(mode)}
          </thead>
          <tbody>
            ${
              displaySources
                .map((source) => sourceTableRow(source, mode))
                .join("") || `<tr><td colspan="${sourceColumnCount(mode)}"><div class="empty-state">No sources yet.</div></td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function sourceModeDescription(mode) {
  const descriptions = {
    keyword_watch: "Recurring research prompts across selected platforms and languages.",
    subscription: "Stable feeds like podcasts, newsletters, YouTube channels, RSS feeds, and blogs.",
    manual_inbox: "Adhoc links, screenshots, and notes you send in chat or save into a local folder.",
  };
  return descriptions[mode] || "";
}

function sourceColumnCount(mode) {
  if (mode === "keyword_watch") return 10;
  if (mode === "subscription") return 15;
  return 12;
}

function sourceTableHeader(mode) {
  const common = `
    <tr>
      <th>Source</th>
      <th>Status</th>
      <th>Priority</th>
      <th>Relevance</th>
      <th>Tags</th>
      <th>Notes</th>
  `;
  if (mode === "keyword_watch") {
    return `${common}
      <th>Keywords</th>
      <th>Platforms</th>
      <th>Language</th>
      <th>Actions</th>
    </tr>`;
  }
  if (mode === "subscription") {
    return `${common}
      <th>Type</th>
      <th>URL</th>
      <th>Feed URL</th>
      <th>Fetch</th>
      <th>Scan Status</th>
      <th>Last Checked</th>
      <th>Last Item</th>
      <th>Last Error</th>
      <th>Actions</th>
    </tr>`;
  }
  return `${common}
    <th>Type</th>
    <th>Inbox Path</th>
    <th>Formats</th>
    <th>Default Relevance</th>
    <th>Actions</th>
  </tr>`;
}

function sourceTableRow(source, mode) {
  const editing = state.sourceEditingId === source.id;
  const common = `
    <td>${sourceCell(source, "name", "Source name", editing)}</td>
    <td>${sourceCell(source, "status", "active", editing, "text", ["active", "paused", "archived"])}</td>
    <td>${sourceCell(source, "priority", "medium", editing, "text", ["high", "medium", "low"])}</td>
    <td>${sourceCell(source, "relevance", "Strategy, Core", editing)}</td>
    <td>${sourceCell(source, "tags", "tag, tag", editing)}</td>
    <td>${sourceCell(source, "notes", "Notes", editing)}</td>
  `;
  if (mode === "keyword_watch") {
    return `<tr>${common}
      <td>${sourceCell(source, "keywords", "keyword, keyword", editing)}</td>
      <td>${sourceCell(source, "platforms", "Google, YouTube", editing)}</td>
      <td>${sourceCell(source, "language", "English, Chinese", editing)}</td>
      <td>${sourceActions(source, editing)}</td>
    </tr>`;
  }
  if (mode === "subscription") {
    return `<tr>${common}
      <td>${sourceCell(source, "type", "podcast", editing)}</td>
      <td>${sourceCell(source, "url", "https://...", editing)}</td>
      <td>${sourceCell(source, "feedUrl", "RSS feed", editing)}</td>
      <td>${sourceCell(source, "fetchMethod", "rss", editing)}</td>
      <td>${sourceReadonlyValue(source, "scanStatus")}</td>
      <td>${sourceCell(source, "lastCheckedAt", "", editing)}</td>
      <td>${sourceCell(source, "lastItemSeen", "", editing)}</td>
      <td>${sourceReadonlyValue(source, "lastError")}</td>
      <td>${sourceActions(source, editing)}</td>
    </tr>`;
  }
  return `<tr>${common}
    <td>${sourceCell(source, "type", "link", editing)}</td>
    <td>${sourceCell(source, "inboxPath", "trend_inbox/...", editing)}</td>
    <td>${sourceCell(source, "acceptedFormats", "link, screenshot", editing)}</td>
    <td>${sourceCell(source, "defaultRelevance", "XHS, Strategy", editing)}</td>
    <td>${sourceActions(source, editing)}</td>
  </tr>`;
}

function sourceCell(source, field, placeholder, editing, type = "text", options = null) {
  if (editing) {
    return options
      ? sourceSelect(source, field, options)
      : sourceInput(source, field, placeholder, type);
  }
  return sourceReadonlyValue(source, field);
}

function sourceReadonlyValue(source, field) {
  const value = source[field];
  if (sourceListFields().has(field)) return sourceLabelGroup(value);
  if (!value) return '<span class="muted-value">Not set</span>';
  if (field === "notes") return sourceNotePreview(value);
  if (field === "url" || field === "feedUrl" || field === "archiveUrl" || field === "homepageUrl") {
    return `<a class="source-link" href="${escapeHtml(value)}" target="_blank" rel="noreferrer">${escapeHtml(value)}</a>`;
  }
  return `<span>${escapeHtml(value)}</span>`;
}

function sourceNotePreview(value) {
  const text = String(value || "").trim();
  if (!text) return '<span class="muted-value">Not set</span>';
  return `
    <span class="source-hover-wrap source-note-wrap" tabindex="0" data-tooltip="${escapeHtml(text)}">
      <span class="source-note-preview">${escapeHtml(text)}</span>
    </span>
  `;
}

function sourceLabelGroup(value) {
  const labels = Array.isArray(value)
    ? value
    : String(value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
  if (!labels.length) return '<span class="muted-value">No labels</span>';
  const tooltip = labels.join(", ");
  return `
    <div class="source-hover-wrap" tabindex="0" data-tooltip="${escapeHtml(tooltip)}">
      <div class="source-label-list">${labels.map((label) => `<span class="pill matcher-pill">${escapeHtml(label)}</span>`).join("")}</div>
    </div>
  `;
}

function sourceInput(source, field, placeholder, type = "text") {
  const value = Array.isArray(source[field]) ? source[field].join(", ") : source[field] || "";
  return `<input class="column-filter source-input" data-source-id="${escapeHtml(source.id)}" data-source-field="${escapeHtml(field)}" type="${escapeHtml(type)}" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(value)}" />`;
}

function sourceSelect(source, field, options) {
  return `
    <select class="column-filter source-input" data-source-id="${escapeHtml(source.id)}" data-source-field="${escapeHtml(field)}">
      ${selectOptions(options, source[field] || options[0])}
    </select>
  `;
}

function sourceActions(source, editing) {
  return `
    <div class="pipeline-actions">
      ${
        editing
          ? `<button class="primary-button compact-action" type="button" data-finish-edit-source="${escapeHtml(source.id)}">Done</button>`
          : `<button class="ghost-button compact-action" type="button" data-edit-source="${escapeHtml(source.id)}">Edit</button>`
      }
      <button class="ghost-button compact-action danger-action" type="button" data-archive-source="${escapeHtml(source.id)}">Archive</button>
    </div>
  `;
}

function nljrArchiveSummaryView(options = {}) {
  const limit = options.limit || 5;
  const entries = [...(nljrFeed.archive || [])]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, limit);
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">History</p>
          <h3>Daily Archives</h3>
          <p>Yesterday's daily briefs and research reports stored locally in your Obsidian vault.</p>
        </div>
        <span class="pill">${(nljrFeed.archive || []).length} editions</span>
      </div>
      ${
        entries.length
          ? `<div class="archive-list">${entries.map(nljrArchiveEntryView).join("")}</div>`
          : '<div class="empty-state">No archive entries yet.</div>'
      }
    </section>
  `;
}

function nljrArchiveEntryView(entry) {
  return `
    <article class="archive-row">
      <div>
        <strong>Brief - ${escapeHtml(entry.date)}</strong>
        <p>${escapeHtml(entry.summary || `${entry.itemCount || 0} items`)}</p>
      </div>
      <div class="panel-action-stack">
        <span class="pill">${escapeHtml(String(entry.itemCount || 0))} items</span>
      </div>
    </article>
  `;
}

function nljrArticleLedgerView() {
  const articles = [...(nljrArticleLedger.articles || [])].sort((a, b) =>
    String(b.processedAt || b.discoveredAt || "").localeCompare(
      String(a.processedAt || a.discoveredAt || ""),
    ),
  );
  
  const displayArticles = state.showAllArticleLedger ? articles : articles.slice(0, 5);
  
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Deduplication</p>
          <h3>Article Processing History</h3>
          <p>Direct article URLs already discovered or processed by NLJR. Processed items cannot be selected again.</p>
        </div>
        <div class="panel-action-stack" style="display: flex; gap: 8px; align-items: center;">
          <span class="pill">${articles.length} articles</span>
          ${articles.length > 5 ? `
            <button class="ghost-button compact-action" id="toggle-all-ledger-button" type="button">
              ${state.showAllArticleLedger ? "Show Less" : "View All"}
            </button>
          ` : ""}
        </div>
      </div>
      <div class="table-shell">
        <table class="source-table">
          <thead>
            <tr>
              <th>Article</th>
              <th>Source</th>
              <th>Published</th>
              <th>Status</th>
              <th>Processed</th>
              <th>NLJR Date</th>
            </tr>
          </thead>
          <tbody>
            ${
              displayArticles.length
                ? displayArticles
                    .map(
                      (article) => `
                        <tr>
                          <td><a class="source-link" href="${escapeHtml(article.url || "")}" target="_blank" rel="noreferrer">${escapeHtml(article.title || article.url || "Untitled article")}</a></td>
                          <td>${escapeHtml(article.sourceName || article.sourceId || "Unknown")}</td>
                          <td>${escapeHtml(article.publishedAt || "Not set")}</td>
                          <td><span class="pill">${escapeHtml(article.status || "new")}</span></td>
                          <td>${escapeHtml(article.processedAt || "Not processed")}</td>
                          <td>${escapeHtml(article.includedIn || "Not included")}</td>
                        </tr>
                      `,
                    )
                    .join("")
                : '<tr><td colspan="6"><div class="empty-state">No discovered articles yet.</div></td></tr>'
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function bindSourceManagementEvents() {
  const refreshButton = $("#nljr-refresh-button");
  if (refreshButton) {
    refreshButton.addEventListener("click", async () => {
      await refreshNLJRFeeds();
    });
  }

  const generateButton = $("#nljr-generate-button");
  if (generateButton) {
    generateButton.addEventListener("click", async () => {
      await generateTodayNLJR();
    });
  }

  document.querySelectorAll("[data-source-field]").forEach((field) => {
    field.addEventListener("change", async (event) => {
      await updateSourceRegistryField(
        field.dataset.sourceId,
        field.dataset.sourceField,
        event.target.value,
      );
    });
  });

  document.querySelectorAll("[data-add-source-mode]").forEach((button) => {
    button.addEventListener("click", async () => {
      await addSourceRegistrySource(button.dataset.addSourceMode);
    });
  });

  document.querySelectorAll("[data-edit-source]").forEach((button) => {
    button.addEventListener("click", () => {
      state.sourceEditingId = button.dataset.editSource;
      render();
    });
  });

  document.querySelectorAll("[data-finish-edit-source]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.sourceEditingId === button.dataset.finishEditSource) {
        state.sourceEditingId = null;
      }
      render();
    });
  });

  document.querySelectorAll("[data-archive-source]").forEach((button) => {
    button.addEventListener("click", async () => {
      await archiveSourceRegistrySource(button.dataset.archiveSource);
    });
  });

  const toggleLedgerButton = $("#toggle-all-ledger-button");
  if (toggleLedgerButton) {
    toggleLedgerButton.addEventListener("click", () => {
      state.showAllArticleLedger = !state.showAllArticleLedger;
      render();
    });
  }
  const toggleSubsButton = $("#toggle-all-subscriptions-button");
  if (toggleSubsButton) {
    toggleSubsButton.addEventListener("click", () => {
      state.showAllSubscriptions = !state.showAllSubscriptions;
      render();
    });
  }
  const toggleAdhocsButton = $("#toggle-all-adhocs-button");
  if (toggleAdhocsButton) {
    toggleAdhocsButton.addEventListener("click", () => {
      state.showAllAdhocs = !state.showAllAdhocs;
      render();
    });
  }
}

async function refreshNLJRFeeds() {
  if (!state.backendAvailable) {
    state.actionMessage = "Start the local server to refresh feeds.";
    render();
    return;
  }

  const refreshButton = $("#nljr-refresh-button");
  if (refreshButton) {
    refreshButton.disabled = true;
    refreshButton.textContent = "Refreshing...";
  }

  state.actionMessage = "Refreshing subscription feeds concurrently...";
  render();

  try {
    const result = await apiRequest("/api/nljr-feed/refresh", {
      method: "POST",
      body: JSON.stringify({}),
    });
    await loadRealData();
    state.actionMessage = `Feeds refreshed. Discovered ${result.result?.newArticlesDiscovered || 0} new articles.`;
  } catch (error) {
    state.actionMessage = `Could not refresh feeds: ${error.message}`;
  }
  render();
}

async function generateTodayNLJR() {
  if (!state.backendAvailable) {
    state.actionMessage = "Start the local server to generate today’s brief.";
    render();
    return;
  }

  state.actionMessage = "Generating today’s brief...";
  render();

  try {
    const result = await apiRequest("/api/nljr-feed/generate", {
      method: "POST",
      body: JSON.stringify({}),
    });
    await loadRealData();
    state.actionMessage = "Today’s brief generated and archived.";
  } catch (error) {
    state.actionMessage = `Could not generate brief: ${error.message}`;
  }
  render();
}

function getRegistrySource(sourceId) {
  return sourceRegistry.sources.find((source) => source.id === sourceId);
}

function sourceListFields() {
  return new Set(["relevance", "tags", "keywords", "platforms", "language", "acceptedFormats", "defaultRelevance"]);
}

function parseSourceFieldValue(field, value) {
  if (sourceListFields().has(field)) {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (field === "lookbackHours") return Number(value) || 24;
  return value;
}

async function updateSourceRegistryField(sourceId, field, value) {
  const source = getRegistrySource(sourceId);
  if (!source) return;
  const parsedValue = parseSourceFieldValue(field, value);
  source[field] = parsedValue;

  if (!state.backendAvailable) {
    state.actionMessage = "Source updated locally. Start the local server to persist source changes.";
    render();
    return;
  }

  try {
    const result = await apiRequest("/api/source-registry/source", {
      method: "PATCH",
      body: JSON.stringify({ sourceId, updates: { [field]: parsedValue } }),
    });
    sourceRegistry = result.data || sourceRegistry;
    state.actionMessage = "Source saved.";
  } catch (error) {
    state.actionMessage = `Could not save source: ${error.message}`;
  }
  render();
}

async function addSourceRegistrySource(mode) {
  const now = Date.now();
  const defaultSource = {
    id: `${mode}-new-${now}`,
    name: "New Source",
    sourceMode: mode,
    status: "active",
    priority: "medium",
    relevance: ["Strategy"],
    tags: [],
    notes: "",
  };
  if (mode === "keyword_watch") {
    defaultSource.keywords = ["AI"];
    defaultSource.platforms = ["Google"];
    defaultSource.language = ["English"];
  } else if (mode === "subscription") {
    defaultSource.url = "";
    defaultSource.feedUrl = "";
    defaultSource.type = "website";
    defaultSource.fetchMethod = "rss";
  } else {
    defaultSource.type = "link";
    defaultSource.inboxPath = "";
  }

  try {
    const result = await apiRequest("/api/source-registry/source", {
      method: "POST",
      body: JSON.stringify({ source: defaultSource }),
    });
    sourceRegistry = result.data || sourceRegistry;
    state.sourceEditingId = result.source?.id || null;
    state.actionMessage = "New source template added.";
  } catch (error) {
    state.actionMessage = `Could not add source: ${error.message}`;
  }
  render();
}

async function archiveSourceRegistrySource(sourceId) {
  try {
    const result = await apiRequest("/api/source-registry/archive", {
      method: "POST",
      body: JSON.stringify({ sourceId }),
    });
    sourceRegistry = result.data || sourceRegistry;
    state.actionMessage = "Source archived.";
  } catch (error) {
    state.actionMessage = `Could not archive source: ${error.message}`;
  }
  render();
}

function loadingView() {
  return '<div class="loading-state"><h3>Loading NLJR Console...</h3><p>Connecting to backend API...</p></div>';
}

function errorView() {
  return `<div class="error-state"><h3>Failed to load console</h3><p class="error-msg">${escapeHtml(state.error)}</p><button class="primary-button" onclick="window.location.reload()">Retry</button></div>`;
}

function render() {
  const view = $("#app-view");
  if (!view) return;

  if (state.loading) {
    view.innerHTML = loadingView();
    return;
  }
  if (state.error) {
    view.innerHTML = errorView();
    return;
  }

  view.innerHTML = `
    ${consoleOverviewPanel()}
    ${nljrTodayView()}
    <div class="source-panel-stack">
      ${sourceModePanel("Keyword Watches", "keyword_watch")}
      ${sourceModePanel("Subscriptions", "subscription")}
      ${sourceModePanel("Adhocs", "manual_inbox")}
    </div>
    ${nljrArchiveSummaryView({ limit: 5 })}
    ${nljrArticleLedgerView()}
  `;

  bindSourceManagementEvents();
}

// Initial boot
(async () => {
  await loadRealData();
  render();
})();
