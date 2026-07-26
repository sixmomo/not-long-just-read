const state = {
  workspace: "xhs",
  route: "landing",
  query: "",
  pillar: "All pillars",
  topicFilters: {
    action: "All actions",
    status: "All statuses",
    title: "",
    pillar: "All pillars",
    source: "All sources",
    hypothesis: "",
  },
  postFilters: {
    title: "",
    status: "All statuses",
    pillar: "All pillars",
    date: "",
    source: "",
    nextStep: "",
    actions: "",
  },
  unifiedFilters: {
    topics: {
      action: "All actions",
      status: "All statuses",
      topic: "",
      pillar: "",
      hypothesis: "",
    },
    drafts: {
      draft: "",
      platform: "All platforms",
      status: "",
      pillar: "",
      nextStep: "",
    },
    posts: {
      post: "",
      platform: "All platforms",
      status: "",
      pillar: "",
      article: "All article states",
      images: "All image states",
    },
  },
  unifiedFilterFocus: null,
  sourceFocus: null,
  postStatus: "All status",
  selectedTopicId: "",
  postPageId: "",
  postPageContent: {},
  postPageLoading: {},
  nljrArchiveContent: {},
  nljrArchiveLoading: {},
  nljrArchiveErrors: {},
  modal: null,
  sourceEditingId: null,
  showAllArticleLedger: false,
  showAllSubscriptions: false,
  showAllAdhocs: false,
  backendAvailable: false,
  actionMessage: "",
  loading: true,
  error: "",
};

let appData = {
  meta: { sources: [] },
  strategy: {},
  pageStyles: { library: [], currentPostOptions: [] },
  topicSources: [],
  topics: [],
  posts: [],
  publishedPosts: [],
  postMetrics: [],
};

let sourceRegistry = {
  meta: {
    name: "NLJR Source Registry",
    updatedAt: "",
  },
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

const linkedinData = {
  strategy: {
    audience: "Non-technical business owners who want practical AI Ops systems and lightweight AI products without becoming engineers.",
    positioning: "Practical AI Ops partner for owners who need workflows, tools, and product prototypes that save time, improve service, or create new revenue.",
    offerHypotheses: [
      "AI Ops audit and workflow redesign",
      "Custom AI tool / internal product prototype",
      "AI product idea validation",
      "Team enablement and SOP creation",
      "Founder advisory for AI implementation roadmap",
    ],
    voice: [
      "Plain English",
      "Business outcome first",
      "No AI jargon unless it directly explains a decision",
      "Specific workflow examples",
      "Trust-building and implementation-minded",
    ],
  },
  topics: [
    {
      id: "li-topic-1",
      priority: 1,
      status: "funnel",
      title: "Most small businesses do not need an AI strategy. They need an AI operating system.",
      pillar: "AI Ops",
      audience: "Service business owners",
      hypothesis: "Owners with messy operations may need an AI Ops audit and implementation roadmap.",
      format: "LinkedIn text post",
    },
    {
      id: "li-topic-2",
      priority: 2,
      status: "funnel",
      title: "The first AI product your business should build is probably not customer-facing.",
      pillar: "AI Products",
      audience: "Non-technical founders",
      hypothesis: "Founders may need help identifying a low-risk internal product before public launch.",
      format: "LinkedIn text post",
    },
    {
      id: "li-topic-3",
      priority: 3,
      status: "funnel",
      title: "Before hiring an AI agency, map the workflow you want AI to change.",
      pillar: "AI Implementation",
      audience: "Business owners evaluating vendors",
      hypothesis: "Vendor-evaluation pain can convert into advisory or implementation planning.",
      format: "LinkedIn text post",
    },
    {
      id: "li-topic-4",
      priority: 4,
      status: "funnel",
      title: "A useful AI tool starts with one boring repeated decision.",
      pillar: "AI Product Design",
      audience: "Operators and founders",
      hypothesis: "Simple decision automation is a strong entry point for AI product coaching.",
      format: "LinkedIn text post",
    },
  ],
  posts: [
    {
      id: "li-post-1",
      status: "Briefed",
      title: "Most small businesses do not need an AI strategy. They need an AI operating system.",
      pillar: "AI Ops",
      nextStep: "Generate Draft",
      brief: "Explain why owners should start with operational bottlenecks, not generic AI transformation language.",
      article: `Most small businesses do not need an AI strategy.

They need an AI operating system.

"AI strategy" sounds impressive, but for a non-technical business owner, it often turns into a list of tools:

ChatGPT for writing.
Zapier for automation.
Notion for docs.
Some chatbot for support.
Maybe an AI agent because everyone keeps talking about agents.

The problem is that tools do not fix an unclear workflow.

If your intake process is messy, AI will make the mess faster.

If your customer follow-up depends on memory, AI will only help after the follow-up rules are clear.

If your team handles quoting, reporting, scheduling, or support differently every time, the first job is not "build an AI product."

The first job is to map the operating loop.

For most businesses, a useful AI Ops system starts with five questions:

1. What repeated workflow creates the most drag?
2. What information enters that workflow?
3. What decisions happen again and again?
4. Which parts should AI draft, summarize, classify, or recommend?
5. Where does a human still need to approve the output?

That is where useful AI products come from.

Not from asking, "What AI tool should we use?"

But from asking, "What business workflow are we trying to make more reliable?"

A good first AI project is usually boring:

- qualify inbound leads
- summarize client intake
- draft follow-up emails
- turn meeting notes into next steps
- classify support requests
- generate first-pass quotes
- create weekly ops reports

Boring is good.

Boring means the workflow happens often enough to matter.

Boring means you can measure whether AI saved time, improved quality, or reduced missed follow-ups.

Boring means the product has a real business reason to exist.

If you are a non-technical business owner trying to use AI, do not start with a tool list.

Start with one workflow your business already runs every week.

Map it.
Simplify it.
Then decide where AI belongs.

That is the beginning of an AI operating system.

Not a deck.
Not a trend.
An actual way your business works better.

What is one repeated workflow in your business that still feels too manual?`,
    },
  ],
};

const workspaceConfig = {
  home: {
    label: "Ops Home",
    note: "",
    routes: ["topics", "articles", "posts", "page-styles", "strategy", "post", "nljr-day", "nljr-all-links"],
  },
  xhs: {
    label: "XHS Ops",
    note: "XHS operating system",
    routes: ["landing", "strategy", "page-styles", "topics", "articles", "posts", "post"],
  },
  linkedin: {
    label: "LinkedIn Ops",
    note: "LinkedIn operating system",
    routes: ["landing", "strategy", "topics", "articles", "posts", "post"],
  },
};

const productionModules = [
  {
    key: "brief",
    label: "Brief Template",
    purpose: "Reusable lightweight strategy card for one selected topic.",
    useWhen: "Use after ideation/topic selection and before generating copy.",
    templatePath: "data/templates/post_brief_template.md",
  },
  {
    key: "carouselScript",
    label: "Carousel Script Template",
    purpose: "Reusable page-by-page structure for carousel posts.",
    useWhen: "Use when the selected post format is a carousel.",
    templatePath: "data/templates/carousel_script_template.md",
  },
  {
    key: "visualStyleOptions",
    label: "Visual Style Options Template",
    purpose: "Reusable framework for choosing a visual system.",
    useWhen: "Use when a post needs designed visuals.",
    templatePath: "data/templates/visual_style_options_template.md",
  },
  {
    key: "imagePrompts",
    label: "Image Prompts Template",
    purpose: "Reusable structure for page-level image prompts and acceptance criteria.",
    useWhen: "Use when a post needs generated images or visual backgrounds.",
    templatePath: "data/templates/image_prompts_template.md",
  },
];

const postActionLabels = {
  whyRecommended: "Topic",
  brief: "Brief",
  generateCopy: "Generate Copy",
  reviewCopy: "Review Copy",
  generateDraft: "Generate Draft",
  visualDirection: "Generate Image",
  imagePrompts: "Generate Image",
  images: "Generate Image",
  publishPackage: "Ready",
  generateImageWorkflow: "Generate Image",
  publish: "Publish",
  generateImages: "Generate Images",
  publishCopy: "Publish Copy",
  copyReview: "Copy Review",
};

const postStatusOptions = [
  "All statuses",
  "Added",
  "Drafted",
  "Generate Image",
  "Ready",
  "Archived",
];

function normalizePostStatus(status) {
  const mapping = {
    selected_topic: "Added",
    briefed: "Added",
    visual_option_selected: "Generate Image",
    image_prompts_requested: "Generate Image",
    image_prompts_ready: "Generate Image",
    image_generation_requested: "Generate Image",
    image_generation_ready: "Generate Image",
    images_generated: "Generate Image",
    publish_ready: "Ready",
    "Visual Direction Done": "Generate Image",
    "Image Prompts done": "Generate Image",
    "Image Generated": "Generate Image",
    "Ready to Publish": "Ready",
    archived: "Archived",
  };
  return mapping[status] || status || "Added";
}

const recommendedIndicators = [
  {
    name: "Save Rate",
    value: "Recommended",
    note: "Best proxy for usefulness and future coaching demand.",
  },
  {
    name: "Comment Signal",
    value: "Recommended",
    note: "Look for background, target role, project, rejection, or portfolio details.",
  },
  {
    name: "Lead Signal",
    value: "Recommended",
    note: "DMs, consult intent, mock interview asks, or project diagnosis asks.",
  },
  {
    name: "Commercial Hypothesis Coverage",
    value: "Recommended",
    note: "Portfolio, positioning, interview prep, mock interview, story alignment.",
  },
  {
    name: "Publishing Rhythm",
    value: "Recommended",
    note: "Enough cadence to learn without lowering judgment quality.",
  },
];

const homePipelineSteps = [
  {
    label: "Templates",
    title: "Maintain reusable modules",
    note: "Brief, Carousel Script, Visual Style Options, and Image Prompts live as reusable templates.",
  },
  {
    label: "Ideation",
    title: "Capture signal or idea",
    note: "Trend screenshot, comment, coaching observation, old viral asset, or strategy-backed topic.",
  },
  {
    label: "Brief",
    title: "Create lightweight brief",
    note: "Confirm audience, pain, commercial hypothesis, format, and desired comment signal.",
  },
  {
    label: "Copy",
    title: "Generate and review copy",
    note: "Draft title, caption, hashtags, pinned comment, then review for voice, save value, and CTA boundaries.",
  },
  {
    label: "Visual",
    title: "Apply visual direction",
    note: "Choose the style for this post and generate page-level prompts only when images are needed.",
  },
  {
    label: "Publish",
    title: "Prepare publish package",
    note: "Final title, caption, images, tags, pinned comment, and post-review checklist.",
  },
];

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
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
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

function resolveProjectAssetPaths(assetPath) {
  if (!assetPath) return [];
  const paths = [assetPath];
  if (assetPath.startsWith("content_pipeline/")) {
    paths.push(`../${assetPath}`, `/${assetPath}`);
  }
  return [...new Set(paths)];
}

function assetLabel(assetKey) {
  return (
    productionModules.find((asset) => asset.key === assetKey)?.label ||
    postActionLabels[assetKey] ||
    assetKey
  );
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

function normalizeSourceId(value) {
  const base = String(value || "source")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "source";
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
  appData.topics.forEach((topic) => {
    if (!topic.sourceId && topic.source) {
      topic.sourceId = normalizeSourceId(topic.source);
    }
  });
  return appData.topicSources;
}

function getTopicSource(topic) {
  const sources = getTopicSources();
  const source =
    sources.find((item) => item.id === topic.sourceId) ||
    sources.find((item) => item.label === topic.source);
  return source || { id: topic.sourceId || "", label: topic.source || "Unknown source", path: "" };
}

function sourceUsageCount(sourceId) {
  return appData.topics.filter((topic) => topic.sourceId === sourceId).length;
}

function getPostById(postId) {
  return [...appData.posts, ...appData.publishedPosts].find((item) => item.id === postId);
}

function ensurePostWorkflow(post) {
  post.workflowState = post.workflowState || {};
  return post.workflowState;
}

async function fetchPostAssetText(post, assetKey) {
  const assetPath = post?.assets?.[assetKey];
  if (!post || !assetPath) return "";
  let response = null;
  for (const path of resolveProjectAssetPaths(assetPath)) {
    response = await fetch(path, { cache: "no-store" }).catch(() => null);
    if (response?.ok) break;
  }
  if (!response?.ok) {
    throw new Error(`Could not load ${assetPath}`);
  }
  return response.text();
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

  if (state.workspace === "home" && state.route === "nljr-day" && state.postPageId === date) {
    render();
  }
}

function postPageContentKey(workspace, postId) {
  return `${workspace}:${postId}`;
}

async function loadXhsPostPageContent(post) {
  if (!post?.id) return;
  const key = postPageContentKey("xhs", post.id);
  if (state.postPageContent[key] || state.postPageLoading[key]) return;
  state.postPageLoading[key] = true;
  render();
  try {
    const article = await fetchPostAssetText(post, "publishCopy").catch(() => "");
    state.postPageContent[key] = {
      article,
    };
  } catch (_error) {
    state.postPageContent[key] = {
      article: "",
    };
  } finally {
    state.postPageLoading[key] = false;
    render();
  }
}

function getXhsPostImages(post) {
  const workflow = post.workflowState?.imageWorkflow || {};
  return [
    ...(workflow.generatedImages || []),
    ...(post.generatedImages || []),
  ].filter(Boolean);
}

function topicStatus(topic) {
  if (topic.status === "new" || topic.status === "generated") return "funnel";
  if (topic.status === "deselected") return "cancelled";
  if (topic.status) return topic.status;
  const selected = [...appData.posts, ...appData.publishedPosts].some(
    (post) => post.topicId === topic.id || post.title === topic.title,
  );
  return selected ? "selected" : "funnel";
}

function topicPriority(topic, index = 0) {
  const value = Number(topic.priority);
  return Number.isFinite(value) ? value : index + 1;
}

function topicPlatform(topic, fallback = "XHS") {
  return topic.platform || fallback;
}

function platformOptions(selected) {
  return ["XHS", "LinkedIn", "Both"]
    .map(
      (platform) =>
        `<option value="${platform}" ${platform === selected ? "selected" : ""}>${platform}</option>`,
    )
    .join("");
}

function selectOptions(options, selected) {
  return options
    .map((option) => `<option value="${escapeHtml(option)}" ${option === selected ? "selected" : ""}>${escapeHtml(option)}</option>`)
    .join("");
}

function matchesFilter(value, filterValue) {
  const filter = String(filterValue || "").trim().toLowerCase();
  if (!filter) return true;
  return String(value || "").toLowerCase().includes(filter);
}

function matchesSelect(value, selected, allValue) {
  return selected === allValue || String(value || "") === selected;
}

function unifiedTopics() {
  const xhsTopics = appData.topics.map((topic) => ({
    ...topic,
    origin: "xhs",
    platform: topicPlatform(topic, "XHS"),
    audience: "XHS AI PM audience",
    format: "XHS content",
  }));
  const linkedInTopics = linkedinData.topics.map((topic) => ({
    ...topic,
    origin: "linkedin",
    platform: topicPlatform(topic, "LinkedIn"),
    sourceId: "linkedin-ops",
    source: "LinkedIn Ops",
  }));
  return [...xhsTopics, ...linkedInTopics];
}

function topicDraftState(topic, platform) {
  if (platform === "XHS") {
    return appData.posts.some((post) => post.topicId === topic.id || post.title === topic.title)
      ? "Created"
      : "Not created";
  }
  return linkedinData.posts.some((post) => post.topicId === topic.id || post.title === topic.title)
    ? "Created"
    : "Not created";
}

function topicProgressStatus(topic) {
  const relatedXhsPosts = [...appData.posts, ...appData.publishedPosts].filter(
    (post) => post.topicId === topic.id || post.title === topic.title,
  );
  const relatedLinkedInPosts = linkedinData.posts.filter(
    (post) => post.topicId === topic.id || post.title === topic.title,
  );
  const allRelatedPosts = [...relatedXhsPosts, ...relatedLinkedInPosts];
  const hasReadyPost = allRelatedPosts.some((post) => {
    const status = normalizePostStatus(post.status);
    return status === "Ready" || status === "Ready to Post" || status === "Published";
  });
  const hasPublishedPost = appData.publishedPosts.some(
    (post) => post.topicId === topic.id || post.title === topic.title,
  );

  if (hasReadyPost || hasPublishedPost) return "Ready to Post";
  if (allRelatedPosts.length) return "Drafting";
  return "Created";
}

function allTopicDraftsCreated(topic) {
  return topicDraftState(topic, "XHS") === "Created" && topicDraftState(topic, "LinkedIn") === "Created";
}

function availableDraftTargets(topic) {
  const xhsCreated = topicDraftState(topic, "XHS") === "Created";
  const linkedInCreated = topicDraftState(topic, "LinkedIn") === "Created";
  return [
    { value: "XHS", label: "Xiaohongshu", disabled: xhsCreated },
    { value: "LinkedIn", label: "LinkedIn", disabled: linkedInCreated },
    { value: "Both", label: "Both", disabled: xhsCreated && linkedInCreated },
  ];
}

function sortedTopics(topics) {
  const statusRank = {
    selected: 0,
    funnel: 1,
    cancelled: 2,
  };
  const originalIndex = new Map(appData.topics.map((topic, index) => [topic.id, index]));
  return [...topics].sort((a, b) => {
    const rankDiff = (statusRank[topicStatus(a)] ?? 9) - (statusRank[topicStatus(b)] ?? 9);
    if (rankDiff) return rankDiff;
    const priorityDiff =
      topicPriority(a, originalIndex.get(a.id) || 0) - topicPriority(b, originalIndex.get(b.id) || 0);
    if (priorityDiff) return priorityDiff;
    return (originalIndex.get(a.id) || 0) - (originalIndex.get(b.id) || 0);
  });
}

async function loadRealData() {
  state.loading = true;
  state.error = "";
  render();

  try {
    appData = await fetchRealData();
    sourceRegistry = await fetchSourceRegistry();
    nljrFeed = await fetchNLJRFeed();
    nljrArticleLedger = await fetchNLJRArticleLedger();
    await applyLinkedInOverrides();
    state.selectedTopicId = appData.topics[0]?.id || "";
  } catch (error) {
    state.error =
      `Could not load real data. Open http://127.0.0.1:4173/index.html, or run the local server from the project root. Last error: ${error.message}`;
  } finally {
    state.loading = false;
    render();
    if (state.workspace === "home" && state.route === "nljr-day" && state.postPageId) {
      void loadNLJRArchiveEdition(state.postPageId);
    }
  }
}

async function applyLinkedInOverrides() {
  const overrides = await fetchLinkedInOverrides();
  const platforms = overrides.topicPlatforms || {};
  linkedinData.topics.forEach((topic) => {
    if (platforms[topic.id]) topic.platform = platforms[topic.id];
  });
}

async function fetchLinkedInOverrides() {
  const candidates = [
    "/api/linkedin-overrides",
    "./data/linkedin-overrides.json",
    "/data/linkedin-overrides.json",
    "ui/data/linkedin-overrides.json",
    "/ui/data/linkedin-overrides.json",
  ];
  let lastError = "";

  for (const path of candidates) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) {
        lastError = `${path} returned ${response.status}`;
        continue;
      }
      return await response.json();
    } catch (error) {
      lastError = `${path} failed`;
    }
  }

  console.warn(`Could not load LinkedIn overrides: ${lastError}`);
  return { topicPlatforms: {} };
}

async function fetchRealData() {
  const candidates = [
    "/api/data",
    "./data/xhs-data.json",
    "/data/xhs-data.json",
    "ui/data/xhs-data.json",
    "/ui/data/xhs-data.json",
  ];
  let lastError = "";

  for (const path of candidates) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) {
        lastError = `${path} returned ${response.status}`;
        continue;
      }
      const data = await response.json();
      state.backendAvailable = path === "/api/data";
      return data;
    } catch (error) {
      lastError = `${path} failed`;
    }
  }

  throw new Error(lastError || "No data path responded.");
}

async function fetchSourceRegistry() {
  const candidates = [
    "/api/source-registry",
    "./data/source-registry.json",
    "/data/source-registry.json",
    "ui/data/source-registry.json",
    "/ui/data/source-registry.json",
  ];
  let lastError = "";

  for (const path of candidates) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) {
        lastError = `${path} returned ${response.status}`;
        continue;
      }
      const data = await response.json();
      return {
        meta: data.meta || { name: "NLJR Source Registry", updatedAt: "" },
        sources: Array.isArray(data.sources) ? data.sources : [],
      };
    } catch (error) {
      lastError = `${path} failed`;
    }
  }

  console.warn(`Could not load source registry: ${lastError}`);
  return { meta: { name: "NLJR Source Registry", updatedAt: "" }, sources: [] };
}

async function fetchNLJRFeed() {
  const candidates = [
    "/api/nljr-feed",
    "./data/nljr-feed.json",
    "/data/nljr-feed.json",
    "ui/data/nljr-feed.json",
    "/ui/data/nljr-feed.json",
  ];
  let lastError = "";

  for (const path of candidates) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) {
        lastError = `${path} returned ${response.status}`;
        continue;
      }
      const data = await response.json();
      return {
        today: data.today || { status: "not_generated", items: [], sourceHealth: {} },
        archive: Array.isArray(data.archive) ? data.archive : [],
      };
    } catch (error) {
      lastError = `${path} failed`;
    }
  }

  console.warn(`Could not load NLJR feed: ${lastError}`);
  return { today: { status: "not_generated", items: [], sourceHealth: {} }, archive: [] };
}

async function fetchNLJRArticleLedger() {
  const candidates = [
    "/api/nljr-article-ledger",
    "./data/nljr-article-ledger.json",
    "/data/nljr-article-ledger.json",
    "ui/data/nljr-article-ledger.json",
    "/ui/data/nljr-article-ledger.json",
  ];
  for (const path of candidates) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) continue;
      const data = await response.json();
      return {
        meta: data.meta || { name: "NLJR Article Ledger", updatedAt: "" },
        articles: Array.isArray(data.articles) ? data.articles : [],
      };
    } catch {
      // Try the next file-backed location.
    }
  }
  return { meta: { name: "NLJR Article Ledger", updatedAt: "" }, articles: [] };
}

function routeHash(workspace = state.workspace, route = state.route, postId = state.postPageId) {
  if (workspace === "home" && route === "landing") return "";
  if (workspace === "home" && route === "post" && postId) return `#post/${postId}`;
  if (workspace === "home" && route === "nljr-day" && postId) return `#nljr-day/${postId}`;
  if (workspace === "home" && route === "nljr-all-links" && postId) return `#nljr-all-links/${postId}`;
  if (workspace === "home") return `#${route}`;
  if (route === "post" && postId) return `#${workspace}/post/${postId}`;
  return `#${workspace}/${route}`;
}

function parseRouteHash(hashValue) {
  const raw = String(hashValue || "").replace(/^#/, "");
  if (!raw) return { workspace: "home", route: "topics" };
  if (raw.includes("/")) {
    const [first, second, postId = ""] = raw.split("/");
    // Legacy format: #home/route or #workspace/route
    if (workspaceConfig[first]?.routes.includes(second)) {
      return { workspace: first, route: second, postId };
    }
    // New clean format: #nljr-day/2025-01-01
    if (workspaceConfig.home.routes.includes(first)) {
      return { workspace: "home", route: first, postId: second };
    }
  }
  // Clean format: #nljr, #topics, #articles etc.
  if (workspaceConfig.home.routes.includes(raw)) {
    return { workspace: "home", route: raw };
  }
  if (workspaceConfig.xhs.routes.includes(raw)) {
    return { workspace: "xhs", route: raw };
  }
  if (raw === "home" || raw === "landing") return { workspace: "home", route: "topics" };
  return { workspace: "home", route: "topics" };
}

function pageTitle(route) {
  const titles = {
    landing: "Home",
    strategy: "Strategy",
    "page-styles": "Image Style",
    topics: "Topics",
    articles: "Drafts",
    posts: "Post",
    nljr: "NLJR Console",
    "nljr-day": "Daily NLJR",
    "nljr-all-links": "Scanned Feed Links",
    "daily-archives": "Daily Archives",
    post: "Post",
  };
  return titles[route] || "Home";
}

function updatePrimaryNav() {
  const primary = document.querySelector(".primary-nav");
  if (!primary) return;
  primary.classList.add("grouped-primary-nav");
  primary.innerHTML = `
    <div class="nav-group" aria-label="Primary pages">
      <div class="nav-group-links unified-nav-links" style="display: flex; gap: 20px; align-items: center;">
        <a class="nav-item" href="#topics" data-workspace="home" data-route="topics">Topics</a>
        <a class="nav-item" href="#articles" data-workspace="home" data-route="articles">Drafts</a>
        <a class="nav-item" href="#posts" data-workspace="home" data-route="posts">Posts</a>
        <a class="nav-item" href="#page-styles" data-workspace="home" data-route="page-styles">Image Style</a>
        <a class="nav-item" href="#strategy" data-workspace="home" data-route="strategy">Strategy</a>
      </div>
    </div>
  `;
  bindNavigation();
}

function setRoute(nextRoute, options = {}) {
  const nextWorkspace = options.workspace || state.workspace || "xhs";
  const validRoutes = workspaceConfig[nextWorkspace]?.routes || workspaceConfig.xhs.routes;
  const safeRoute = validRoutes.includes(nextRoute) ? nextRoute : "landing";
  state.workspace = workspaceConfig[nextWorkspace] ? nextWorkspace : "xhs";
  state.route = safeRoute;
  state.postPageId =
    options.postId ||
    (safeRoute === "post"
      ? state.postPageId
      : safeRoute === "nljr-day"
        ? nljrFeed.today?.date || ""
        : "");
  if (state.workspace === "home" && state.route === "landing") {
    if (window.location.hash) {
      const homeUrl = `${window.location.pathname}${window.location.search}`;
      if (options.replace) {
        window.history.replaceState(null, "", homeUrl);
      } else {
        window.history.pushState(null, "", homeUrl);
      }
    }
  } else if (window.location.hash !== routeHash()) {
    if (options.replace) {
      window.history.replaceState(null, "", routeHash());
    } else {
      window.history.pushState(null, "", routeHash());
    }
  }
  updatePrimaryNav();
  document.querySelectorAll(".nav-item").forEach((item) => {
    const itemWorkspace = item.dataset.workspace || "xhs";
    item.classList.toggle(
      "active",
      itemWorkspace === state.workspace && item.dataset.route === state.route,
    );
    item.classList.toggle("workspace-active", itemWorkspace === state.workspace);
  });
  
  const opsRoutes = ["topics", "articles", "posts", "page-styles", "strategy"];
  const isOpsActive = opsRoutes.includes(state.route);
  const dropdownBtn = document.querySelector(".nav-dropdown-btn");
  if (dropdownBtn) {
    dropdownBtn.classList.toggle("active", isOpsActive);
  }
  document.querySelector("#page-title").textContent =
    state.workspace === "home"
      ? pageTitle(state.route)
      : `${workspaceConfig[state.workspace].label} / ${pageTitle(state.route)}`;
  document.querySelector("#workspace-note")?.remove();
  document.querySelector("#workspace-eyebrow")?.remove();
  render();
  if (state.workspace === "home" && state.route === "nljr-day" && state.postPageId) {
    void loadNLJRArchiveEdition(state.postPageId);
  }
}

function setMobileMenu(open) {
  const menu = document.querySelector("#mobile-menu");
  const toggle = document.querySelector("#mobile-menu-toggle");
  if (!menu || !toggle) return;
  menu.hidden = !open;
  toggle.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
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

function homePipelineView() {
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>Content Pipeline</h3>
          <p>Two-part system: reusable templates first, individual post production second.</p>
        </div>
      </div>
      <div class="home-pipeline">
        ${homePipelineSteps
          .map(
            (step, index) => `
              <article class="pipeline-step-card">
                <span class="step-index">${index + 1}</span>
                <p class="eyebrow">${step.label}</p>
                <strong>${step.title}</strong>
                <small>${step.note}</small>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function loadingView() {
  return `<section class="panel"><div class="empty-state">Loading real project data...</div></section>`;
}

function errorView() {
  return `<section class="panel"><div class="empty-state">${state.error}</div></section>`;
}

function dataSourceView() {
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>Data Sources</h3>
          <p>This UI is using the current project data snapshot only.</p>
        </div>
      </div>
      <div class="card-meta">
        ${appData.meta.sources.map((source) => `<span class="pill">${source}</span>`).join("")}
      </div>
    </section>
  `;
}

function landingView() {
  const wipPosts = appData.posts.length;
  const publishedPosts = appData.publishedPosts.length;
  return `
    <section class="metrics-grid home-metrics">
      ${metricCard("WIP posts", wipPosts.toLocaleString(), "Unpublished topics/content currently in the post pipeline.")}
      ${metricCard("Published posts", publishedPosts.toLocaleString(), "Loaded from content_pipeline/published.")}
    </section>

    ${homePipelineView()}

    <section class="two-column">
      <article class="panel">
        <div class="panel-header">
          <div>
            <h3>Recommended XHS Indicators</h3>
            <p>Recommendations only; performance metrics appear after real data exists.</p>
          </div>
        </div>
        <div class="indicator-list">
          ${recommendedIndicators
            .map(
              (item) => `
                <div class="indicator-row">
                  <div>
                    <strong>${item.name}</strong>
                    <p>${item.note}</p>
                  </div>
                  <span class="score">${item.value}</span>
                </div>
              `,
            )
            .join("")}
        </div>
      </article>
    </section>

    ${dataSourceView()}
  `;
}

function groupTopicsByPillar() {
  return appData.topics.reduce((groups, topic) => {
    groups[topic.pillar] = groups[topic.pillar] || [];
    groups[topic.pillar].push(topic);
    return groups;
  }, {});
}

function strategyComponentCard(title, source, body, meta = "") {
  return `
    <article class="strategy-card">
      <div class="strategy-card-header">
        <div>
          <p class="eyebrow">${escapeHtml(source)}</p>
          <h3>${escapeHtml(title)}</h3>
        </div>
        ${meta ? `<span class="pill good">${escapeHtml(meta)}</span>` : ""}
      </div>
      ${body}
    </article>
  `;
}

function strategyView() {
  const strategy = appData.strategy || {};
  const audience = strategy.audiencePersona || {};
  const topicMatrix = strategy.topicMatrix || {};
  const viral = strategy.viralReview || {};
  const voice = strategy.voiceGuidance || {};
  const topicGroups = groupTopicsByPillar();

  return `
    <section class="strategy-grid">
      ${strategyComponentCard(
        "Audience Persona",
        audience.source || "strategy/audience_persona.md",
        `
          <p>${escapeHtml(audience.summary || "No audience persona data found.")}</p>
          <div class="strategy-list-block">
            <strong>Priority segments</strong>
            <div class="card-meta">
              ${(audience.prioritySegments || []).map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join("")}
            </div>
          </div>
          <div class="strategy-question-list">
            ${(audience.coreQuestions || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
        `,
        `${(audience.prioritySegments || []).length} segments`,
      )}

      ${strategyComponentCard(
        "Topic Matrix",
        topicMatrix.source || "strategy/topic_matrix.md",
        `
          <p>${escapeHtml(topicMatrix.strategy || "No topic matrix summary found.")}</p>
          <div class="topic-pillar-chart">
            ${Object.entries(topicGroups)
              .map(([pillar, topics]) => {
                const width = Math.max(8, Math.round((topics.length / appData.topics.length) * 100));
                return `
                  <div class="pillar-row">
                    <div>
                      <strong>${escapeHtml(pillar)}</strong>
                      <span>${topics.length} topics</span>
                    </div>
                    <div class="pillar-bar"><span style="width: ${width}%"></span></div>
                  </div>
                `;
              })
              .join("")}
          </div>
          <div class="strategy-list-block">
            <strong>Commercial hypotheses</strong>
            <div class="card-meta">
              ${(topicMatrix.commercialHypotheses || []).map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join("")}
            </div>
          </div>
        `,
        `${appData.topics.length} topics`,
      )}

      ${strategyComponentCard(
        "Viral Review",
        viral.source || "strategy/viral_review.md",
        `
          <p class="formula-line">${escapeHtml(viral.strongestFormula || "No viral formula found.")}</p>
          <div class="strategy-pattern-grid">
            ${(viral.validatedPatterns || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
          ${
            viral.bestHistoricalSample
              ? `
                <div class="sample-metrics">
                  <strong>${escapeHtml(viral.bestHistoricalSample.name)}</strong>
                  <span>${escapeHtml(viral.bestHistoricalSample.views)} views</span>
                  <span>${viral.bestHistoricalSample.likes} likes</span>
                  <span>${viral.bestHistoricalSample.saves} saves</span>
                  <span>${viral.bestHistoricalSample.comments} comments</span>
                </div>
              `
              : ""
          }
        `,
        `${(viral.validatedPatterns || []).length} patterns`,
      )}

      ${strategyComponentCard(
        "Voice Guidance",
        voice.source || "strategy/voice_guide.md",
        `
          <div class="voice-grid">
            <div>
              <strong>Core voice</strong>
              <div class="card-meta">
                ${(voice.coreVoice || []).map((item) => `<span class="pill">${escapeHtml(item)}</span>`).join("")}
              </div>
            </div>
            <div class="voice-columns">
              <div>
                <strong>Say</strong>
                <ul>${(voice.say || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
              </div>
              <div>
                <strong>Do not say</strong>
                <ul>${(voice.doNotSay || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
              </div>
            </div>
          </div>
        `,
        `${(voice.coreVoice || []).length} traits`,
      )}
    </section>
  `;
}

function unifiedStrategyView() {
  return `
    <section class="strategy-grid">
      <article class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">XHS Strategy</p>
            <h3>North America AI PM Coaching</h3>
            <p>Chinese-first Xiaohongshu strategy for AI PM transition, AI portfolio coaching, and interview-ready project proof.</p>
          </div>
        </div>
        ${strategyView()}
      </article>
      <article class="panel">
        <div class="panel-header">
          <div>
            <p class="eyebrow">LinkedIn Strategy</p>
            <h3>AI Ops For Business Owners</h3>
            <p>${escapeHtml(linkedinData.strategy.positioning)}</p>
          </div>
        </div>
        ${linkedinStrategyView()}
      </article>
    </section>
  `;
}

function sourceManagementView() {
  return `
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
        <span class="pill">${entries.length} entries</span>
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
          <h3>Today’s NLJR</h3>
          <p>Not Long; Just Read. Top signals generated from active sources, subscriptions, and adhocs.</p>
        </div>
        <div class="panel-action-stack" style="display: flex; gap: 8px; align-items: center;">
          <span class="pill">${escapeHtml(today.date || "Not generated")}</span>
          ${
            state.backendAvailable
              ? `<button class="primary-button compact-action" id="nljr-refresh-button" type="button">Refresh Feeds</button>`
              : ""
          }
          ${
            today.date
              ? `<a class="ghost-button compact-action" href="#home/nljr-day/${escapeHtml(today.date)}" data-workspace="home" data-route="nljr-day" data-post-id="${escapeHtml(today.date)}">Open Today’s NLJR</a>`
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
            <a class="ghost-button compact-action" href="#home/daily-archives" data-workspace="home" data-route="daily-archives">Back to Archives</a>
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
  const additional = items.filter((item) => !recommendedIds.has(item.articleId || item.id));
  return `
    <section class="panel nljr-edition-header">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Daily Edition</p>
          <h3>NLJR · ${escapeHtml(today.date || "Not generated")}</h3>
          <p class="nljr-exec-summary">${renderInlineMarkdown(today.executiveSummary || today.dailySummary || "Three deep recommendations followed by a concise scan of the other most relevant new feeds.")}</p>
        </div>
        <div class="panel-action-stack">
          <span class="pill">${items.length} items</span>
          <a class="ghost-button compact-action" href="./index.html" data-workspace="home" data-route="landing">Back Home</a>
        </div>
      </div>
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
          : '<div class="empty-state">No recommended articles in this edition.</div>'
      }
    </section>
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Quick Scan</p>
          <h3>More New Feeds</h3>
          <p>List of all feeds scanned and processed for today's edition.</p>
        </div>
        <span class="pill">${additional.length} items</span>
      </div>
      ${
        additional.length
          ? `
            <ul class="nljr-scanned-links-list" style="list-style-type: disc; padding-left: 20px; line-height: 1.8; margin-bottom: 16px;">
              ${additional.slice(0, 5).map(item => `
                <li style="margin-bottom: 8px;">
                  <a href="${escapeHtml(item.url)}" target="_blank" style="font-weight: 500; text-decoration: underline;">${escapeHtml(item.title)}</a>
                  <span style="color: var(--muted); margin-left: 6px;">(Source: ${escapeHtml(item.sourceName)})</span>
                </li>
              `).join("")}
            </ul>
            ${
              additional.length > 5
                ? `<div style="margin-top: 12px;">
                    <a class="ghost-button compact-action" href="#home/nljr-all-links/${escapeHtml(today.date)}" data-workspace="home" data-route="nljr-all-links" data-post-id="${escapeHtml(today.date)}">Show all ${additional.length} links</a>
                   </div>`
                : ""
            }
          `
          : '<div class="empty-state">No additional feeds today.</div>'
      }
    </section>
  `;
}

function nljrAllLinksView() {
  const today = nljrFeed.today || {};
  const requestedDate = state.postPageId || today.date;
  const items = (requestedDate === today.date) ? (today.items || []) : [];
  const recommended = nljrRecommendedItems(today);
  const recommendedIds = new Set(recommended.map((item) => item.articleId || item.id));
  const additional = items.filter((item) => !recommendedIds.has(item.articleId || item.id));

  return `
    <section class="panel nljr-edition-header">
      <div class="panel-header">
        <div>
          <p class="eyebrow">All Scanned Feeds</p>
          <h3>NLJR · ${escapeHtml(requestedDate || "Unknown date")}</h3>
          <p>Complete list of all feeds scanned and analyzed for this edition.</p>
        </div>
        <div class="panel-action-stack">
          <a class="ghost-button compact-action" href="#home/nljr-day/${escapeHtml(requestedDate)}" data-workspace="home" data-route="nljr-day" data-post-id="${escapeHtml(requestedDate)}">Back to Daily Edition</a>
        </div>
      </div>
    </section>
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>All Scanned Articles (${additional.length})</h3>
        </div>
      </div>
      ${
        additional.length
          ? `
            <ul class="nljr-all-links-list" style="list-style-type: disc; padding-left: 20px; line-height: 1.8;">
              ${additional.map(item => `
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

function nljrItemView(item, index) {
  return `
    <article class="nljr-item-card">
      <div class="strategy-card-header">
        <div>
          <p class="eyebrow">${escapeHtml(item.sourceName || "Source")}</p>
          <h3>${item.url ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer" style="text-decoration: underline; color: inherit;">${escapeHtml(item.title || "Untitled signal")}</a>` : escapeHtml(item.title || "Untitled signal")}</h3>
        </div>
        <span class="pill nljr-priority-pill ${item.priority === "high" ? "hot" : ""}">${escapeHtml(item.priority || "medium")}</span>
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
        ${(item.suggestedUse || []).map((label) => `<span class="pill good">${escapeHtml(label)}</span>`).join("")}
      </div>
    </article>
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
        <a class="ghost-button compact-action" href="#home/daily-archives" data-workspace="home" data-route="daily-archives">View All</a>
      </div>
      ${
        entries.length
          ? `<div class="archive-list">${entries.map(nljrArchiveEntryView).join("")}</div>`
          : '<div class="empty-state">No archive entries yet.</div>'
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

function nljrArchiveEntryView(entry) {
  return `
    <article class="archive-row">
      <div>
        <strong>${escapeHtml(entry.date || "No date")}</strong>
        <p>${escapeHtml(entry.summary || `${entry.itemCount || 0} items`)}</p>
      </div>
      <div class="card-meta">
        <span class="pill">${escapeHtml(String(entry.itemCount || 0))} items</span>
        <a class="ghost-button compact-action" href="#home/nljr-day/${escapeHtml(entry.date || "")}" data-workspace="home" data-route="nljr-day" data-post-id="${escapeHtml(entry.date || "")}">Read NLJR</a>
      </div>
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

function processedArticleCount() {
  return nljrArticleLedger.articles.filter((article) => article.status === "processed").length;
}

function needsUrlConfirmationCount() {
  return sourceRegistry.sources.filter(
    (source) => source.status !== "archived" && String(source.sourceConfidence || "").includes("needs"),
  ).length;
}

function adhocSourceCount() {
  return sourceRegistry.sources.filter(
    (source) => source.status !== "archived" && source.sourceMode === "manual_inbox",
  ).length;
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

function pageStylesView() {
  const styles = appData.pageStyles || {};
  return `
    ${reusableProductionToolsView()}

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>页面风格库</h3>
          <p>Defined image styles from the XHS visual director style system.</p>
        </div>
        <span class="pill">${(styles.library || []).length} styles</span>
      </div>
      <div class="card-meta">
        <span class="pill">${escapeHtml(styles.librarySource || "")}</span>
      </div>
    </section>

    <section class="page-style-grid">
      ${(styles.library || [])
        .map(
          (name, index) => `
            <article class="page-style-card">
              <span class="step-index">${index + 1}</span>
              <h3>${escapeHtml(name)}</h3>
              <p>Defined in the visual style system.</p>
            </article>
          `,
        )
        .join("")}
    </section>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>Current Post Style Options</h3>
          <p>Style options already defined for the current WIP post.</p>
        </div>
      </div>
      <div class="current-style-grid">
        ${(styles.currentPostOptions || [])
          .map(
            (option) => `
              <article class="current-style-card ${option.status === "selected" ? "selected" : ""}">
                <div class="strategy-card-header">
                  <div>
                    <p class="eyebrow">${escapeHtml(option.bestFor)}</p>
                    <h3>${escapeHtml(option.name)}</h3>
                  </div>
                  <span class="pill ${option.status === "selected" ? "good" : ""}">${escapeHtml(option.status)}</span>
                </div>
                <div class="card-meta">
                  ${(option.keywords || []).map((keyword) => `<span class="pill">${escapeHtml(keyword)}</span>`).join("")}
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function unifiedTopicsView() {
  const filters = state.unifiedFilters.topics;
  const topicRows = unifiedTopics().map((topic) => {
    const status = topicProgressStatus(topic);
    const actionText = availableDraftTargets(topic)
      .filter((target) => !target.disabled)
      .map((target) => target.label)
      .join(" ");
    return {
      topic,
      status,
      actionText,
      hypothesisText: `${topic.hypothesis || ""} Priority ${topicPriority(topic)}`,
    };
  });
  const filteredRows = topicRows.filter((row) => (
    (filters.action === "All actions" || matchesFilter(row.actionText, filters.action)) &&
    matchesSelect(row.status, filters.status, "All statuses") &&
    matchesFilter(row.topic.title, filters.topic) &&
    matchesFilter(row.topic.pillar, filters.pillar) &&
    matchesFilter(row.hypothesisText, filters.hypothesis)
  ));
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>Topics</h3>
          <p>One idea inbox. Use Action to create a Xiaohongshu draft, LinkedIn draft, or both.</p>
        </div>
        <span class="pill">${filteredRows.length} / ${topicRows.length} topics</span>
      </div>
      ${state.actionMessage ? `<p class="action-message">${escapeHtml(state.actionMessage)}</p>` : ""}
      <div class="table-shell">
        <table class="topics-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Status</th>
              <th>Topic</th>
              <th>Pillar</th>
              <th>Commercial Hypothesis</th>
            </tr>
            <tr>
              <th>
                <select class="column-filter" data-unified-filter-table="topics" data-unified-filter="action">
                  ${selectOptions(["All actions", "Xiaohongshu", "LinkedIn", "Both"], filters.action)}
                </select>
              </th>
              <th>
                <select class="column-filter" data-unified-filter-table="topics" data-unified-filter="status">
                  ${selectOptions(["All statuses", "Created", "Drafting", "Ready to Post"], filters.status)}
                </select>
              </th>
              <th><input class="column-filter" data-unified-filter-table="topics" data-unified-filter="topic" type="search" placeholder="Filter topic" value="${escapeHtml(filters.topic)}" /></th>
              <th><input class="column-filter" data-unified-filter-table="topics" data-unified-filter="pillar" type="search" placeholder="Filter pillar" value="${escapeHtml(filters.pillar)}" /></th>
              <th><input class="column-filter" data-unified-filter-table="topics" data-unified-filter="hypothesis" type="search" placeholder="Filter hypothesis" value="${escapeHtml(filters.hypothesis)}" /></th>
            </tr>
          </thead>
          <tbody>
            ${filteredRows
              .map((row) => {
                const { topic, status } = row;
                const allDraftsCreated = allTopicDraftsCreated(topic);
                return `
                  <tr>
                    <td>
                      ${
                        status === "Created"
                          ? `<button class="primary-button compact-action" type="button" data-open-create-draft="${escapeHtml(topic.id)}" data-topic-origin="${escapeHtml(topic.origin)}" ${allDraftsCreated ? "disabled" : ""}>Create Draft</button>`
                          : '<span class="pill">Draft created</span>'
                      }
                    </td>
                    <td><span class="status-badge">${escapeHtml(status)}</span></td>
                    <td><strong>${escapeHtml(topic.title)}</strong><br /><span class="pill">${escapeHtml(topic.origin === "linkedin" ? "LinkedIn source" : "XHS source")}</span></td>
                    <td>${escapeHtml(topic.pillar || "")}</td>
                    <td>${escapeHtml(topic.hypothesis || "")}<br /><span class="pill">Priority ${topicPriority(topic)}</span></td>
                  </tr>
                `;
              })
              .join("") || '<tr><td colspan="5"><div class="empty-state">No topics match these filters.</div></td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function topicManagementView() {
  const topicFilters = state.topicFilters;
  const pillars = ["All pillars", ...new Set(appData.topics.map((topic) => topic.pillar))];
  const sources = getTopicSources();
  const statuses = [
    "All statuses",
    "selected",
    "funnel",
    "cancelled",
  ];
  const filtered = sortedTopics(appData.topics.filter((topic) => {
    const source = getTopicSource(topic);
    const status = topicStatus(topic);
    const matchesStatus =
      topicFilters.status === "All statuses" || status === topicFilters.status;
    const matchesTitle =
      !topicFilters.title ||
      topic.title.toLowerCase().includes(topicFilters.title.toLowerCase());
    const matchesPillar =
      topicFilters.pillar === "All pillars" || topic.pillar === topicFilters.pillar;
    const matchesSource =
      topicFilters.source === "All sources" || topic.sourceId === topicFilters.source;
    const matchesHypothesis =
      !topicFilters.hypothesis ||
      topic.hypothesis.toLowerCase().includes(topicFilters.hypothesis.toLowerCase());
    return (
      matchesStatus &&
      matchesTitle &&
      matchesPillar &&
      matchesSource &&
      matchesHypothesis &&
      source
    );
  }));

  return `
    <section class="topics-layout">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h3>Topic List</h3>
            <p>Loaded from real topics in strategy/topic_matrix.md and current processed signals.</p>
          </div>
          <span class="pill">${filtered.length} topics</span>
        </div>
        ${state.actionMessage ? `<p class="action-message">${escapeHtml(state.actionMessage)}</p>` : ""}
        <div class="table-shell">
          <table class="topics-table">
            <thead>
              <tr>
                <th>
                  <span>Action</span>
                </th>
                <th>
                  <span>Status</span>
                  <select class="column-filter" data-topic-filter="status">
                    ${statuses
                      .map(
                        (status) =>
                          `<option value="${escapeHtml(status)}" ${status === topicFilters.status ? "selected" : ""}>${escapeHtml(status)}</option>`,
                      )
                      .join("")}
                  </select>
                </th>
                <th>
                  <span>Topic</span>
                  <input class="column-filter" data-topic-filter="title" type="search" placeholder="Filter topic" value="${escapeHtml(topicFilters.title)}" />
                </th>
                <th>
                  <span>Pillar</span>
                  <select class="column-filter" data-topic-filter="pillar">
                    ${pillars
                      .map(
                        (pillar) =>
                          `<option ${pillar === topicFilters.pillar ? "selected" : ""}>${escapeHtml(pillar)}</option>`,
                      )
                      .join("")}
                  </select>
                </th>
                <th>
                  <span>Source</span>
                  <select class="column-filter" data-topic-filter="source">
                    <option ${topicFilters.source === "All sources" ? "selected" : ""} value="All sources">All sources</option>
                    ${sources
                      .map(
                        (source) =>
                          `<option value="${escapeHtml(source.id)}" ${source.id === topicFilters.source ? "selected" : ""}>${escapeHtml(source.label)}</option>`,
                      )
                      .join("")}
                  </select>
                </th>
                <th>
                  <span>Commercial hypothesis</span>
                  <input class="column-filter" data-topic-filter="hypothesis" type="search" placeholder="Filter hypothesis" value="${escapeHtml(topicFilters.hypothesis)}" />
                </th>
              </tr>
            </thead>
            <tbody>
              ${
                filtered.length
                  ? filtered
                      .map((topic) => {
                        const source = getTopicSource(topic);
                        const status = topicStatus(topic);
                        return `
                          <tr>
                            <td>${topicActionButtons(topic, status)}</td>
                            <td>${topicStatusBadge(status)}</td>
                            <td><strong>${topic.title}</strong></td>
                            <td>${topic.pillar}</td>
                            <td>${escapeHtml(source.label)}</td>
                            <td>${topic.hypothesis}<br /><span class="pill">Priority ${topicPriority(topic)}</span></td>
                          </tr>
                        `;
                      })
                      .join("")
                  : '<tr><td colspan="6"><div class="empty-state">No real topics match the current filters.</div></td></tr>'
            }
          </tbody>
        </table>
        </div>
      </section>
      ${topicSourcesPanelView()}
    </section>
  `;
}

function topicActionButtons(topic, status) {
  if (status === "selected") {
    return `
      <div class="action-group">
        <button class="ghost-button compact-action" type="button" disabled>Added</button>
        <button class="ghost-button compact-action" type="button" data-cancel-topic="${escapeHtml(topic.id)}">Cancel</button>
      </div>
    `;
  }
  if (status === "cancelled") {
    return `
      <div class="action-group">
        <button class="primary-button compact-action" type="button" data-add-topic-to-posts="${escapeHtml(topic.id)}">Add</button>
        <button class="ghost-button compact-action" type="button" disabled>Cancelled</button>
      </div>
    `;
  }
  return `
    <div class="action-group">
      <button class="primary-button compact-action" type="button" data-add-topic-to-posts="${escapeHtml(topic.id)}">Add</button>
      <button class="ghost-button compact-action" type="button" data-cancel-topic="${escapeHtml(topic.id)}">Cancel</button>
    </div>
  `;
}

function topicStatusBadge(status) {
  const label = status || "funnel";
  return `<span class="pill topic-status ${escapeHtml(label)}">${escapeHtml(label)}</span>`;
}

function topicSourcesPanelView() {
  const sources = getTopicSources();
  return `
    <aside class="panel source-manager-panel">
      <div class="panel-header compact-header">
        <div>
          <h3>Sources</h3>
          <p>One source list powers the table and filters.</p>
        </div>
        <button class="ghost-button compact-action" type="button" data-add-source>Add</button>
      </div>
      <div class="source-manager-list">
        ${sources
          .map((source) => {
            const usage = sourceUsageCount(source.id);
            return `
              <article class="source-editor-card">
                <label>
                  <span>Name</span>
                  <input class="source-input" data-source-id="${escapeHtml(source.id)}" data-source-field="label" value="${escapeHtml(source.label)}" />
                </label>
                <label>
                  <span>Path</span>
                  <input class="source-input" data-source-id="${escapeHtml(source.id)}" data-source-field="path" value="${escapeHtml(source.path || "")}" />
                </label>
                <div class="source-card-footer">
                  <span class="pill">${usage} topics</span>
                  <button class="ghost-button compact-action danger-action" type="button" data-delete-source="${escapeHtml(source.id)}" ${usage ? "disabled" : ""}>Delete</button>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    </aside>
  `;
}

function postManagementView() {
  const posts = [...appData.posts, ...appData.publishedPosts].map((post) => ({
    ...post,
    status: normalizePostStatus(post.status),
  }));
  const postFilters = state.postFilters;
  const statuses = postStatusOptions;
  const pillars = ["All pillars", ...new Set(posts.map((post) => post.pillar).filter(Boolean))];
  const filtered = posts.filter((post) => {
    const actions = postActionFilterText(post);
    const matchesTitle =
      !postFilters.title ||
      `${post.title} ${post.owner}`.toLowerCase().includes(postFilters.title.toLowerCase());
    const matchesStatus =
      postFilters.status === "All statuses"
        ? post.status !== "Archived"
        : post.status === postFilters.status;
    const matchesPillar =
      postFilters.pillar === "All pillars" || post.pillar === postFilters.pillar;
    const matchesDate =
      !postFilters.date || String(post.date || "").toLowerCase().includes(postFilters.date.toLowerCase());
    const matchesSource =
      !postFilters.source ||
      String(post.sourcePath || "").toLowerCase().includes(postFilters.source.toLowerCase());
    const matchesNextStep =
      !postFilters.nextStep ||
      String(post.nextStep || "").toLowerCase().includes(postFilters.nextStep.toLowerCase());
    const matchesActions =
      !postFilters.actions || actions.toLowerCase().includes(postFilters.actions.toLowerCase());
    return (
      matchesTitle &&
      matchesStatus &&
      matchesPillar &&
      matchesDate &&
      matchesSource &&
      matchesNextStep &&
      matchesActions
    );
  });

  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>Post Drafts</h3>
          <p>Individual workflow: Brief -> Generate Draft -> Generate Image -> Ready.</p>
        </div>
        <span class="pill">${filtered.length} drafts</span>
      </div>
      ${state.actionMessage ? `<p class="action-message">${escapeHtml(state.actionMessage)}</p>` : ""}
      <div class="table-shell">
        <table class="posts-table">
          <thead>
            <tr>
              <th>
                <span>Post</span>
                <input class="column-filter" data-post-filter="title" type="search" placeholder="Filter post" value="${escapeHtml(postFilters.title)}" />
              </th>
              <th>
                <span>Status</span>
                <select class="column-filter" data-post-filter="status">
                  ${statuses
                    .map(
                      (status) =>
                        `<option value="${escapeHtml(status)}" ${status === postFilters.status ? "selected" : ""}>${escapeHtml(status)}</option>`,
                    )
                    .join("")}
                </select>
              </th>
              <th>
                <span>Pillar</span>
                <select class="column-filter" data-post-filter="pillar">
                  ${pillars
                    .map(
                      (pillar) =>
                        `<option value="${escapeHtml(pillar)}" ${pillar === postFilters.pillar ? "selected" : ""}>${escapeHtml(pillar)}</option>`,
                    )
                    .join("")}
                </select>
              </th>
              <th>
                <span>Date</span>
                <input class="column-filter" data-post-filter="date" type="search" placeholder="Filter date" value="${escapeHtml(postFilters.date)}" />
              </th>
              <th>
                <span>Source</span>
                <input class="column-filter" data-post-filter="source" type="search" placeholder="Filter source" value="${escapeHtml(postFilters.source)}" />
              </th>
              <th>
                <span>Next Step</span>
                <input class="column-filter" data-post-filter="nextStep" type="search" placeholder="Filter next step" value="${escapeHtml(postFilters.nextStep)}" />
              </th>
              <th>
                <span>Post Actions</span>
                <input class="column-filter" data-post-filter="actions" type="search" placeholder="Filter actions" value="${escapeHtml(postFilters.actions)}" />
              </th>
            </tr>
          </thead>
          <tbody>
            ${
              filtered.length
                ? filtered
                    .map(
                      (post) => `
                        <tr>
                          <td>
                            <a class="post-title-link" href="#xhs/post/${escapeHtml(post.id)}" data-workspace="xhs" data-route="post" data-post-id="${escapeHtml(post.id)}">${escapeHtml(post.title)}</a>
                            <br /><span class="pill">${escapeHtml(post.owner)}</span>
                          </td>
                          <td>${escapeHtml(post.status)}</td>
                          <td>${escapeHtml(post.pillar)}</td>
                          <td>${escapeHtml(post.date)}</td>
                          <td>${escapeHtml(post.sourcePath)}</td>
                          <td>${escapeHtml(post.nextStep)}</td>
                          <td>${pipelineActionButtons(post)}</td>
                        </tr>
                      `,
                    )
                    .join("")
                : '<tr><td colspan="7"><div class="empty-state">No real post drafts match the current filters.</div></td></tr>'
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function postActionFilterText(post) {
  const assets = post.assets || {};
  const workflow = post.workflowState || {};
  const draftGenerated =
    normalizePostStatus(post.status) === "Drafted" ||
    Boolean(workflow.draftGenerated || assets.publishCopy || assets.copyReview);
  const labels = [
    "Brief",
    workflow.draftAccepted ? "Draft Accepted" : draftGenerated ? "Review Draft" : "Generate Draft",
  ];
  if (workflow.draftAccepted) labels.push("Generate Image");
  if (workflow.promptsAccepted) labels.push("Generate Image");
  if (workflow.imagesAccepted || normalizePostStatus(post.status) === "Ready") labels.push("Ready");
  return labels.join(" ");
}

function reusableProductionToolsView() {
  return `
    <section class="panel reusable-tools-panel">
      <div class="panel-header">
        <div>
          <h3>Reusable Templates</h3>
          <p>Template workflow: define reusable Brief, Carousel Script, Visual Style Options, and Image Prompts once; individual posts apply them.</p>
        </div>
      </div>
      <div class="reusable-tool-grid">
        ${productionModules
          .map(
            (module) => `
              <button class="tool-card-button" type="button" data-reusable-tool="${module.key}">
                <strong>${module.label}</strong>
                <span>${module.purpose}</span>
              </button>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function pipelineActionButtons(post) {
  const assets = post.assets || {};
  const workflow = post.workflowState || {};
  const draftGenerated =
    normalizePostStatus(post.status) === "Drafted" ||
    Boolean(workflow.draftGenerated || assets.publishCopy || assets.copyReview);
  const draftButtonLabel = workflow.draftAccepted
    ? "Draft Accepted"
    : draftGenerated
      ? "Review Draft"
      : "Generate Draft";
  return `
    <div class="pipeline-actions">
      <button class="ghost-button compact-action" data-post-asset="${post.id}" data-asset-key="brief" type="button">
        Brief
      </button>
      <button class="ghost-button compact-action ${workflow.draftAccepted ? "accepted-action" : ""}" data-post-action="${post.id}" data-action-key="generateDraft" type="button">
        ${draftButtonLabel}
      </button>
      ${
        workflow.draftAccepted
          ? `<button class="ghost-button compact-action ${normalizePostStatus(post.status) === "Ready" ? "accepted-action" : ""}" data-post-action="${post.id}" data-action-key="visualDirection" type="button">
              Generate Image
            </button>`
          : ""
      }
      ${
        normalizePostStatus(post.status) === "Ready"
          ? `<button class="ghost-button compact-action accepted-action" data-post-action="${post.id}" data-action-key="publishPackage" type="button">
              Ready
            </button>`
          : ""
      }
      <button class="ghost-button compact-action danger-action" data-post-cancel="${post.id}" type="button">
        Cancel
      </button>
    </div>
  `;
}

function reusableToolContent(toolKey) {
  const tool = productionModules.find((module) => module.key === toolKey);
  if (!tool) return "";

  const examples = {
    brief: [
      "Recommended topic: why this topic fits the account strategy.",
      "Audience pain: what anxiety or job-to-be-done it addresses.",
      "Commercial hypothesis: what future coaching demand it can reveal.",
      "CTA and comment signal: what kind of reply we want to attract.",
    ],
    carouselScript: [
      "Cover hook.",
      "Page-by-page swipe logic.",
      "Caption direction.",
      "Comment prompt and pinned comment idea.",
    ],
    visualStyleOptions: [
      "Three possible visual systems.",
      "Best use case for each style.",
      "Recommended option.",
      "Why the style supports click, save, or trust.",
    ],
    imagePrompts: [
      "Global style lock.",
      "Page-level image prompt.",
      "Negative prompt.",
      "Pick-if criteria and generation order.",
    ],
  };

  return `# ${tool.label}

## What It Does

${tool.purpose}

## When To Use

${tool.useWhen}

## Typical Output

${examples[tool.key].map((item) => `- ${item}`).join("\n")}

## Operating Rule

This is a reusable module, not a mandatory step for every post. Choose it based on the selected content format.`;
}

function buildWhyRecommended(post) {
  const topic = appData.topics.find((item) => item.title === post.title || item.id === post.topicId);
  return `# Why This Post

## Recommended Because

- It sits inside the pillar: **${post.pillar}**.
- It directly tests the AI portfolio / project coaching wedge.
- It speaks to a concrete anxiety: "I want to transition to AI PM, but I do not know what project will survive interview follow-up."
- It can attract high-quality comments from readers sharing their background, target role, or project idea.

## What Signal To Watch

- Saves: readers treat the checklist as reusable.
- Comments: readers mention background, target role, project idea, or portfolio confusion.
- Lead signal: readers ask for project review, AI PM portfolio help, mock interview, or private diagnosis.`;
}

function buildGeneratedBrief(post) {
  const topic = appData.topics.find((item) => item.title === post.title || item.id === post.topicId);
  return `${buildWhyRecommended(post)}

---

# Brief

## Topic

${post.title}

## What It Does

Turn this selected topic into a concrete post direction before drafting copy.

## Audience

Chinese-speaking professionals targeting AI PM roles, especially non-technical or adjacent-background candidates who need credible project proof.

## Core Pain

They want to transition into AI PM, but they are not sure what project would look credible, relevant, and strong enough to survive interview follow-up.

## Commercial Hypothesis

${topic?.hypothesis || "This topic should test whether readers need portfolio, project, or AI PM transition coaching."}

## Suggested Output

- A clear XHS post angle.
- A save-worthy checklist or diagnostic framework.
- A comment prompt that invites background, target role, and project idea.
- A next step into Generate Draft after this brief is accepted mentally.

## Operating Rule

This brief is generated from the topic record because no dedicated brief file exists yet. Once a real brief file is added, the popup will show the real file automatically.`;
}

function buildPostActionContent(post, actionKey) {
  if (actionKey === "whyRecommended") return buildWhyRecommended(post);

  if (actionKey === "publishPackage") {
    return buildPublishPackageContent(post);
  }

  if (actionKey === "generateCopy") {
    return `# Draft

The copy source for this post is the Draft file.

Open Draft to review:

- XHS title options
- XHS caption draft
- comment prompt
- source brief`;
  }

  if (actionKey === "reviewCopy") {
    return `# Review

The review source for this post is the Review file.

Use it to decide whether the draft is ready to publish:

- overall verdict
- strategy fit
- strengths
- risks
- revision suggestions`;
  }

  if (actionKey === "visualDirection") {
    return buildGenerateImageWorkflowContent(post);
  }

  if (actionKey === "imagePrompts") {
    return buildGenerateImageWorkflowContent(post);
  }

  if (actionKey === "images") {
    return buildGenerateImageWorkflowContent(post);
  }

  if (actionKey === "publish") {
    return `# Publish

This post is not marked published yet.

Before publishing, check:

- final carousel images are exported
- Chinese overlay text is readable on mobile
- caption and pinned comment are ready
- no hard-sell CTA appears in public copy
- the post has a performance row ready for follow-up tracking`;
  }

  return "";
}

function imageWorkflowState(post) {
  return post.workflowState?.imageWorkflow || {};
}

function buildGenerateImageWorkflowContent(post) {
  const workflow = imageWorkflowState(post);
  const goals = workflow.goals?.length ? workflow.goals.join(", ") : "Not selected yet";
  const style = workflow.styleOption || "Option B";
  const imageRequired = workflow.imageRequired === false ? "No" : "Yes";
  const images = workflow.generatedImages?.length
    ? workflow.generatedImages.map((item) => `- ${item}`).join("\n")
    : "- No generated images yet.";

  return `# Generate Image

## 1. Image Required?

${imageRequired}

## 2. Post Style Options

Selected style: ${style}

## 3. Goal

${goals}

## 4. Carousel Script

${workflow.carouselScriptPreview || (workflow.carouselScriptGenerated ? "Carousel script has been generated. Review it and accept before generating image prompts." : "Choose image settings and goals, then generate carousel script.")}

## 5. Image Prompts

${workflow.imagePromptsPreview || (workflow.imagePromptsGenerated ? "Image prompts have been generated. Review them and accept before generating images." : "Image prompts will be generated after carousel script is accepted.")}

## 6. Image Review

${workflow.imageReviewPreview || (workflow.imagesGenerated ? images : "Images will appear here after image generation.")}

## 7. Ready Package

${workflow.readyPackagePreview || (normalizePostStatus(post.status) === "Ready" ? "Ready package has been accepted and saved." : "After image review is accepted, this post moves to Ready.")}`;
}

function buildDraftReviewContent(post, draftContent, reviewContent, comment = "") {
  const revisionNote = comment
    ? `\n\n## Latest Refresh Comment\n\n${comment}\n\n> Local UI note: this comment is captured here for the next draft refresh. Connect the backend generator to rewrite the draft from this instruction.\n`
    : "";
  return `${revisionNote ? `${revisionNote}\n\n` : ""}${draftContent || "# Draft\n\nNo publish copy source found."}\n\n---\n\n${reviewContent || "# Review\n\nNo copy review source found."}`;
}

function buildPublishPackageContent(post) {
  const workflow = post.workflowState || {};
  const imageFolderLink = `/content_pipeline/generated_images/${post.id}/index.html`;
  const imageList = workflow.generatedImages?.length
    ? workflow.generatedImages.map((item) => `- ${item}`).join("\n")
    : "- Images accepted in this local workflow. Attach final exported carousel images here.";

  return `# Ready Package\n\n## Title\n\n${post.title}\n\n## Text Body\n\nUse the accepted draft from Generate Draft. Re-open Generate Draft if you need to review the full caption and comment prompt.\n\n## Images Folder\n\n[Open images folder](${imageFolderLink})\n\n## Images\n\n${imageList}\n\n## Ready Check\n\n- Draft accepted: ${workflow.draftAccepted ? "yes" : "no"}\n- Generate Image workflow complete: ${normalizePostStatus(post.status) === "Ready" ? "yes" : "no"}`;
}

function modalView() {
  if (!state.modal) return "";
  if (state.modal.assetKey === "createDraft") return createDraftModalView();
  const { title, assetKey, content, loading, error } = state.modal;
  return `
    <div class="modal-backdrop" role="presentation" data-close-modal="true">
      <section class="modal-panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(assetLabel(assetKey))}">
        <div class="modal-header">
          <div>
            <p class="eyebrow">${escapeHtml(assetLabel(assetKey))}</p>
            <h3>${escapeHtml(title)}</h3>
          </div>
          <button class="icon-button" type="button" data-close-modal="true" aria-label="Close">×</button>
        </div>
        <div class="modal-body">
          ${
            loading
              ? '<div class="empty-state">Loading pipeline content...</div>'
              : error
                ? `<div class="empty-state">${escapeHtml(error)}</div>`
                : `<article class="artifact-preview">${renderMarkdown(content)}</article>`
          }
          ${modalWorkflowControls()}
        </div>
      </section>
    </div>
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

function createDraftModalView() {
  const { title, topicId, origin, error } = state.modal;
  const topic = findUnifiedTopic(topicId, origin);
  const targets = topic ? availableDraftTargets(topic) : [];
  const firstAvailable = targets.find((target) => !target.disabled)?.value || "XHS";
  return `
    <div class="modal-backdrop" role="presentation" data-close-modal="true">
      <section class="modal-panel" role="dialog" aria-modal="true" aria-label="Create Draft">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Create Draft</p>
            <h3>${escapeHtml(title || topic?.title || "Select draft target")}</h3>
          </div>
          <button class="icon-button" type="button" data-close-modal="true" aria-label="Close">×</button>
        </div>
        <div class="modal-body">
          ${error ? `<div class="empty-state">${escapeHtml(error)}</div>` : ""}
          <article class="artifact-preview">
            <h2>Choose Destination</h2>
            <p>${escapeHtml(topic?.title || "")}</p>
            <label class="stacked-control">
              <span>Draft destination</span>
              <select class="column-filter" id="create-draft-target">
                ${targets
                  .map(
                    (target) =>
                      `<option value="${target.value}" ${target.disabled ? "disabled" : ""} ${target.value === firstAvailable ? "selected" : ""}>${escapeHtml(target.label)}</option>`,
                  )
                  .join("")}
              </select>
            </label>
            <p class="small-note">This will add a platform-specific draft to the Drafts list. You can return later and create the other platform draft from the same topic.</p>
          </article>
          <section class="modal-workflow-controls">
            <div class="modal-action-row">
              <button class="ghost-button" type="button" data-close-modal="true">Cancel</button>
              <button class="primary-button" type="button" data-confirm-create-draft="${escapeHtml(topicId)}" data-topic-origin="${escapeHtml(origin)}">Create Draft</button>
            </div>
          </section>
        </div>
      </section>
    </div>
  `;
}

function modalWorkflowControls() {
  if (!state.modal) return "";
  const { assetKey, postId } = state.modal;
  if (!postId) return "";

  if (assetKey === "generateDraft") {
    return `
      <section class="modal-workflow-controls">
        <label class="stacked-control">
          <span>Comment for draft revision</span>
          <textarea class="comment-box" id="draft-refresh-comment" placeholder="Tell me what to change in the draft...">${escapeHtml(state.modal.comment || "")}</textarea>
        </label>
        <div class="modal-action-row">
          <button class="ghost-button" type="button" data-refresh-draft="${escapeHtml(postId)}">Refresh Draft</button>
          <button class="primary-button" type="button" data-accept-draft="${escapeHtml(postId)}">Accept Draft</button>
          <span>Accepting the draft unlocks Generate Image.</span>
        </div>
        ${state.actionMessage ? `<p class="action-message">${escapeHtml(state.actionMessage)}</p>` : ""}
      </section>
    `;
  }

  if (assetKey === "generateImageWorkflow") {
    return generateImageWorkflowControls(postId);
  }

  return "";
}

function generateImageWorkflowControls(postId) {
  const post = getPostById(postId);
  const workflow = imageWorkflowState(post || {});
  const imageRequired = workflow.imageRequired !== false;
  const style = workflow.styleOption || "Option B";
  const goals = new Set(workflow.goals || []);
  const goalOptions = [
    ["like", "点赞"],
    ["save", "收藏"],
    ["trust", "Trust"],
    ["comment", "评论"],
  ];
  const styleOptions = [
    ["Option A", "Dark Case Room", "Click and authority; strong cover tension."],
    ["Option B", "Clean Notion Workbook", "Save-friendly checklist and practical trust."],
    ["Option C", "North America PM Desk", "Personal brand credibility and coaching feel."],
  ];

  return `
    <section class="modal-workflow-controls">
      <div class="workflow-builder">
        <label class="toggle-row">
          <span>Image Required?</span>
          <input type="checkbox" id="image-required-toggle" ${imageRequired ? "checked" : ""} />
        </label>
        <div class="style-option-group ${imageRequired ? "" : "is-hidden"}" id="post-style-options">
          ${styleOptions
            .map(
              ([value, label, note]) => `
                <label class="choice-card">
                  <input type="radio" name="post-style-option" value="${value}" ${style === value ? "checked" : ""} />
                  <strong>${label}</strong>
                  <span>${note}</span>
                </label>
              `,
            )
            .join("")}
        </div>
        <div class="goal-grid">
          ${goalOptions
            .map(
              ([value, label]) => `
                <label class="check-chip">
                  <input type="checkbox" name="image-goal" value="${value}" ${goals.has(value) ? "checked" : ""} />
                  <span>${label}</span>
                </label>
              `,
            )
            .join("")}
        </div>
        <label class="stacked-control">
          <span>Comment / adjustment</span>
          <textarea class="comment-box" id="image-workflow-comment" placeholder="Tell me what to adjust before the next generation step...">${escapeHtml(state.modal.comment || workflow.latestComment || "")}</textarea>
        </label>
      </div>
      <div class="modal-action-row">
        ${
          !workflow.carouselScriptAccepted
            ? `<button class="primary-button" type="button" data-generate-carousel-script="${escapeHtml(postId)}">Generate Carousel Script</button>`
            : ""
        }
        ${
          workflow.carouselScriptGenerated && !workflow.carouselScriptAccepted
            ? `<button class="primary-button" type="button" data-accept-carousel-script="${escapeHtml(postId)}">Accept Carousel Script & Generate Image Prompts</button>`
            : ""
        }
        ${
          workflow.imagePromptsGenerated && !workflow.imagePromptsAccepted
            ? `<button class="primary-button" type="button" data-accept-image-prompts="${escapeHtml(postId)}">Accept Image Prompts & Generate Images</button>`
            : ""
        }
        ${
          workflow.imagesGenerated && !workflow.imagesAccepted
            ? `<button class="primary-button" type="button" data-accept-image-package="${escapeHtml(postId)}">Accept Images & Mark Ready</button>`
            : ""
        }
        <span>Each accepted step is saved back to this post record.</span>
      </div>
      ${state.actionMessage ? `<p class="action-message">${escapeHtml(state.actionMessage)}</p>` : ""}
    </section>
  `;
}

function linkedinPipelineView() {
  const steps = [
    {
      label: "Ideation",
      title: "Find a business workflow problem",
      note: "Use owner conversations, repeated admin work, delivery bottlenecks, or productized service ideas.",
    },
    {
      label: "Brief",
      title: "Define the AI Ops angle",
      note: "Clarify customer, business pain, current workflow, AI leverage, and commercial hypothesis.",
    },
    {
      label: "Draft",
      title: "Write the LinkedIn post",
      note: "Create a sharp hook, practical body, implementation example, and low-pressure comment prompt.",
    },
    {
      label: "Review",
      title: "Check business credibility",
      note: "Review for clarity, jargon, proof, founder relevance, and whether the post attracts qualified leads.",
    },
    {
      label: "Publish",
      title: "Package for LinkedIn",
      note: "Finalize post, comments to watch, follow-up angle, and next offer signal. No image generation required.",
    },
  ];
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>LinkedIn Ops Workflow</h3>
          <p>Modeled after XHS Ops, simplified for English LinkedIn posts without image generation.</p>
        </div>
      </div>
      <div class="home-pipeline linkedin-pipeline">
        ${steps
          .map(
            (step, index) => `
              <article class="pipeline-step-card">
                <span class="step-index">${index + 1}</span>
                <p class="eyebrow">${step.label}</p>
                <strong>${step.title}</strong>
                <small>${step.note}</small>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function linkedinLandingView() {
  return `
    <section class="metrics-grid home-metrics">
      ${metricCard("Topic backlog", linkedinData.topics.length.toLocaleString(), "English LinkedIn topics for AI Ops and AI product demand testing.")}
      ${metricCard("WIP posts", linkedinData.posts.length.toLocaleString(), "Draft candidates currently in the LinkedIn post pipeline.")}
      ${metricCard("Image steps", "0", "LinkedIn Ops is text-first and does not use image generation.")}
    </section>

    ${linkedinPipelineView()}

    <section class="two-column">
      <article class="panel">
        <div class="panel-header">
          <div>
            <h3>Target Customer</h3>
            <p>${escapeHtml(linkedinData.strategy.audience)}</p>
          </div>
        </div>
        <div class="strategy-list-block">
          <strong>Positioning</strong>
          <p>${escapeHtml(linkedinData.strategy.positioning)}</p>
        </div>
      </article>
      <article class="panel">
        <div class="panel-header">
          <div>
            <h3>Signals To Watch</h3>
            <p>Use comments and DMs to identify high-intent business owners.</p>
          </div>
        </div>
        <div class="indicator-list">
          ${[
            "Mentions a manual workflow or repeated admin task",
            "Asks what AI tool they should build first",
            "Describes vendor confusion or implementation risk",
            "Requests an audit, roadmap, or prototype review",
          ]
            .map(
              (item) => `
                <div class="indicator-row">
                  <div>
                    <strong>${escapeHtml(item)}</strong>
                    <p>Potential commercial signal for AI Ops advisory or product build support.</p>
                  </div>
                  <span class="pill good">Watch</span>
                </div>
              `,
            )
            .join("")}
        </div>
      </article>
    </section>
  `;
}

function linkedinStrategyView() {
  return `
    <section class="strategy-grid">
      ${strategyComponentCard(
        "Audience",
        "LinkedIn Ops",
        `<p>${escapeHtml(linkedinData.strategy.audience)}</p>`,
        "business owners",
      )}
      ${strategyComponentCard(
        "Positioning",
        "LinkedIn Ops",
        `<p>${escapeHtml(linkedinData.strategy.positioning)}</p>`,
        "AI Ops",
      )}
      ${strategyComponentCard(
        "Offer Hypotheses",
        "LinkedIn Ops",
        `<div class="card-meta">${linkedinData.strategy.offerHypotheses
          .map((item) => `<span class="pill">${escapeHtml(item)}</span>`)
          .join("")}</div>`,
        `${linkedinData.strategy.offerHypotheses.length} offers`,
      )}
      ${strategyComponentCard(
        "Voice",
        "LinkedIn Ops",
        `<div class="card-meta">${linkedinData.strategy.voice
          .map((item) => `<span class="pill">${escapeHtml(item)}</span>`)
          .join("")}</div>`,
        "English only",
      )}
    </section>
  `;
}

function linkedinTopicsView() {
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>LinkedIn Topic List</h3>
          <p>English topic backlog for non-technical business owners building AI Ops and AI products.</p>
        </div>
        <span class="pill">${linkedinData.topics.length} topics</span>
      </div>
      <div class="table-shell">
        <table class="topics-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Topic</th>
              <th>Pillar</th>
              <th>Audience</th>
              <th>Commercial Hypothesis</th>
              <th>Format</th>
            </tr>
          </thead>
          <tbody>
            ${linkedinData.topics
              .map(
                (topic) => `
                  <tr>
                    <td><span class="status-badge">${escapeHtml(topic.status)}</span></td>
                    <td><strong>${escapeHtml(topic.title)}</strong></td>
                    <td>${escapeHtml(topic.pillar)}</td>
                    <td>${escapeHtml(topic.audience)}</td>
                    <td>${escapeHtml(topic.hypothesis)}</td>
                    <td>${escapeHtml(topic.format)}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function linkedinPostsView() {
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>LinkedIn Post Pipeline</h3>
          <p>Text-first workflow: Topic -> Brief -> Draft -> Review -> Publish. No visual direction, image prompts, or images.</p>
        </div>
        <span class="pill">${linkedinData.posts.length} posts</span>
      </div>
      <div class="table-shell">
        <table class="topics-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Post</th>
              <th>Pillar</th>
              <th>Brief</th>
              <th>Next Step</th>
            </tr>
          </thead>
          <tbody>
            ${linkedinData.posts
              .map(
                (post) => `
                  <tr>
                    <td><span class="status-badge">${escapeHtml(post.status)}</span></td>
                    <td>
                      <a class="post-title-link" href="#linkedin/post/${escapeHtml(post.id)}" data-workspace="linkedin" data-route="post" data-post-id="${escapeHtml(post.id)}">${escapeHtml(post.title)}</a>
                    </td>
                    <td>${escapeHtml(post.pillar)}</td>
                    <td>${escapeHtml(post.brief)}</td>
                    <td><button class="ghost-button compact-action" type="button" disabled>${escapeHtml(post.nextStep)}</button></td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function unifiedDraftsView() {
  const filters = state.unifiedFilters.drafts;
  const xhsDrafts = appData.posts
    .filter((post) => normalizePostStatus(post.status) !== "Archived")
    .map((post) => ({
      id: post.id,
      platform: "XHS",
      title: post.title,
      status: normalizePostStatus(post.status),
      pillar: post.pillar || "",
      nextStep: post.nextStep || "",
    }));
  const linkedInDrafts = linkedinData.posts.map((post) => ({
    id: post.id,
    platform: "LinkedIn",
    title: post.title,
    status: post.status,
    pillar: post.pillar || "",
    nextStep: post.nextStep || "",
  }));
  const drafts = [...xhsDrafts, ...linkedInDrafts];
  const filteredDrafts = drafts.filter((draft) => (
    matchesFilter(draft.title, filters.draft) &&
    matchesSelect(draft.platform, filters.platform, "All platforms") &&
    matchesFilter(draft.status, filters.status) &&
    matchesFilter(draft.pillar, filters.pillar) &&
    matchesFilter(draft.nextStep, filters.nextStep)
  ));
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>Drafts</h3>
          <p>Platform-specific drafts created from unified topics.</p>
        </div>
        <span class="pill">${filteredDrafts.length} / ${drafts.length} drafts</span>
      </div>
      <div class="table-shell">
        <table class="posts-table">
          <thead>
            <tr>
              <th>Draft</th>
              <th>Platform</th>
              <th>Status</th>
              <th>Pillar</th>
              <th>Next Step</th>
            </tr>
            <tr>
              <th><input class="column-filter" data-unified-filter-table="drafts" data-unified-filter="draft" type="search" placeholder="Filter draft" value="${escapeHtml(filters.draft)}" /></th>
              <th>
                <select class="column-filter" data-unified-filter-table="drafts" data-unified-filter="platform">
                  ${selectOptions(["All platforms", "XHS", "LinkedIn"], filters.platform)}
                </select>
              </th>
              <th><input class="column-filter" data-unified-filter-table="drafts" data-unified-filter="status" type="search" placeholder="Filter status" value="${escapeHtml(filters.status)}" /></th>
              <th><input class="column-filter" data-unified-filter-table="drafts" data-unified-filter="pillar" type="search" placeholder="Filter pillar" value="${escapeHtml(filters.pillar)}" /></th>
              <th><input class="column-filter" data-unified-filter-table="drafts" data-unified-filter="nextStep" type="search" placeholder="Filter next step" value="${escapeHtml(filters.nextStep)}" /></th>
            </tr>
          </thead>
          <tbody>
            ${filteredDrafts
              .map(
                (draft) => `
                  <tr>
                    <td><strong>${escapeHtml(draft.title)}</strong></td>
                    <td><span class="pill">${escapeHtml(draft.platform)}</span></td>
                    <td>${escapeHtml(draft.status)}</td>
                    <td>${escapeHtml(draft.pillar)}</td>
                    <td>${escapeHtml(draft.nextStep)}</td>
                  </tr>
                `,
              )
              .join("") || '<tr><td colspan="5"><div class="empty-state">No drafts match these filters.</div></td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function unifiedPublishPostsView() {
  const filters = state.unifiedFilters.posts;
  const xhsPosts = appData.posts
    .filter((post) => normalizePostStatus(post.status) !== "Archived")
    .map((post) => ({
      ...post,
      platform: "XHS",
      status: normalizePostStatus(post.status),
      articleReady: Boolean(post.assets?.publishCopy),
      imageCount: getXhsPostImages(post).length,
      href: `#xhs/post/${post.id}`,
      routeWorkspace: "xhs",
    }));
  const linkedInPosts = linkedinData.posts.map((post) => ({
    ...post,
    platform: "LinkedIn",
    articleReady: Boolean(post.article),
    imageCount: 0,
    href: `#linkedin/post/${post.id}`,
    routeWorkspace: "linkedin",
  }));
  const posts = [...xhsPosts, ...linkedInPosts].map((post) => {
    const articleState = post.articleReady ? "Available" : "Not ready";
    const imageState =
      post.platform !== "XHS" ? "N/A" : post.imageCount > 0 ? "Has images" : "No images yet";
    return { ...post, articleState, imageState };
  });
  const filteredPosts = posts.filter((post) => (
    matchesFilter(post.title, filters.post) &&
    matchesSelect(post.platform, filters.platform, "All platforms") &&
    matchesFilter(post.status, filters.status) &&
    matchesFilter(post.pillar, filters.pillar) &&
    matchesSelect(post.articleState, filters.article, "All article states") &&
    matchesSelect(post.imageState, filters.images, "All image states")
  ));
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>Posts</h3>
          <p>Ready-to-publish or planned artifacts across platforms. Detail pages render by platform.</p>
        </div>
        <span class="pill">${filteredPosts.length} / ${posts.length} posts</span>
      </div>
      <div class="table-shell">
        <table class="posts-table">
          <thead>
            <tr>
              <th>Post</th>
              <th>Platform</th>
              <th>Status</th>
              <th>Pillar</th>
              <th>Article</th>
              <th>Images</th>
            </tr>
            <tr>
              <th><input class="column-filter" data-unified-filter-table="posts" data-unified-filter="post" type="search" placeholder="Filter post" value="${escapeHtml(filters.post)}" /></th>
              <th>
                <select class="column-filter" data-unified-filter-table="posts" data-unified-filter="platform">
                  ${selectOptions(["All platforms", "XHS", "LinkedIn"], filters.platform)}
                </select>
              </th>
              <th><input class="column-filter" data-unified-filter-table="posts" data-unified-filter="status" type="search" placeholder="Filter status" value="${escapeHtml(filters.status)}" /></th>
              <th><input class="column-filter" data-unified-filter-table="posts" data-unified-filter="pillar" type="search" placeholder="Filter pillar" value="${escapeHtml(filters.pillar)}" /></th>
              <th>
                <select class="column-filter" data-unified-filter-table="posts" data-unified-filter="article">
                  ${selectOptions(["All article states", "Available", "Not ready"], filters.article)}
                </select>
              </th>
              <th>
                <select class="column-filter" data-unified-filter-table="posts" data-unified-filter="images">
                  ${selectOptions(["All image states", "Has images", "No images yet", "N/A"], filters.images)}
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            ${filteredPosts
              .map(
                (post) => `
                  <tr>
                    <td><a class="post-title-link" href="${escapeHtml(post.href)}" data-workspace="${escapeHtml(post.routeWorkspace)}" data-route="post" data-post-id="${escapeHtml(post.id)}">${escapeHtml(post.title)}</a></td>
                    <td><span class="pill">${escapeHtml(post.platform)}</span></td>
                    <td>${escapeHtml(post.status || "")}</td>
                    <td>${escapeHtml(post.pillar || "")}</td>
                    <td>${post.articleState}</td>
                    <td>${post.imageState}</td>
                  </tr>
                `,
              )
              .join("") || '<tr><td colspan="6"><div class="empty-state">No posts match these filters.</div></td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function xhsPublishPostsView() {
  const posts = [...appData.posts, ...appData.publishedPosts]
    .map((post) => ({ ...post, status: normalizePostStatus(post.status) }))
    .filter((post) => post.status !== "Archived");
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>XHS Post</h3>
          <p>Ready-to-publish or planned XHS artifacts. Open a post to review title, article, and images.</p>
        </div>
        <span class="pill">${posts.length} posts</span>
      </div>
      <div class="table-shell">
        <table class="posts-table">
          <thead>
            <tr>
              <th>Post</th>
              <th>Status</th>
              <th>Pillar</th>
              <th>Article</th>
              <th>Images</th>
            </tr>
          </thead>
          <tbody>
            ${posts
              .map((post) => {
                const images = getXhsPostImages(post);
                return `
                  <tr>
                    <td><a class="post-title-link" href="#xhs/post/${escapeHtml(post.id)}" data-workspace="xhs" data-route="post" data-post-id="${escapeHtml(post.id)}">${escapeHtml(post.title)}</a></td>
                    <td><span class="status-badge">${escapeHtml(post.status)}</span></td>
                    <td>${escapeHtml(post.pillar || "")}</td>
                    <td>${post.assets?.publishCopy ? "Available" : "Not ready"}</td>
                    <td>${images.length ? `${images.length} images` : "No images yet"}</td>
                  </tr>
                `;
              })
              .join("") || '<tr><td colspan="5"><div class="empty-state">No XHS posts yet.</div></td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function linkedinPublishPostsView() {
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h3>LinkedIn Post</h3>
          <p>Ready-to-publish or planned LinkedIn text artifacts. Open a post to review title and article.</p>
        </div>
        <span class="pill">${linkedinData.posts.length} posts</span>
      </div>
      <div class="table-shell">
        <table class="posts-table">
          <thead>
            <tr>
              <th>Post</th>
              <th>Status</th>
              <th>Pillar</th>
              <th>Article</th>
            </tr>
          </thead>
          <tbody>
            ${linkedinData.posts
              .map(
                (post) => `
                  <tr>
                    <td><a class="post-title-link" href="#linkedin/post/${escapeHtml(post.id)}" data-workspace="linkedin" data-route="post" data-post-id="${escapeHtml(post.id)}">${escapeHtml(post.title)}</a></td>
                    <td><span class="status-badge">${escapeHtml(post.status)}</span></td>
                    <td>${escapeHtml(post.pillar)}</td>
                    <td>${post.article ? "Available" : "Not ready"}</td>
                  </tr>
                `,
              )
              .join("") || '<tr><td colspan="4"><div class="empty-state">No LinkedIn posts yet.</div></td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function xhsPostDetailView() {
  const post = getPostById(state.postPageId);
  if (!post) {
    return `<section class="panel"><div class="empty-state">Post not found.</div></section>`;
  }
  const key = postPageContentKey("xhs", post.id);
  const content = state.postPageContent[key] || {};
  const isLoading = state.postPageLoading[key];
  if (!content.article && !isLoading) {
    loadXhsPostPageContent(post);
  }
  const images = getXhsPostImages(post);
  return `
    <article class="panel post-detail-page">
      <div class="panel-header">
        <div>
          <p class="eyebrow">XHS ready-to-publish artifact</p>
          <h3>${escapeHtml(post.title)}</h3>
        </div>
        <a class="ghost-button compact-action" href="#xhs/posts" data-workspace="xhs" data-route="posts">Back to Post</a>
      </div>

      <section class="post-detail-section">
        <h4>Title</h4>
        <p class="post-detail-title">${escapeHtml(post.title)}</p>
      </section>

      <section class="post-detail-section">
        <h4>Article</h4>
        ${
          isLoading
            ? '<div class="empty-state">Loading article...</div>'
            : content.article
              ? `<div class="markdown-preview">${renderMarkdown(content.article)}</div>`
              : '<div class="empty-state">No publish copy found for this post yet.</div>'
        }
      </section>

      <section class="post-detail-section">
        <h4>Images</h4>
        ${
          images.length
            ? `<div class="post-image-grid">${images
                .map(
                  (imagePath, index) => `
                    <a href="${escapeHtml(resolvePreviewAssetPath(imagePath))}" target="_blank" rel="noreferrer">
                      <img src="${escapeHtml(resolvePreviewAssetPath(imagePath))}" alt="XHS page ${index + 1}" />
                    </a>
                  `,
                )
                .join("")}</div>`
            : '<div class="empty-state">No images generated for this post yet.</div>'
        }
      </section>
    </article>
  `;
}

function linkedinPostDetailView() {
  const post = linkedinData.posts.find((item) => item.id === state.postPageId);
  if (!post) {
    return `<section class="panel"><div class="empty-state">Post not found.</div></section>`;
  }
  return `
    <article class="panel post-detail-page">
      <div class="panel-header">
        <div>
          <p class="eyebrow">LinkedIn ready-to-publish artifact</p>
          <h3>${escapeHtml(post.title)}</h3>
        </div>
        <a class="ghost-button compact-action" href="#linkedin/posts" data-workspace="linkedin" data-route="posts">Back to Post</a>
      </div>

      <section class="post-detail-section">
        <h4>Title</h4>
        <p class="post-detail-title">${escapeHtml(post.title)}</p>
      </section>

      <section class="post-detail-section">
        <h4>Article</h4>
        <div class="linkedin-post-body">${renderMarkdown(post.article || "")}</div>
      </section>
    </article>
  `;
}

function opsHomeView() {
  return `
    ${nljrTodayView()}
  `;
}

function render() {
  const view = document.querySelector("#app-view");
  if (state.loading) {
    view.innerHTML = loadingView() + modalView();
    bindModalEvents();
    return;
  }
  if (state.error) {
    view.innerHTML = errorView() + modalView();
    bindModalEvents();
    return;
  }

  if (state.workspace === "home") {
    if (state.route === "landing") view.innerHTML = opsHomeView();
    if (state.route === "strategy") view.innerHTML = unifiedStrategyView();
    if (state.route === "page-styles") view.innerHTML = pageStylesView();
    if (state.route === "topics") view.innerHTML = unifiedTopicsView();
    if (state.route === "articles") view.innerHTML = unifiedDraftsView();
    if (state.route === "posts") view.innerHTML = unifiedPublishPostsView();
    if (state.route === "nljr") view.innerHTML = sourceManagementView();
    if (state.route === "nljr-day") view.innerHTML = nljrDayView();
    if (state.route === "nljr-all-links") view.innerHTML = nljrAllLinksView();
    if (state.route === "daily-archives") view.innerHTML = dailyArchivesView();
    if (state.route === "post") view.innerHTML = xhsPostDetailView();
    bindNavigation();
    bindUnifiedTableFilters();
    bindUnifiedTopicEvents();
    bindSourceManagementEvents();
    return;
  }

  if (state.workspace === "linkedin") {
    if (state.route === "landing") view.innerHTML = linkedinLandingView();
    if (state.route === "strategy") view.innerHTML = linkedinStrategyView();
    if (state.route === "topics") view.innerHTML = linkedinTopicsView();
    if (state.route === "articles") view.innerHTML = linkedinPostsView();
    if (state.route === "posts") view.innerHTML = linkedinPublishPostsView();
    if (state.route === "post") view.innerHTML = linkedinPostDetailView();
    return;
  }

  state.query =
    state.route === "landing" || state.route === "strategy" || state.route === "page-styles"
      ? ""
      : state.query;

  if (state.route === "landing") {
    view.innerHTML = landingView() + modalView();
    bindModalEvents();
  }

  if (state.route === "strategy") {
    view.innerHTML = strategyView() + modalView();
    bindModalEvents();
  }

  if (state.route === "page-styles") {
    view.innerHTML = pageStylesView() + modalView();
    document.querySelectorAll("[data-reusable-tool]").forEach((button) => {
      button.addEventListener("click", () => {
        openReusableTool(button.dataset.reusableTool);
      });
    });
    bindModalEvents();
  }

  if (state.route === "topics") {
    view.innerHTML = topicManagementView() + modalView();
    document.querySelectorAll("[data-topic-filter]").forEach((filter) => {
      const eventName = filter.tagName === "SELECT" ? "change" : "input";
      filter.addEventListener(eventName, (event) => {
        updateTopicFilter(filter.dataset.topicFilter, event.target.value, event.target.selectionStart);
      });
    });
    document.querySelectorAll("[data-source-field]").forEach((input) => {
      input.addEventListener("input", (event) => {
        updateTopicSource(
          input.dataset.sourceId,
          input.dataset.sourceField,
          event.target.value,
          event.target.selectionStart,
        );
      });
    });
    document.querySelector("[data-add-source]")?.addEventListener("click", addTopicSource);
    document.querySelectorAll("[data-delete-source]").forEach((button) => {
      button.addEventListener("click", () => {
        deleteTopicSource(button.dataset.deleteSource);
      });
    });
    document.querySelectorAll("[data-add-topic-to-posts]").forEach((button) => {
      button.addEventListener("click", () => {
        addTopicToPosts(button.dataset.addTopicToPosts);
      });
    });
    document.querySelectorAll("[data-cancel-topic]").forEach((button) => {
      button.addEventListener("click", () => {
        updateTopicStatus(button.dataset.cancelTopic, "cancelled");
      });
    });
    restoreSourceFocus();
    bindModalEvents();
  }

  if (state.route === "articles") {
    view.innerHTML = postManagementView() + modalView();
    document.querySelectorAll("[data-post-filter]").forEach((filter) => {
      const eventName = filter.tagName === "SELECT" ? "change" : "input";
      filter.addEventListener(eventName, (event) => {
        updatePostFilter(filter.dataset.postFilter, event.target.value, event.target.selectionStart);
      });
    });
    document.querySelectorAll("[data-post-asset]").forEach((button) => {
      button.addEventListener("click", () => {
        openPostAsset(button.dataset.postAsset, button.dataset.assetKey);
      });
    });
    document.querySelectorAll("[data-post-action]").forEach((button) => {
      button.addEventListener("click", () => {
        openPostAction(button.dataset.postAction, button.dataset.actionKey);
      });
    });
    document.querySelectorAll("[data-post-cancel]").forEach((button) => {
      button.addEventListener("click", () => {
        cancelPostDraft(button.dataset.postCancel);
      });
    });
    bindModalEvents();
  }

  if (state.route === "posts") {
    view.innerHTML = xhsPublishPostsView();
    bindNavigation();
    bindModalEvents();
  }

  if (state.route === "post") {
    view.innerHTML = xhsPostDetailView();
    bindNavigation();
    bindModalEvents();
  }
}

function updateTopicFilter(filterKey, value, selectionStart) {
  state.topicFilters[filterKey] = value;
  render();
  const nextFilter = document.querySelector(`[data-topic-filter="${filterKey}"]`);
  if (!nextFilter) return;
  nextFilter.focus();
  if (Number.isInteger(selectionStart) && "setSelectionRange" in nextFilter) {
    nextFilter.setSelectionRange(selectionStart, selectionStart);
  }
}

function updatePostFilter(filterKey, value, selectionStart) {
  state.postFilters[filterKey] = value;
  render();
  const nextFilter = document.querySelector(`[data-post-filter="${filterKey}"]`);
  if (!nextFilter) return;
  nextFilter.focus();
  if (Number.isInteger(selectionStart) && "setSelectionRange" in nextFilter) {
    nextFilter.setSelectionRange(selectionStart, selectionStart);
  }
}

function bindUnifiedTableFilters() {
  document.querySelectorAll("[data-unified-filter]").forEach((filter) => {
    const eventName = filter.tagName === "SELECT" ? "change" : "input";
    filter.addEventListener(eventName, (event) => {
      updateUnifiedTableFilter(
        filter.dataset.unifiedFilterTable,
        filter.dataset.unifiedFilter,
        event.target.value,
        event.target.selectionStart,
      );
    });
  });
  restoreUnifiedFilterFocus();
}

function updateUnifiedTableFilter(tableKey, filterKey, value, selectionStart) {
  if (!state.unifiedFilters[tableKey]) return;
  state.unifiedFilters[tableKey][filterKey] = value;
  state.unifiedFilterFocus = { tableKey, filterKey, selectionStart };
  render();
}

function restoreUnifiedFilterFocus() {
  if (!state.unifiedFilterFocus) return;
  const { tableKey, filterKey, selectionStart } = state.unifiedFilterFocus;
  const input = document.querySelector(
    `[data-unified-filter-table="${CSS.escape(tableKey)}"][data-unified-filter="${CSS.escape(filterKey)}"]`,
  );
  if (!input) return;
  input.focus();
  if (Number.isInteger(selectionStart) && "setSelectionRange" in input) {
    input.setSelectionRange(selectionStart, selectionStart);
  }
}

function bindSourceManagementEvents() {
  const refreshButton = document.querySelector("#nljr-refresh-button");
  if (refreshButton) {
    refreshButton.addEventListener("click", async () => {
      await refreshNLJRFeeds();
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

  const toggleLedgerButton = document.querySelector("#toggle-all-ledger-button");
  if (toggleLedgerButton) {
    toggleLedgerButton.addEventListener("click", () => {
      state.showAllArticleLedger = !state.showAllArticleLedger;
      render();
    });
  }
  const toggleSubsButton = document.querySelector("#toggle-all-subscriptions-button");
  if (toggleSubsButton) {
    toggleSubsButton.addEventListener("click", () => {
      state.showAllSubscriptions = !state.showAllSubscriptions;
      render();
    });
  }
  const toggleAdhocsButton = document.querySelector("#toggle-all-adhocs-button");
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

async function generateTodayNLJR() {
  if (!state.backendAvailable) {
    state.actionMessage = "Start the local server to generate and archive today’s NLJR.";
    render();
    return;
  }

  state.actionMessage = "Generating today’s NLJR...";
  render();

  try {
    const result = await apiRequest("/api/nljr-feed/generate", {
      method: "POST",
      body: JSON.stringify({}),
    });
    nljrFeed = result.data || nljrFeed;
    state.actionMessage = "Today’s NLJR generated and archived.";
  } catch (error) {
    state.actionMessage = `Could not generate NLJR: ${error.message}`;
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

  if (!state.backendAvailable) {
    state.actionMessage = "Source added locally. Start the local server to persist source changes.";
    render();
    return;
  }

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

  if (!state.backendAvailable) {
    state.actionMessage = "Source archived locally. Start the local server to persist source changes.";
    render();
    return;
  }

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

function findUnifiedTopic(topicId, origin) {
  if (origin === "linkedin") return linkedinData.topics.find((topic) => topic.id === topicId);
  return appData.topics.find((topic) => topic.id === topicId);
}

function bindUnifiedTopicEvents() {
  document.querySelectorAll("[data-topic-platform]").forEach((select) => {
    select.addEventListener("change", () => {
      updateUnifiedTopicPlatform(
        select.dataset.topicPlatform,
        select.dataset.topicOrigin,
        select.value,
      );
    });
  });
  document.querySelectorAll("[data-open-create-draft]").forEach((button) => {
    button.addEventListener("click", () => {
      openCreateDraftModal(button.dataset.openCreateDraft, button.dataset.topicOrigin);
    });
  });
}

function openCreateDraftModal(topicId, origin) {
  const topic = findUnifiedTopic(topicId, origin);
  if (!topic) return;
  state.modal = {
    assetKey: "createDraft",
    title: topic.title,
    topicId,
    origin,
  };
  render();
}

async function updateUnifiedTopicPlatform(topicId, origin, platform) {
  const topic = findUnifiedTopic(topicId, origin);
  if (!topic) return;
  topic.platform = platform;

  if (origin === "xhs" && state.backendAvailable) {
    try {
      const result = await apiRequest("/api/topics/platform", {
        method: "POST",
        body: JSON.stringify({ topicId, platform }),
      });
      appData = result.data || appData;
      state.actionMessage = `Platform updated to ${platform}.`;
    } catch (error) {
      state.actionMessage = `Could not persist platform change: ${error.message}`;
    }
  } else if (origin === "xhs") {
    state.actionMessage = "Platform updated locally. Start the server to persist XHS topic changes.";
  } else {
    if (state.backendAvailable) {
      try {
        await apiRequest("/api/linkedin/topics/platform", {
          method: "POST",
          body: JSON.stringify({ topicId, platform }),
        });
        state.actionMessage = `LinkedIn platform updated to ${platform}.`;
      } catch (error) {
        state.actionMessage = `Could not persist LinkedIn platform change: ${error.message}`;
      }
    } else {
      state.actionMessage = "LinkedIn platform updated locally. Start the server to persist LinkedIn topic changes.";
    }
  }
  render();
}

function createLinkedInDraftFromTopic(topic) {
  const exists = linkedinData.posts.some((post) => post.topicId === topic.id || post.title === topic.title);
  if (exists) return;
  linkedinData.posts.unshift({
    id: `li-post-${slugForUi(topic.title)}`,
    topicId: topic.id,
    status: "Briefed",
    title: topic.title,
    pillar: topic.pillar || "AI Ops",
    nextStep: "Generate Draft",
    brief: topic.hypothesis || "Turn this topic into an English LinkedIn post for non-technical business owners.",
    article: "",
  });
}

function createXhsDraftLocallyFromTopic(topic) {
  const exists = appData.posts.some((post) => post.topicId === topic.id || post.title === topic.title);
  if (exists) return;
  appData.posts.unshift({
    id: `${new Date().toISOString().slice(0, 10)}-${slugForUi(topic.title)}`,
    topicId: topic.id,
    title: topic.title,
    status: "Added",
    pillar: topic.pillar || "Unassigned",
    owner: "momo",
    date: new Date().toISOString().slice(0, 10),
    sourcePath: topic.source || topic.sourceId || "",
    nextStep: "Brief is ready. Generate Draft next.",
    assets: {},
    sourceAssets: {},
    workflowState: { briefGenerated: true },
  });
}

async function createDraftFromUnifiedTopic(topicId, origin, target) {
  const topic = findUnifiedTopic(topicId, origin);
  if (!topic || !target) return;
  const targets = target === "Both" ? ["XHS", "LinkedIn"] : [target];

  if (targets.includes("XHS")) {
    if (origin === "xhs" && state.backendAvailable) {
      await addTopicToPosts(topicId);
    } else {
      createXhsDraftLocallyFromTopic(topic);
    }
  }
  if (targets.includes("LinkedIn")) {
    createLinkedInDraftFromTopic(topic);
  }
  state.actionMessage = `${targets.join(" and ")} draft${targets.length > 1 ? "s" : ""} created.`;
  render();
}

async function confirmCreateDraftFromModal(topicId, origin) {
  const target = document.querySelector("#create-draft-target")?.value;
  if (!target) return;
  state.modal = null;
  await createDraftFromUnifiedTopic(topicId, origin, target);
}

function slugForUi(value) {
  return String(value || "topic")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "topic";
}

function updateTopicSource(sourceId, field, value, selectionStart) {
  const source = getTopicSources().find((item) => item.id === sourceId);
  if (!source) return;
  source[field] = value;
  state.sourceFocus = { sourceId, field, selectionStart };
  render();
}

function restoreSourceFocus() {
  if (!state.sourceFocus) return;
  const { sourceId, field, selectionStart } = state.sourceFocus;
  const input = document.querySelector(
    `[data-source-id="${CSS.escape(sourceId)}"][data-source-field="${CSS.escape(field)}"]`,
  );
  if (!input) return;
  input.focus();
  if (Number.isInteger(selectionStart) && "setSelectionRange" in input) {
    input.setSelectionRange(selectionStart, selectionStart);
  }
}

function addTopicSource() {
  const sources = getTopicSources();
  let counter = sources.length + 1;
  let id = `source-${counter}`;
  while (sources.some((source) => source.id === id)) {
    counter += 1;
    id = `source-${counter}`;
  }
  sources.push({
    id,
    label: "New source",
    path: "",
    type: "custom",
  });
  state.sourceFocus = { sourceId: id, field: "label", selectionStart: 10 };
  render();
}

function deleteTopicSource(sourceId) {
  if (sourceUsageCount(sourceId)) return;
  appData.topicSources = getTopicSources().filter((source) => source.id !== sourceId);
  if (state.topicFilters.source === sourceId) {
    state.topicFilters.source = "All sources";
  }
  state.sourceFocus = null;
  render();
}

async function addTopicToPosts(topicId) {
  const topic = appData.topics.find((item) => item.id === topicId);
  if (!topic) return;

  if (!state.backendAvailable) {
    state.actionMessage = "Start the local server with npm run dev before changing records.";
    render();
    return;
  }

  try {
    const result = await apiRequest("/api/topics/add-to-posts", {
      method: "POST",
      body: JSON.stringify({ topicId }),
    });
    appData = result.data || appData;
    state.actionMessage = `"${topic.title}" was added to Posts and saved to file.`;
  } catch (error) {
    state.actionMessage = error.message;
  }
  render();
}

function updateTopicAction(topicId, action) {
  if (action === "add") {
    addTopicToPosts(topicId);
    return;
  }
  if (action === "cancel") {
    updateTopicStatus(topicId, "cancelled");
  }
}

async function updateTopicStatus(topicId, status) {
  const topic = appData.topics.find((item) => item.id === topicId);
  if (!topic) return;

  if (!state.backendAvailable) {
    state.actionMessage = "Start the local server with npm run dev before changing records.";
    render();
    return;
  }

  try {
    const result = await apiRequest("/api/topics/status", {
      method: "POST",
      body: JSON.stringify({ topicId, status }),
    });
    appData = result.data || appData;
    state.actionMessage = `"${topic.title}" status changed to ${status} and saved to file.`;
  } catch (error) {
    state.actionMessage = error.message;
  }
  render();
}

function createLocalPostFromTopic(topic) {
  const date = new Date().toISOString().slice(0, 10);
  const shortSlug = normalizeSourceId(topic.title);
  const filename = `${date}_${shortSlug}_brief.md`;
  return {
    id: `${date}-${shortSlug}`,
    topicId: topic.id,
    title: topic.title,
    status: "Added",
    pillar: topic.pillar,
    owner: "momo",
    date,
    sourcePath: `content_pipeline/drafts/${filename}`,
    nextStep: "Brief is ready. Generate Draft next.",
    assets: {
      brief: `data/pipeline/${filename}`,
    },
    sourceAssets: {
      brief: `content_pipeline/drafts/${filename}`,
    },
    workflowState: {
      briefGenerated: true,
    },
  };
}

async function openReusableTool(toolKey) {
  const tool = productionModules.find((module) => module.key === toolKey);
  if (!tool) return;
  state.modal = {
    title: "Reusable Templates",
    assetKey: toolKey,
    content: "",
    loading: true,
    error: "",
  };
  render();

  try {
    const response = await fetch(tool.templatePath, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load ${tool.templatePath}`);
    const content = await response.text();
    state.modal = {
      title: "Reusable Templates",
      assetKey: toolKey,
      content,
      loading: false,
      error: "",
    };
  } catch (error) {
    state.modal = {
      title: "Reusable Templates",
      assetKey: toolKey,
      content: reusableToolContent(toolKey),
      loading: false,
      error: "",
    };
  }
  render();
}

async function openPostAction(postId, actionKey) {
  const post = getPostById(postId);
  if (!post) return;

  if (actionKey === "generateDraft") {
    openDraftReview(postId);
    return;
  }

  if (["visualDirection", "imagePrompts", "images"].includes(actionKey)) {
    openGenerateImageWorkflow(postId);
    return;
  }

  const assetMap = {
    generateCopy: post.assets?.publishCopy ? "publishCopy" : "carouselScript",
    reviewCopy: "copyReview",
  };
  const assetKey = assetMap[actionKey];
  if (assetKey && post.assets?.[assetKey]) {
    openPostAsset(postId, assetKey);
    return;
  }

  state.modal = {
    title: post.title,
    assetKey: actionKey,
    postId,
    content: buildPostActionContent(post, actionKey),
    loading: false,
    error: "",
  };
  render();
}

function openGenerateImageWorkflow(postId) {
  const post = getPostById(postId);
  if (!post) return;
  state.modal = {
    title: post.title,
    assetKey: "generateImageWorkflow",
    postId,
    content: buildGenerateImageWorkflowContent(post),
    loading: false,
    error: "",
    comment: "",
  };
  render();
}

async function cancelPostDraft(postId) {
  const post = getPostById(postId);
  if (!post) return;

  if (!state.backendAvailable) {
    state.actionMessage = "Start the local server with npm run dev:fallback before cancelling a post draft.";
    render();
    return;
  }

  try {
    const result = await apiRequest("/api/posts/cancel", {
      method: "POST",
      body: JSON.stringify({ postId }),
    });
    appData = result.data || appData;
    state.actionMessage = `"${post.title}" was archived and returned to the Topic List funnel.`;
  } catch (error) {
    const routeMissing = String(error.message || "").includes("Request failed: 404");
    state.actionMessage = routeMissing
      ? "Cancel API is missing on the running server. Stop the current server and restart it with npm run dev:fallback, then click Cancel again."
      : error.message;
  }
  render();
}

async function openDraftReview(postId) {
  let post = getPostById(postId);
  if (!post) return;
  state.modal = {
    title: post.title,
    assetKey: "generateDraft",
    postId,
    content: "",
    loading: true,
    error: "",
    comment: "",
  };
  render();

  try {
    if ((!post.assets?.publishCopy || !post.assets?.copyReview) && state.backendAvailable) {
      state.actionMessage = "Generating draft and copy review...";
      const result = await apiRequest("/api/generate-draft", {
        method: "POST",
        body: JSON.stringify({ postId }),
      });
      appData = result.data || appData;
      post = getPostById(postId) || result.post || post;
    }

    const [draftContent, reviewContent] = await Promise.all([
      fetchPostAssetText(post, "publishCopy").catch(() => fetchPostAssetText(post, "carouselScript")),
      fetchPostAssetText(post, "copyReview").catch(() => ""),
    ]);
    state.actionMessage = "Draft and copy review are ready.";
    state.modal = {
      title: post.title,
      assetKey: "generateDraft",
      postId,
      content: buildDraftReviewContent(post, draftContent, reviewContent),
      loading: false,
      error: "",
      comment: "",
    };
  } catch (error) {
    const generateDraftRouteMissing =
      String(error.message || "").includes("Request failed: 404") && !post.assets?.publishCopy;
    state.modal = {
      title: post.title,
      assetKey: "generateDraft",
      postId,
      content: !state.backendAvailable
        ? "Start the local server before generating draft content. This action needs to write publish copy and copy review files."
        : generateDraftRouteMissing
          ? "The local server does not know the Generate Draft API yet. Stop the current server and restart it with npm run dev:fallback, then click Generate Draft again."
        : "",
      loading: false,
      error: generateDraftRouteMissing ? "Generate Draft API is missing on the running server." : error.message,
      comment: "",
    };
  }
  render();
}

async function openPostAsset(postId, assetKey) {
  const post = getPostById(postId);
  const assetPath = post?.assets?.[assetKey];
  if (!post) return;

  if (!assetPath && assetKey === "brief") {
    state.modal = {
      title: post.title,
      assetKey,
      postId,
      content: buildGeneratedBrief(post),
      loading: false,
      error: "",
    };
    render();
    return;
  }

  if (!assetPath) return;

    state.modal = {
      title: post.title,
      assetKey,
      postId,
      content: "",
      loading: true,
      error: "",
      selectedOption: post.workflowState?.selectedVisualOption || post.visualDecision?.selectedOption || "Option B",
      adjustment: post.workflowState?.visualAdjustment || post.visualDecision?.adjustment || "",
    };
  render();

  try {
    const rawContent = await fetchPostAssetText(post, assetKey);
    const content =
      assetKey === "brief" && !/^# Why This Post\s*$/m.test(rawContent)
        ? `${buildWhyRecommended(post)}\n\n---\n\n${rawContent}`
        : rawContent;
    state.modal = {
      title: post.title,
      assetKey,
      postId,
      content,
      loading: false,
      error: "",
      selectedOption: post.workflowState?.selectedVisualOption || post.visualDecision?.selectedOption || "Option B",
      adjustment: post.workflowState?.visualAdjustment || post.visualDecision?.adjustment || "",
    };
  } catch (error) {
    state.modal = {
      title: post.title,
      assetKey,
      postId,
      content: "",
      loading: false,
      error: `Could not load ${assetPath}. Make sure the local server is running from the project root.`,
      selectedOption: post.workflowState?.selectedVisualOption || post.visualDecision?.selectedOption || "Option B",
      adjustment: post.workflowState?.visualAdjustment || post.visualDecision?.adjustment || "",
    };
  }
  render();
}

function bindModalEvents() {
  document.querySelectorAll("[data-close-modal]").forEach((element) => {
    element.addEventListener("click", (event) => {
      if (event.target === element || element.matches("button")) {
        closeModal();
      }
    });
  });
  document.querySelector("[data-generate-image-prompts]")?.addEventListener("click", async (event) => {
    await generateImagePromptsFromModal(event.currentTarget.dataset.generateImagePrompts);
  });
  document.querySelector("[data-next-image-prompts]")?.addEventListener("click", async (event) => {
    await generateImagePromptsFromModal(event.currentTarget.dataset.nextImagePrompts);
  });
  document.querySelector("[data-refresh-draft]")?.addEventListener("click", async (event) => {
    await refreshDraftFromModal(event.currentTarget.dataset.refreshDraft);
  });
  document.querySelector("[data-accept-draft]")?.addEventListener("click", async (event) => {
    await acceptDraft(event.currentTarget.dataset.acceptDraft);
  });
  document.querySelector("[data-confirm-create-draft]")?.addEventListener("click", async (event) => {
    await confirmCreateDraftFromModal(
      event.currentTarget.dataset.confirmCreateDraft,
      event.currentTarget.dataset.topicOrigin,
    );
  });
  document.querySelector("[data-select-visual-option]")?.addEventListener("click", async (event) => {
    await selectVisualOption(event.currentTarget.dataset.selectVisualOption);
  });
  document.querySelector("[data-generate-carousel-script]")?.addEventListener("click", async (event) => {
    await generateCarouselScriptFromModal(event.currentTarget.dataset.generateCarouselScript);
  });
  document.querySelector("[data-accept-carousel-script]")?.addEventListener("click", async (event) => {
    await acceptCarouselScriptFromModal(event.currentTarget.dataset.acceptCarouselScript);
  });
  document.querySelector("[data-accept-image-prompts]")?.addEventListener("click", async (event) => {
    await acceptImagePromptsFromModal(event.currentTarget.dataset.acceptImagePrompts);
  });
  document.querySelector("[data-accept-image-package]")?.addEventListener("click", async (event) => {
    await acceptImagePackageFromModal(event.currentTarget.dataset.acceptImagePackage);
  });
  document.querySelector("#image-required-toggle")?.addEventListener("change", (event) => {
    document.querySelector("#post-style-options")?.classList.toggle("is-hidden", !event.target.checked);
  });
  document.querySelector("[data-refresh-prompts]")?.addEventListener("click", (event) => {
    refreshPromptsFromModal(event.currentTarget.dataset.refreshPrompts);
  });
  document.querySelector("[data-accept-prompts]")?.addEventListener("click", (event) => {
    acceptPrompts(event.currentTarget.dataset.acceptPrompts);
  });
  document.querySelectorAll("[data-generate-images]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      await generateImagesFromModal(event.currentTarget.dataset.generateImages);
    });
  });
  document.querySelector("[data-accept-images]")?.addEventListener("click", (event) => {
    acceptImages(event.currentTarget.dataset.acceptImages);
  });
}

async function refreshDraftFromModal(postId) {
  const post = getPostById(postId);
  if (!post || !state.modal) return;
  const comment = document.querySelector("#draft-refresh-comment")?.value || "";
  state.actionMessage = comment
    ? "Draft refresh request captured in the local workflow."
    : "Add a comment before refreshing the draft.";
  if (!comment) {
    render();
    return;
  }
  const [draftContent, reviewContent] = await Promise.all([
    fetchPostAssetText(post, "publishCopy").catch(() => fetchPostAssetText(post, "carouselScript")),
    fetchPostAssetText(post, "copyReview").catch(() => ""),
  ]);
  state.modal.comment = comment;
  state.modal.content = buildDraftReviewContent(post, draftContent, reviewContent, comment);
  render();
}

async function acceptDraft(postId) {
  const post = getPostById(postId);
  if (!post) return;

  if (!state.backendAvailable) {
    state.actionMessage = "Start the local server with npm run dev:fallback before accepting a draft.";
    render();
    return;
  }

  try {
    const result = await apiRequest("/api/drafts/accept", {
      method: "POST",
      body: JSON.stringify({ postId }),
    });
    appData = result.data || appData;
    state.actionMessage = "Draft accepted and saved. Generate Image is now available.";
    closeModal();
  } catch (error) {
    const routeMissing = String(error.message || "").includes("Request failed: 404");
    state.actionMessage = routeMissing
      ? "Accept Draft API is missing on the running server. Stop the current server and restart it with npm run dev:fallback, then accept again."
      : error.message;
    render();
  }
}

async function selectVisualOption(postId) {
  const post = getPostById(postId);
  if (!post) return;
  const workflow = ensurePostWorkflow(post);
  workflow.visualOptionSelected = true;
  post.status = "Generate Image";
  workflow.selectedVisualOption = document.querySelector("#visual-option-select")?.value || "Option B";
  workflow.visualAdjustment = document.querySelector("#visual-option-adjustment")?.value || "";
  state.actionMessage = `${workflow.selectedVisualOption} selected. Opening Image Prompts.`;
  if (post.assets?.imagePrompts) {
    await openPostAsset(postId, "imagePrompts");
    return;
  }
  state.modal = {
    title: post.title,
    assetKey: "imagePrompts",
    postId,
    content: buildPostActionContent(post, "imagePrompts"),
    loading: false,
    error: "",
    comment: "",
  };
  render();
}

function collectImageWorkflowInput() {
  return {
    imageRequired: Boolean(document.querySelector("#image-required-toggle")?.checked),
    styleOption: document.querySelector('input[name="post-style-option"]:checked')?.value || "Option B",
    goals: [...document.querySelectorAll('input[name="image-goal"]:checked')].map((item) => item.value),
    comment: document.querySelector("#image-workflow-comment")?.value || "",
  };
}

async function runImageWorkflowStep(postId, path, message) {
  if (!state.backendAvailable) {
    state.actionMessage = "Start the local server with npm run dev:fallback before running Generate Image workflow steps.";
    render();
    return;
  }
  state.actionMessage = message;
  render();
  try {
    const result = await apiRequest(path, {
      method: "POST",
      body: JSON.stringify({ postId, ...collectImageWorkflowInput() }),
    });
    appData = result.data || appData;
    const post = getPostById(postId);
    state.modal = {
      title: post?.title || "Generate Image",
      assetKey: "generateImageWorkflow",
      postId,
      content: post ? buildGenerateImageWorkflowContent(post) : "",
      loading: false,
      error: "",
      comment: "",
    };
    state.actionMessage = result.message || "Generate Image workflow updated.";
  } catch (error) {
    const routeMissing = String(error.message || "").includes("Request failed: 404");
    state.actionMessage = routeMissing
      ? "Generate Image workflow API is missing on the running server. Restart with npm run dev:fallback, then try again."
      : error.message;
  }
  render();
}

async function generateCarouselScriptFromModal(postId) {
  await runImageWorkflowStep(postId, "/api/image-workflow/carousel-script", "Generating carousel script...");
}

async function acceptCarouselScriptFromModal(postId) {
  await runImageWorkflowStep(postId, "/api/image-workflow/image-prompts", "Generating all image prompts...");
}

async function acceptImagePromptsFromModal(postId) {
  await runImageWorkflowStep(postId, "/api/image-workflow/generate-images", "Generating local carousel images...");
}

async function acceptImagePackageFromModal(postId) {
  await runImageWorkflowStep(postId, "/api/image-workflow/accept-package", "Saving Ready package...");
}

function refreshPromptsFromModal(postId) {
  const post = getPostById(postId);
  if (!post || !state.modal) return;
  const comment = document.querySelector("#prompt-refresh-comment")?.value || "";
  state.actionMessage = comment
    ? "Prompt refresh request captured in the local workflow."
    : "Add a comment before refreshing prompts.";
  if (comment) {
    state.modal.comment = comment;
    state.modal.content = `${state.modal.content}\n\n## Latest Prompt Refresh Comment\n\n${comment}\n\n> Local UI note: this comment is captured here for the next prompt refresh. Connect the backend generator to rewrite the prompts from this instruction.`;
  }
  render();
}

function acceptPrompts(postId) {
  const post = getPostById(postId);
  if (!post) return;
  ensurePostWorkflow(post).promptsAccepted = true;
  post.status = "Generate Image";
  state.actionMessage = "Image prompts accepted. Generate Image is now available.";
  render();
}

async function generateImagePromptsFromModal(postId) {
  if (!state.backendAvailable) return;
  const selectedOption = document.querySelector("#visual-option-select")?.value || "Option B";
  const adjustment = document.querySelector("#visual-option-adjustment")?.value || "";
  state.actionMessage = "Saving visual option and generating image prompts...";
  render();

  try {
    await apiRequest("/api/visual-option", {
      method: "POST",
      body: JSON.stringify({ postId, selectedOption, adjustment }),
    });
    const result = await apiRequest("/api/generate-image-prompts", {
      method: "POST",
      body: JSON.stringify({ postId }),
    });
    state.actionMessage =
      result.mode === "codex_task"
        ? `Codex task created: ${result.taskPath}`
        : "Image prompts are ready.";
    await loadRealData();
    openPostAsset(postId, "imagePrompts");
  } catch (error) {
    state.actionMessage = error.message;
    render();
  }
}

async function generateImagesFromModal(postId) {
  const post = getPostById(postId);
  if (!post) return;

  if (!state.backendAvailable) {
    const workflow = ensurePostWorkflow(post);
    workflow.generatedImages = [
      "Page 1 cover image - pending generation/review",
      "Page 4 save-worthy checklist image - pending generation/review",
    ];
    state.modal = {
      title: post.title,
      assetKey: "images",
      postId,
      content: `# Image Review\n\n## Generated Image Queue\n\n${workflow.generatedImages.map((item) => `- ${item}`).join("\n")}\n\n## Review Notes\n\nThis local UI step represents the image review stage. Connect the image generation backend to replace these placeholders with generated image paths/previews.`,
      loading: false,
      error: "",
    };
    state.actionMessage = "Local image review stage opened.";
    render();
    return;
  }

  state.actionMessage = "Generating images or creating a Codex image task...";
  render();

  try {
    const result = await apiRequest("/api/generate-images", {
      method: "POST",
      body: JSON.stringify({ postId, pages: [1, 4] }),
    });
    state.actionMessage =
      result.mode === "openai_api"
        ? `Generated ${result.generated.length} images.`
        : `Codex task created: ${result.taskPath}`;
    await loadRealData();
    const post = [...appData.posts, ...appData.publishedPosts].find((item) => item.id === postId);
    state.modal = {
      title: post?.title || "Images",
      assetKey: "images",
      postId,
      content:
        result.mode === "openai_api"
          ? `# Images Generated\n\n${result.generated.map((item) => `- Page ${item.page}: ${item.path}`).join("\n")}`
          : `# Images Task Created\n\nTask file:\n\n\`${result.taskPath}\`\n\nI can now pick this up from the task queue and generate images with the Codex image tool.`,
      loading: false,
      error: "",
    };
    render();
  } catch (error) {
    state.actionMessage = error.message;
    render();
  }
}

function acceptImages(postId) {
  const post = getPostById(postId);
  if (!post) return;
  ensurePostWorkflow(post).imagesAccepted = true;
  post.status = "Ready";
  state.actionMessage = "Images accepted. Publish package is ready.";
  state.modal = {
    title: post.title,
    assetKey: "publishPackage",
    postId,
    content: buildPublishPackageContent(post),
    loading: false,
    error: "",
  };
  render();
}

function closeModal() {
  if (!state.modal) return;
  state.modal = null;
  render();
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

document.querySelector("#mobile-menu-toggle").addEventListener("click", () => {
  const toggle = document.querySelector("#mobile-menu-toggle");
  setMobileMenu(toggle.getAttribute("aria-expanded") !== "true");
});

function bindNavigation() {
  document.querySelectorAll(".nav-item").forEach((item) => {
    if (item.dataset.navBound === "true") return;
    item.dataset.navBound = "true";
    item.addEventListener("click", (event) => {
      if (!item.dataset.route) return;
      event.preventDefault();
      state.query = "";
      setRoute(item.dataset.route, {
        workspace: item.dataset.workspace || state.workspace,
        postId: item.dataset.postId || "",
      });
      setMobileMenu(false);
    });
  });
}

bindNavigation();

window.addEventListener("hashchange", () => {
  const next = parseRouteHash(window.location.hash);
  if (
    next.route === state.route &&
    next.workspace === state.workspace &&
    (next.postId || "") === (state.postPageId || "")
  ) {
    return;
  }
  state.query = "";
  setRoute(next.route, { workspace: next.workspace, postId: next.postId, replace: true });
});

const initialRoute = parseRouteHash(window.location.hash);
state.workspace = initialRoute.workspace;
state.route = initialRoute.route;
state.postPageId = initialRoute.postId || "";
setRoute(state.route, { workspace: state.workspace, postId: state.postPageId, replace: true });
loadRealData();
