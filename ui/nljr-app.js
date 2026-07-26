const state = {
  route: "daily",
  postPageId: "",
  actionMessage: "",
  loading: true,
  error: "",
  backendAvailable: false,
  nljrArchiveContent: {},
  nljrArchiveLoading: {},
  nljrArchiveErrors: {},
  sourceEditingId: null,
  showAllSubscriptions: false,
  showAllRandomTopics: false,
  showAllArticleLedger: false,
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

let sourceRegistry = {
  meta: {
    name: "NLJR Source Registry",
    updatedAt: "",
  },
  sources: [],
};

let appData = {
  topicSources: [],
  topics: [],
};

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderInlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
      const url = resolvePreviewAssetPath(href);
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${label}</a>`;
    })
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

function resolvePreviewAssetPath(value) {
  const raw = String(value || "").trim();
  if (/^(https?:)?\/\//.test(raw) || raw.startsWith("/")) return raw;
  if (raw.startsWith("content_pipeline/")) return `/${raw}`;
  if (raw.startsWith("ui/")) return `/${raw}`;
  return raw;
}

function renderMarkdown(content) {
  const lines = String(content || "").replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let inCode = false;
  let codeLanguage = "";
  let codeLines = [];
  let listType = "";
  let tableRows = [];

  function closeList() {
    if (listType) {
      html.push(`</${listType}>`);
      listType = "";
    }
  }

  function parseTableRow(line) {
    return line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
  }

  function closeTable() {
    if (!tableRows.length) return;
    closeList();
    const rows = tableRows
      .filter((row) => !/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(row))
      .map(parseTableRow);
    const [header = [], ...bodyRows] = rows;
    html.push(
      `<div class="table-preview"><table><thead><tr>${header
        .map((cell) => `<th>${renderInlineMarkdown(cell)}</th>`)
        .join("")}</tr></thead><tbody>${bodyRows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${renderInlineMarkdown(cell)}</td>`).join("")}</tr>`,
        )
        .join("")}</tbody></table></div>`,
    );
    tableRows = [];
  }

  function openList(nextType) {
    if (listType !== nextType) {
      closeList();
      html.push(`<${nextType}>`);
      listType = nextType;
    }
  }

  function closeCodeBlock() {
    closeList();
    closeTable();
    const normalizedLanguage = codeLanguage.toLowerCase();
    if (normalizedLanguage === "yaml" || normalizedLanguage === "yml") {
      html.push(renderStructuredDataBlock(codeLanguage, codeLines));
      inCode = false;
      codeLanguage = "";
      codeLines = [];
      return;
    }
    const label = codeLanguage
      ? `<div class="code-label">${escapeHtml(codeLanguage)}</div>`
      : "";
    html.push(
      `<div class="code-block">${label}<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre></div>`,
    );
    inCode = false;
    codeLanguage = "";
    codeLines = [];
  }

  lines.forEach((line) => {
    const codeMatch = line.match(/^```(\w+)?\s*$/);
    if (codeMatch) {
      if (inCode) {
        closeCodeBlock();
      } else {
        closeList();
        inCode = true;
        codeLanguage = codeMatch[1] || "";
        codeLines = [];
      }
      return;
    }

    if (inCode) {
      codeLines.push(line);
      return;
    }

    if (!line.trim()) {
      closeTable();
      closeList();
      return;
    }

    if (/^\s*\|.+\|\s*$/.test(line)) {
      closeList();
      tableRows.push(line);
      return;
    }

    closeTable();

    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      closeList();
      html.push(
        `<figure class="markdown-image"><img src="${escapeHtml(resolvePreviewAssetPath(imageMatch[2]))}" alt="${escapeHtml(imageMatch[1])}" /><figcaption>${escapeHtml(imageMatch[1] || imageMatch[2])}</figcaption></figure>`,
      );
      return;
    }

    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${renderInlineMarkdown(headingMatch[2])}</h${level}>`);
      return;
    }

    const bulletMatch = line.match(/^\s*[-*]\s+(.+)$/);
    if (bulletMatch) {
      openList("ul");
      html.push(`<li>${renderInlineMarkdown(bulletMatch[1])}</li>`);
      return;
    }

    const numberMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (numberMatch) {
      openList("ol");
      html.push(`<li>${renderInlineMarkdown(numberMatch[1])}</li>`);
      return;
    }

    closeList();
    html.push(`<p>${renderInlineMarkdown(line)}</p>`);
  });

  if (inCode) closeCodeBlock();
  closeTable();
  closeList();
  return html.join("");
}

function renderStructuredDataBlock(language, lines) {
  const rows = lines
    .map((line) => {
      if (!line.trim()) {
        return '<div class="structured-spacer" aria-hidden="true"></div>';
      }

      const listMatch = line.match(/^(\s*)-\s+(.+)$/);
      if (listMatch) {
        const depth = Math.min(Math.floor(listMatch[1].length / 2), 3);
        return `<div class="structured-list-item depth-${depth}">${renderInlineMarkdown(listMatch[2])}</div>`;
      }

      const fieldMatch = line.match(/^(\s*)([^:#][^:]*):\s*(.*)$/);
      if (fieldMatch) {
        const depth = Math.min(Math.floor(fieldMatch[1].length / 2), 3);
        return `
          <div class="structured-field depth-${depth}">
            <span>${escapeHtml(fieldMatch[2].trim())}</span>
            <strong>${renderInlineMarkdown(fieldMatch[3]) || "&nbsp;"}</strong>
          </div>
        `;
      }

      return `<p class="structured-text">${renderInlineMarkdown(line.trim())}</p>`;
    })
    .join("");

  return `
    <section class="structured-block">
      <p class="structured-label">${escapeHtml(language || "data")}</p>
      <div class="structured-body">${rows}</div>
    </section>
  `;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  if (!response.ok) {
    let detail = "";
    try {
      const result = await response.json();
      detail = result?.error ? `: ${result.error}` : "";
    } catch (_error) {
      detail = "";
    }
    throw new Error(`Request failed: ${response.status}${detail}`);
  }
  const result = await response.json();
  if (result && result.ok === false) {
    throw new Error(result.error || "Request failed");
  }
  return result;
}

function resolveProjectAssetPaths(assetPath) {
  if (!assetPath) return [];
  const paths = [assetPath];
  if (assetPath.startsWith("not-long-just-read/")) {
    paths.push(`/${assetPath}`);
  }
  return [...new Set(paths)];
}

async function loadNLJRArchiveEdition(date) {
  const archiveEntry = (nljrFeed.archive || []).find((entry) => entry.date === date);
  if (
    !archiveEntry?.path ||
    state.nljrArchiveContent[date] ||
    state.nljrArchiveLoading[date]
  ) {
    return;
  }

  state.nljrArchiveLoading[date] = true;
  state.nljrArchiveErrors[date] = "";
  render();

  try {
    let response = null;
    for (const path of resolveProjectAssetPaths(archiveEntry.path)) {
      response = await fetch(path, { cache: "no-store" }).catch(() => null);
      if (response?.ok) break;
    }
    if (!response?.ok) throw new Error("Archive file could not be loaded.");
    state.nljrArchiveContent[date] = await response.text();
  } catch (error) {
    state.nljrArchiveErrors[date] = error.message || "Archive file could not be loaded.";
  } finally {
    state.nljrArchiveLoading[date] = false;
  }

  if (state.route === "daily" && state.postPageId === date) {
    render();
  }
}

async function loadRealData() {
  state.loading = true;
  state.error = "";
  render();

  try {
    sourceRegistry = await fetchSourceRegistry();
    nljrFeed = await fetchNLJRFeed();
    nljrArticleLedger = await fetchNLJRArticleLedger();
    state.backendAvailable = true;
  } catch (error) {
    state.error = `Could not load real data: ${error.message}`;
  } finally {
    state.loading = false;
    render();
    if (state.route === "daily" && state.postPageId) {
      void loadNLJRArchiveEdition(state.postPageId);
    }
  }
}

async function fetchSourceRegistry() {
  const response = await fetch("/api/source-registry", { cache: "no-store" });
  if (!response.ok) throw new Error(`Source registry fetch failed with ${response.status}`);
  const data = await response.json();
  return {
    meta: data.meta || { name: "NLJR Source Registry", updatedAt: "" },
    sources: Array.isArray(data.sources) ? data.sources : [],
  };
}

async function fetchNLJRFeed() {
  const response = await fetch("/api/nljr-feed", { cache: "no-store" });
  if (!response.ok) throw new Error(`NLJR feed fetch failed with ${response.status}`);
  const data = await response.json();
  return {
    today: data.today || { status: "not_generated", items: [], sourceHealth: {} },
    archive: Array.isArray(data.archive) ? data.archive : [],
  };
}

async function fetchNLJRArticleLedger() {
  const response = await fetch("/api/nljr-article-ledger", { cache: "no-store" });
  if (!response.ok) throw new Error(`NLJR ledger fetch failed with ${response.status}`);
  const data = await response.json();
  return {
    meta: data.meta || { name: "NLJR Article Ledger", updatedAt: "" },
    articles: Array.isArray(data.articles) ? data.articles : [],
  };
}

function normalizeSourceId(value) {
  return String(value || "source")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getTopicSources() {
  if (Array.isArray(appData.topicSources) && appData.topicSources.length) {
    return appData.topicSources;
  }
  const legacySources = [...new Set(appData.topics.map((topic) => topic.source).filter(Boolean))];
  appData.topicSources = legacySources.map((source) => ({
    id: normalizeSourceId(source),
    label: source,
    path: source,
    type: "source",
  }));
  return appData.topicSources;
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

function selectOptions(options, selected) {
  return options
    .map((option) => `<option value="${escapeHtml(option)}" ${option === selected ? "selected" : ""}>${escapeHtml(option)}</option>`)
    .join("");
}

function pageTitle(route) {
  const titles = {
    daily: "Daily NLJR",
    "all-links": "Scanned Feed Links",
    console: "NLJR Console",
    archives: "Archives",
  };
  return titles[route] || "NLJR";
}

function parseRouteHash(hashValue) {
  const raw = String(hashValue || "").replace(/^#/, "");
  if (!raw) return { route: "daily", postId: "" };
  if (raw.startsWith("daily/")) {
    const parts = raw.split("/");
    return { route: "daily", postId: parts[1] || "" };
  }
  if (raw.startsWith("all-links/")) {
    const parts = raw.split("/");
    return { route: "all-links", postId: parts[1] || "" };
  }
  if (raw === "console") return { route: "console", postId: "" };
  if (raw === "archives") return { route: "archives", postId: "" };
  return { route: "daily", postId: "" };
}

function setRoute(nextRoute, options = {}) {
  const safeRoutes = ["daily", "console", "archives", "all-links"];
  const safeRoute = safeRoutes.includes(nextRoute) ? nextRoute : "daily";
  state.route = safeRoute;
  state.postPageId = options.postId || "";

  let expectedHash = `#${safeRoute}`;
  if (safeRoute === "daily" && state.postPageId) {
    expectedHash = `#daily/${state.postPageId}`;
  } else if (safeRoute === "all-links" && state.postPageId) {
    expectedHash = `#all-links/${state.postPageId}`;
  }

  if (window.location.hash !== expectedHash) {
    if (options.replace) {
      window.history.replaceState(null, "", expectedHash);
    } else {
      window.history.pushState(null, "", expectedHash);
    }
  }

  document.querySelectorAll(".nav-item").forEach((item) => {
    const route = item.getAttribute("href")?.replace(/^#/, "").split("/")[0] || "daily";
    item.classList.toggle("active", route === state.route);
  });

  document.querySelector("#page-title").textContent = pageTitle(state.route);
  render();

  if (state.route === "daily" && state.postPageId) {
    void loadNLJRArchiveEdition(state.postPageId);
  }
}

function metricCard(label, value, note) {
  return `
    <article class="metric-card">
      <p class="eyebrow">${label}</p>
      <strong>${value}</strong>
      <small>${note}</small>
    </article>
  `;
}

function formatArchiveTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || "");
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function activeSourceCount() {
  return sourceRegistry.sources.filter((source) => source.status !== "archived").length;
}

function activeSubscriptionCount() {
  return sourceRegistry.sources.filter(
    (source) => source.status === "active" && source.sourceMode === "subscription",
  ).length;
}

function processedArticleCount() {
  return nljrArticleLedger.articles.filter((article) => article.status === "processed").length;
}

function needsUrlConfirmationCount() {
  return sourceRegistry.sources.filter(
    (source) => source.status !== "archived" && String(source.sourceConfidence || "").includes("needs"),
  ).length;
}

function consoleOverviewPanel() {
  const health = nljrFeed.today?.sourceHealth || {};
  const activeSources = sourceRegistry.sources.filter((source) => source.status !== "archived");
  return `
    <section class="panel console-overview-panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Overview</p>
          <p>Manage subscriptions and random topics that will power the Not Long; Just Read feed.</p>
        </div>
        <span class="pill">${activeSources.length} active sources</span>
      </div>
      ${state.actionMessage ? `<p class="action-message">${escapeHtml(state.actionMessage)}</p>` : ""}
      <div class="metrics-grid nljr-health-grid" style="margin-top: 20px;">
        ${metricCard("Active sources", String(health.activeSources ?? activeSourceCount()), "Sources currently eligible for NLJR generation.")}
        ${metricCard("Active subscriptions", String(health.activeSubscriptions ?? activeSubscriptionCount()), "Subscriptions checked for newly published posts.")}
        ${metricCard("Need URL confirmation", String(health.needsUrlConfirmation ?? needsUrlConfirmationCount()), "Sources saved but not yet ready for automated scanning.")}
        ${metricCard("Processed articles", String(health.processedArticles ?? processedArticleCount()), "Articles already used and excluded from future NLJR reports.")}
      </div>
    </section>
  `;
}

function sourceModeDescription(mode) {
  const descriptions = {
    keyword_watch: "Recurring research prompts across selected platforms and languages.",
    subscription: "Stable feeds like podcasts, newsletters, YouTube channels, RSS feeds, and blogs.",
    manual_inbox: "One-off links, screenshots, and notes you send in chat or save into a local folder.",
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
    <td>${sourceCell(source, "relevance", "XHS, LinkedIn", editing)}</td>
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

function sourceModePanel(title, mode) {
  const sources = sourceRegistry.sources.filter((source) => source.sourceMode === mode && source.status !== "archived");
  
  let displaySources = sources;
  if (mode === "subscription" && !state.showAllSubscriptions) {
    displaySources = sources.slice(0, 5);
  } else if (mode === "manual_inbox" && !state.showAllRandomTopics) {
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
            <button class="ghost-button compact-action" id="toggle-all-random-topics-button" type="button">
              ${state.showAllRandomTopics ? "Show Less" : "View All"}
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

function sourceManagementView() {
  return `
    ${consoleOverviewPanel()}
    <div class="source-panel-stack">
      ${sourceModePanel("Subscriptions", "subscription")}
      ${sourceModePanel("Random Topics", "manual_inbox")}
    </div>
    ${nljrArticleLedgerView()}
  `;
}

function nljrArchiveSummaryView({ limit = 5 } = {}) {
  const entries = [...(nljrFeed.archive || [])]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, limit);
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Archive</p>
          <h3>NLJR Archive</h3>
          <p>Daily feed snapshots saved for later review.</p>
        </div>
        <a class="ghost-button compact-action" href="#archives" data-route="archives">View All</a>
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
        <strong>${escapeHtml(entry.date || "No date")}</strong>
        <p>${escapeHtml(entry.summary || `${entry.itemCount || 0} items`)}</p>
      </div>
      <div class="card-meta">
        <span class="pill">${escapeHtml(String(entry.itemCount || 0))} items</span>
        <a class="ghost-button compact-action" href="#daily/${escapeHtml(entry.date || "")}" data-route="daily" data-post-id="${escapeHtml(entry.date || "")}">Read NLJR</a>
      </div>
    </article>
  `;
}

function dailyArchivesView() {
  const entries = [...(nljrFeed.archive || [])].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">NLJR</p>
          <h3>Daily Archives</h3>
          <p>Saved daily archive entries ordered by date, latest first.</p>
        </div>
        <div class="panel-action-stack" style="display: flex; gap: 8px; align-items: center;">
          <span class="pill">${entries.length} entries</span>
          <a class="ghost-button compact-action" href="#daily" data-route="daily">Daily NL;JR</a>
        </div>
      </div>
      ${
        entries.length
          ? `<div class="archive-list">${entries.map(nljrArchiveEntryView).join("")}</div>`
          : '<div class="empty-state">No daily archives yet.</div>'
      }
    </section>
  `;
}

function nljrRecommendedItems(today) {
  const items = today.items || [];
  const recommendedIds = today.recommendedItemIds || [];
  if (!recommendedIds.length) return items.slice(0, 3);
  const byId = new Map(items.map((item) => [item.articleId || item.id, item]));
  return recommendedIds.map((id) => byId.get(id)).filter(Boolean).slice(0, 3);
}

function nljrTodayView() {
  const today = nljrFeed.today || {};
  const items = nljrRecommendedItems(today);
  const emptyMessage =
    today.status === "pending_live_scan"
      ? "Today’s live source scan is pending. The corrected automation will publish actual new articles after it completes."
      : today.status === "no_new_posts"
        ? "No new qualifying posts were published by the subscribed sources in this scan window."
        : "No NLJR has been generated yet. The daily automation will publish the next report here.";
  return `
    <section class="panel nljr-today-panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Today</p>
          <h3>Daily NL;JR</h3>
          <p>Not Long; Just Read. Top signals generated from active sources, subscriptions, and random topics.</p>
        </div>
        <div class="panel-action-stack" style="display: flex; gap: 8px; align-items: center;">
          <span class="pill">${escapeHtml(today.date || "Not generated")}</span>
          ${
            state.backendAvailable
              ? `<button class="primary-button compact-action" id="nljr-refresh-button" type="button">Refresh Feeds</button>`
              : ""
          }
        </div>
      </div>
      ${state.actionMessage ? `<p class="action-message">${escapeHtml(state.actionMessage)}</p>` : ""}
      ${
        items.length
          ? `<div class="nljr-item-grid">${items.map(nljrItemView).join("")}</div>`
          : `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`
      }
    </section>
  `;
}

function nljrItemView(item, index) {
  const isNewBriefingFormat = String(item.summary || "").includes("The Hook/TL;DR");
  return `
    <article class="nljr-item-card">
      <div class="strategy-card-header">
        <div>
          <p class="eyebrow">${escapeHtml(item.sourceName || "Source")}</p>
          <h3>${escapeHtml(item.title || "Untitled signal")}</h3>
        </div>
        <span class="pill nljr-priority-pill ${item.priority === "high" ? "hot" : ""}">${escapeHtml(item.priority || "medium")}</span>
      </div>
      <div class="nljr-summary-body" style="margin-top: 12px; font-size: 14px; line-height: 1.6;">
        ${renderMarkdown(item.summary || "")}
      </div>
      ${!isNewBriefingFormat ? `
        <div style="margin-top: 12px;">
          <strong>Why it matters</strong>
          <p>${escapeHtml(item.whyItMatters || "")}</p>
        </div>
        <div style="margin-top: 12px;">
          <strong>Topic angle</strong>
          <p>${escapeHtml(item.topicAngle || "")}</p>
        </div>
      ` : ""}
      <div class="card-meta" style="margin-top: 16px;">
        ${(item.relevance || []).map((label) => `<span class="pill">${escapeHtml(label)}</span>`).join("")}
        ${(item.suggestedUse || []).map((label) => `<span class="pill good">${escapeHtml(label)}</span>`).join("")}
      </div>
      ${item.url ? `<a class="source-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Open source</a>` : ""}
    </article>
  `;
}

function nljrBriefItemView(item, index) {
  return `
    <article class="nljr-brief-row">
      <div class="nljr-brief-rank">${index + 4}</div>
      <div class="nljr-brief-content">
        <div class="nljr-brief-heading">
          <div>
            <p class="eyebrow">${escapeHtml(item.sourceName || "Source")}</p>
            <h3>${escapeHtml(item.title || "Untitled signal")}</h3>
          </div>
          <span class="pill">${escapeHtml(item.publishedAt || "No date")}</span>
        </div>
        <p>${escapeHtml(item.conciseSummary || item.summary || "")}</p>
        ${
          item.conciseWhyRelevant || item.whyItMatters
            ? `<p class="nljr-brief-relevance"><strong>Why read:</strong> ${escapeHtml(item.conciseWhyRelevant || item.whyItMatters)}</p>`
            : ""
        }
        ${item.url ? `<a class="source-link" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Open source</a>` : ""}
      </div>
    </article>
  `;
}

function nljrDayView() {
  const today = nljrFeed.today || {};
  const requestedDate = state.postPageId || today.date;
  if (requestedDate !== today.date) {
    const archiveEntry = (nljrFeed.archive || []).find((entry) => entry.date === requestedDate);
    const content = state.nljrArchiveContent[requestedDate] || "";
    const loading = Boolean(state.nljrArchiveLoading[requestedDate]);
    const error = state.nljrArchiveErrors[requestedDate] || "";
    return `
      <section class="panel nljr-edition-header">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Daily Archive</p>
            <h3>NLJR · ${escapeHtml(requestedDate || "Unknown date")}</h3>
            <p>A readable view of the saved daily report.</p>
          </div>
          <div class="panel-action-stack">
            ${archiveEntry ? `<span class="pill">${escapeHtml(String(archiveEntry.itemCount || 0))} signals</span>` : ""}
            <a class="ghost-button compact-action" href="#archives" data-route="archives">Back to Archives</a>
          </div>
        </div>
      </section>
      ${
        !archiveEntry
          ? '<section class="panel"><div class="empty-state">No archived edition was found for this date.</div></section>'
          : loading
            ? '<section class="panel"><div class="empty-state">Loading the daily archive...</div></section>'
            : error
              ? `<section class="panel"><div class="empty-state">${escapeHtml(error)}</div></section>`
              : content
                ? `
                  <section class="panel nljr-archive-reader-panel">
                    <div class="archive-reader-meta">
                      <span>Saved report</span>
                      ${archiveEntry.generatedAt ? `<span>Generated ${escapeHtml(formatArchiveTimestamp(archiveEntry.generatedAt))}</span>` : ""}
                    </div>
                    <article class="artifact-preview archive-reader">${renderMarkdown(content)}</article>
                  </section>
                `
                : '<section class="panel"><div class="empty-state">Preparing this archived edition...</div></section>'
      }
    `;
  }

  const items = today.items || [];
  const recommended = nljrRecommendedItems(today);
  const recommendedIds = new Set(recommended.map((item) => item.articleId || item.id));
  const additional = items.filter((item) => !recommendedIds.has(item.articleId || item.id)).slice(0, 7);
  return `
    <section class="panel nljr-edition-header">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Daily Edition</p>
          <h3>NLJR · ${escapeHtml(today.date || "Not generated")}</h3>
          <p class="nljr-exec-summary">${renderInlineMarkdown(today.executiveSummary || today.dailySummary || "Three deep recommendations followed by a concise scan of the other most relevant new feeds.")}</p>
        </div>
        <div class="panel-action-stack" style="display: flex; gap: 8px; align-items: center;">
          <span class="pill">${items.length} items</span>
          ${
            state.backendAvailable
              ? `<button class="primary-button compact-action" id="nljr-refresh-button" type="button">Refresh Feeds</button>`
              : ""
          }
        </div>
      </div>
      ${state.actionMessage ? `<p class="action-message">${escapeHtml(state.actionMessage)}</p>` : ""}
    </section>
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Top Three</p>
          <h3>Recommended Deep Reads</h3>
        </div>
      </div>
      ${
        recommended.length
          ? `<div class="nljr-item-grid">${recommended.map(nljrItemView).join("")}</div>`
          : `<div class="empty-state">${today.status === "no_new_posts" ? "No new qualifying posts were published by the subscribed sources in this scan window." : "No recommended articles in this edition."}</div>`
      }
    </section>
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Quick Scan</p>
          <h3>More New Feeds</h3>
          <p>List of all feeds scanned and processed for today's edition.</p>
        </div>
        <span class="pill">${items.length} items</span>
      </div>
      ${
        items.length
          ? `
            <ul class="nljr-scanned-links-list" style="list-style-type: disc; padding-left: 20px; line-height: 1.8; margin-bottom: 16px;">
              ${items.slice(0, 5).map(item => `
                <li style="margin-bottom: 8px;">
                  <a href="${escapeHtml(item.url)}" target="_blank" style="font-weight: 500; text-decoration: underline;">${escapeHtml(item.title)}</a>
                  <span style="color: var(--muted); margin-left: 6px;">(Source: ${escapeHtml(item.sourceName)})</span>
                </li>
              `).join("")}
            </ul>
            ${
              items.length > 5
                ? `<div style="margin-top: 12px;">
                    <a class="ghost-button compact-action" href="#all-links/${escapeHtml(today.date)}" data-route="all-links" data-post-id="${escapeHtml(today.date)}">Show all ${items.length} links</a>
                   </div>`
                : ""
            }
          `
          : '<div class="empty-state">No scanned feeds today.</div>'
      }
    </section>
  `;
}

function nljrAllLinksView() {
  const today = nljrFeed.today || {};
  const requestedDate = state.postPageId || today.date;
  const items = (requestedDate === today.date) ? (today.items || []) : [];

  return `
    <section class="panel nljr-edition-header">
      <div class="panel-header">
        <div>
          <p class="eyebrow">All Scanned Feeds</p>
          <h3>NLJR · ${escapeHtml(requestedDate || "Unknown date")}</h3>
          <p>Complete list of all feeds scanned and analyzed for this edition.</p>
        </div>
        <div class="panel-action-stack">
          <a class="ghost-button compact-action" href="#daily/${escapeHtml(requestedDate)}" data-route="daily" data-post-id="${escapeHtml(requestedDate)}">Back to Daily Edition</a>
        </div>
      </div>
    </section>
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>All Scanned Articles (${items.length})</h3>
        </div>
      </div>
      ${
        items.length
          ? `
            <ul class="nljr-all-links-list" style="list-style-type: disc; padding-left: 20px; line-height: 1.8;">
              ${items.map(item => `
                <li style="margin-bottom: 8px;">
                  <a href="${escapeHtml(item.url)}" target="_blank" style="font-weight: 500; text-decoration: underline;">${escapeHtml(item.title)}</a>
                  <span style="color: var(--muted); margin-left: 6px;">(Source: ${escapeHtml(item.sourceName)})</span>
                </li>
              `).join("")}
            </ul>
          `
          : '<div class="empty-state">No scanned feed links available for this date.</div>'
      }
    </section>
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

function loadingView() {
  return `<section class="panel"><div class="empty-state">Loading NLJR datasets...</div></section>`;
}

function errorView() {
  return `<section class="panel"><div class="empty-state">${escapeHtml(state.error)}</div></section>`;
}

function render() {
  const view = document.querySelector("#app-view");
  if (!view) return;

  if (state.loading) {
    view.innerHTML = loadingView();
    return;
  }
  if (state.error) {
    view.innerHTML = errorView();
    return;
  }

  if (state.route === "daily") {
    view.innerHTML = nljrDayView();
  } else if (state.route === "all-links") {
    view.innerHTML = nljrAllLinksView();
  } else if (state.route === "console") {
    view.innerHTML = sourceManagementView();
    bindSourceManagementEvents();
  } else if (state.route === "archives") {
    view.innerHTML = dailyArchivesView();
  }

  let modalWrapper = document.querySelector("#modal-wrapper");
  if (!modalWrapper) {
    modalWrapper = document.createElement("div");
    modalWrapper.id = "modal-wrapper";
    document.body.appendChild(modalWrapper);
  }
  modalWrapper.innerHTML = modalView();
  bindModalEvents();

  bindNavigation();
}

function bindNavigation() {
  document.querySelectorAll(".nav-item").forEach((element) => {
    element.removeEventListener("click", navClickHandler);
    element.addEventListener("click", navClickHandler);
  });

  const mobileToggle = document.querySelector("#mobile-menu-toggle");
  if (mobileToggle) {
    mobileToggle.removeEventListener("click", toggleMobileMenuHandler);
    mobileToggle.addEventListener("click", toggleMobileMenuHandler);
  }
}

function navClickHandler(event) {
  const element = event.currentTarget;
  const href = element.getAttribute("href");
  if (href && href.startsWith("#")) {
    event.preventDefault();
    const { route, postId } = parseRouteHash(href);
    setRoute(route, { postId });
    setMobileMenu(false);
  }
}

function toggleMobileMenuHandler() {
  const menu = document.querySelector("#mobile-menu");
  const open = menu ? menu.hidden : false;
  setMobileMenu(open);
}

function setMobileMenu(open) {
  const menu = document.querySelector("#mobile-menu");
  const toggle = document.querySelector("#mobile-menu-toggle");
  if (!menu || !toggle) return;
  menu.hidden = !open;
  toggle.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
}

function bindSourceManagementEvents() {
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
      const mode = button.dataset.addSourceMode;
      if (mode === "subscription") {
        state.modal = { type: "add-subscription", name: "", url: "", error: "", saving: false };
        render();
      } else {
        await addSourceRegistrySource(mode);
      }
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

  const toggleSubBtn = document.querySelector("#toggle-all-subscriptions-button");
  if (toggleSubBtn) {
    toggleSubBtn.addEventListener("click", () => {
      state.showAllSubscriptions = !state.showAllSubscriptions;
      render();
    });
  }

  const toggleRandomTopicsBtn = document.querySelector("#toggle-all-random-topics-button");
  if (toggleRandomTopicsBtn) {
    toggleRandomTopicsBtn.addEventListener("click", () => {
      state.showAllRandomTopics = !state.showAllRandomTopics;
      render();
    });
  }

  const toggleLedgerBtn = document.querySelector("#toggle-all-ledger-button");
  if (toggleLedgerBtn) {
    toggleLedgerBtn.addEventListener("click", () => {
      state.showAllArticleLedger = !state.showAllArticleLedger;
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

  const refreshButton = document.querySelector("#nljr-refresh-button");
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

async function updateSourceRegistryField(sourceId, field, value) {
  const source = getRegistrySource(sourceId);
  if (!source) return;
  const parsedValue = parseSourceFieldValue(field, value);
  source[field] = parsedValue;

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

function defaultSourceForMode(mode) {
  const now = Date.now();
  if (mode === "keyword_watch") {
    return {
      id: `keyword-watch-${now}`,
      name: "New Keyword Watch",
      sourceMode: "keyword_watch",
      type: "keyword",
      status: "active",
      priority: "medium",
      relevance: ["Strategy"],
      tags: [],
      notes: "",
      keywords: [],
      platforms: ["Google"],
      language: ["English"],
      lookbackHours: 24,
    };
  }
  if (mode === "manual_inbox") {
    return {
      id: `manual-inbox-${now}`,
      name: "New Adhoc Source",
      sourceMode: "manual_inbox",
      type: "manual",
      status: "active",
      priority: "medium",
      relevance: ["Strategy"],
      tags: [],
      notes: "",
      inboxPath: "trend_inbox/manual",
      acceptedFormats: ["link", "screenshot", "note"],
      defaultRelevance: ["Strategy"],
    };
  }
  return {
    id: `subscription-${now}`,
    name: "New Subscription",
    sourceMode: "subscription",
    type: "website",
    status: "active",
    priority: "medium",
    relevance: ["Strategy"],
    tags: [],
    notes: "",
    url: "",
    fetchMethod: "rss",
    feedUrl: "",
    homepageUrl: "",
    lastCheckedAt: "",
    lastItemSeen: "",
  };
}

async function addSourceRegistrySource(mode) {
  const source = defaultSourceForMode(mode);
  sourceRegistry.sources.unshift(source);
  state.sourceEditingId = source.id;

  try {
    const result = await apiRequest("/api/source-registry/source", {
      method: "POST",
      body: JSON.stringify({ source }),
    });
    sourceRegistry = result.data || sourceRegistry;
    state.actionMessage = "Source added.";
  } catch (error) {
    state.actionMessage = `Could not add source: ${error.message}`;
  }
  render();
}

async function archiveSourceRegistrySource(sourceId) {
  const source = getRegistrySource(sourceId);
  if (!source) return;
  source.status = "archived";
  if (state.sourceEditingId === sourceId) state.sourceEditingId = null;

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

// Global click delegation for dynamically rendered elements (like Refresh and Add/Edit buttons)
document.addEventListener("click", (event) => {
  const target = event.target;
  
  if (target.id === "nljr-refresh-button") {
    void refreshNLJRFeeds();
  }

  const addMode = target.dataset.addSourceMode;
  if (addMode) {
    if (addMode === "subscription") {
      state.modal = { type: "add-subscription", name: "", url: "", error: "", saving: false };
      render();
    } else {
      void addSourceRegistrySource(addMode);
    }
  }

  const editId = target.dataset.editSource;
  if (editId) {
    state.sourceEditingId = editId;
    render();
  }

  const finishId = target.dataset.finishEditSource;
  if (finishId) {
    if (state.sourceEditingId === finishId) {
      state.sourceEditingId = null;
    }
    render();
  }

  const archiveId = target.dataset.archiveSource;
  if (archiveId) {
    void archiveSourceRegistrySource(archiveId);
  }
});

// Setup navigation listener
window.addEventListener("hashchange", () => {
  const { route, postId } = parseRouteHash(window.location.hash);
  setRoute(route, { postId });
});

// Initial boot
const { route, postId } = parseRouteHash(window.location.hash);
state.route = route;
state.postPageId = postId;
void loadRealData();

function modalView() {
  if (!state.modal) return "";
  if (state.modal.type === "add-subscription") {
    return addSubscriptionModalView();
  }
  return "";
}

function addSubscriptionModalView() {
  const { name, url, error, saving } = state.modal;
  return `
    <div class="modal-backdrop" role="presentation" id="modal-backdrop">
      <section class="modal-panel" role="dialog" aria-modal="true" aria-label="Add Subscription">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Autodiscover</p>
            <h3>Add New Subscription</h3>
          </div>
          <button class="ghost-button compact-action" type="button" id="modal-close-button">×</button>
        </div>
        <div class="modal-body" style="padding-top: 10px;">
          <form id="add-subscription-form" style="display: grid; gap: 14px;">
            ${error ? `<p class="action-message danger-action" style="margin: 0; padding: 10px; border-radius: 6px; background: #fff1f0; border: 1px solid #ffa39e; color: var(--danger); font-size: 13px;">${escapeHtml(error)}</p>` : ""}
            <label style="display: grid; gap: 6px;">
              <span class="nav-group-label" style="font-size: 11px;">Source Name (Optional)</span>
              <input class="source-input" id="modal-source-name" type="text" placeholder="e.g. Lenny's Newsletter (autofilled if blank)" value="${escapeHtml(name)}" ${saving ? "disabled" : ""} />
            </label>
            <label style="display: grid; gap: 6px;">
              <span class="nav-group-label" style="font-size: 11px;">Website or YouTube URL</span>
              <input class="source-input" id="modal-source-url" type="url" required placeholder="e.g. https://www.youtube.com/@PeterYangYT" value="${escapeHtml(url)}" ${saving ? "disabled" : ""} />
            </label>
            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
              <button class="ghost-button" type="button" id="modal-cancel-button" ${saving ? "disabled" : ""}>Cancel</button>
              <button class="primary-button" type="submit" id="modal-submit-button" ${saving ? "disabled" : ""}>
                ${saving ? "Autodiscovering..." : "Add Subscription"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  `;
}

function bindModalEvents() {
  if (!state.modal) return;

  const closeBtn = document.querySelector("#modal-close-button");
  const cancelBtn = document.querySelector("#modal-cancel-button");
  const backdrop = document.querySelector("#modal-backdrop");
  const form = document.querySelector("#add-subscription-form");

  const closeHandler = () => {
    state.modal = null;
    render();
  };

  if (closeBtn) closeBtn.addEventListener("click", closeHandler);
  if (cancelBtn) cancelBtn.addEventListener("click", closeHandler);
  if (backdrop) {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeHandler();
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nameInput = document.querySelector("#modal-source-name");
      const urlInput = document.querySelector("#modal-source-url");
      if (!urlInput || !urlInput.value.trim()) return;

      state.modal.name = nameInput ? nameInput.value : "";
      state.modal.url = urlInput.value;
      state.modal.saving = true;
      state.modal.error = "";
      render();

      try {
        const result = await apiRequest("/api/source-registry/autodiscover", {
          method: "POST",
          body: JSON.stringify({
            name: state.modal.name,
            url: state.modal.url
          })
        });
        sourceRegistry = result.data || sourceRegistry;
        state.actionMessage = `Successfully added: ${result.source.name}`;
        state.modal = null;
      } catch (err) {
        state.modal.saving = false;
        state.modal.error = err.message || "Failed to autodiscover subscription feed.";
      }
      render();
    });
  }
}
