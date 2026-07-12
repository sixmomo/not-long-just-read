# Data Model

## Storage Strategy

The project currently uses files as the database.

Main structured data:

- `ui/data/xhs-data.json`
- `ui/data/source-registry.json`
- `ui/data/nljr-feed.json`
- `ui/data/nljr-article-ledger.json`

Long-form content:

- Markdown files in `content_pipeline/` and `ui/data/`

Performance:

- CSV file in `performance/`

Token usage:

- CSV file in `performance/token_usage.csv`

Trend screenshots:

- PNG files and signal Markdown files in `trend_inbox/processed/`

## NLJR Sources And Articles

`ui/data/source-registry.json` stores recurring inputs. A subscription is a
source, not a daily NLJR item.

Subscription control status:

- `active`: scan this subscription.
- `paused`: retain it but do not scan it.
- `archived`: hide it from the active source workflow.

System-owned subscription scan status:

- `never_checked`: no successful scan has run yet.
- `healthy`: the latest scan succeeded and found new posts.
- `no_new_posts`: the latest scan succeeded but found nothing new.
- `error`: the latest scan failed; inspect `lastError`.

The automation also updates `lastCheckedAt`, `lastItemSeen`, and `lastError`.
RSS or another structured feed is preferred. An archive page can be used to
discover direct post URLs, but the archive page itself must never become an
NLJR item.

`ui/data/nljr-article-ledger.json` stores direct article records. Article
status values:

- `new`: discovered and eligible for a future NLJR.
- `processed`: included in an NLJR and permanently excluded from selection.
- `skipped`: reviewed but intentionally excluded.
- `failed`: discovered, but article reading or summarization failed.

The direct article URL is the deduplication key. Before adding an article, the
automation must check the full ledger and all prior feed items. Processing an
article sets `processedAt` and `includedIn`.

`ui/data/nljr-feed.json` contains only ready-to-read article summaries. It must
never contain source placeholders such as `Archive scan ready`.

Current edition shape:

```json
{
  "today": {
    "date": "YYYY-MM-DD",
    "status": "generated",
    "generatedAt": "ISO timestamp",
    "items": [],
    "recommendedItemIds": [],
    "sourceHealth": {}
  },
  "archive": []
}
```

Rules:

- `items` is ranked and contains at most ten qualifying articles.
- `recommendedItemIds` contains the IDs of the first three deep
  recommendations, or fewer when fewer qualify.
- Home renders only `recommendedItemIds`.
- The dated NLJR page renders all `items`.
- Recommended items use `detailLevel: recommended` and full `summary`,
  `whyItMatters`, and `topicAngle`.
- Items 4-10 use `detailLevel: brief` and should include `conciseSummary` and
  `conciseWhyRelevant`. Full editorial fields may also be retained.
- Every archive entry identifies a dated Markdown snapshot and the item count.

## `ui/data/xhs-data.json`

Top-level shape:

```json
{
  "meta": {},
  "strategy": {},
  "pageStyles": {},
  "topicSources": [],
  "topics": [],
  "posts": [],
  "publishedPosts": [],
  "postMetrics": []
}
```

### `meta`

General UI metadata.

Common fields:

- `sources`: list of source files used to build the data snapshot.

### `strategy`

Summaries of strategy source files used by the Strategy page.

The canonical strategy documents are still in:

- `strategy/account_strategy.md`
- `strategy/audience_persona.md`
- `strategy/topic_matrix.md`
- `strategy/viral_review.md`
- `strategy/voice_guide.md`

### `pageStyles`

Stores reusable visual style information.

Common shape:

```json
{
  "librarySource": "visual_system/...",
  "library": [],
  "currentPostOptions": []
}
```

Use this for reusable visual directions and page-style references.

### `topicSources`

Editable source list used by the Topics page.

Common fields:

| Field | Meaning |
|---|---|
| `id` | Stable source id used by topics. |
| `label` | Human-readable source name. |
| `path` | Local source path or description. |
| `notes` | Optional context. |

### `topics`

The Topic List data.

Current common fields:

| Field | Meaning |
|---|---|
| `id` | Stable topic id. |
| `title` | Topic title shown in the UI. |
| `pillar` | Strategic content pillar. |
| `hypothesis` | Commercial or audience hypothesis. |
| `sourceId` | Links to `topicSources.id`. |
| `priority` | Lower number means higher priority. |
| `status` | `funnel`, `selected`, or `cancelled`. |

Status meanings:

- `funnel`: generated from strategy, trend sources, or processed signals, but not yet selected.
- `selected`: chosen by the user to enter the post pipeline.
- `cancelled`: currently not suitable.

Default Topic List sorting:

1. `selected`
2. `funnel`
3. `cancelled`

Within the same status, sort by `priority`.

The UI treats Topic status as system-controlled. The user changes it through the `Action` column: `Add` sets `selected`, and `Cancel` sets `cancelled`.

### `posts`

Active post pipeline items.

Current common fields:

| Field | Meaning |
|---|---|
| `id` | Stable post id. |
| `topicId` | Links back to `topics.id` when available. |
| `title` | Post title. |
| `status` | Current post workflow state. |
| `pillar` | Strategic content pillar. |
| `owner` | Usually `momo`. |
| `date` | Creation date. |
| `sourcePath` | Primary source path for the post. |
| `nextStep` | Human-readable next action. |
| `assets` | UI-readable Markdown asset paths. |
| `sourceAssets` | Canonical Markdown asset paths. |
| `workflowState` | Structured state for selections and generated steps. |

Allowed post status values:

| Status | Meaning |
|---|---|
| `Added` | Topic has been added to the post pipeline. The brief may already exist; the next major action is Generate Draft. |
| `Drafted` | Draft copy has been accepted by the user. Generated-but-unaccepted drafts remain `Added`. |
| `Generate Image` | Unified image workflow is in progress: visual direction, carousel script, image prompts, and image review. |
| `Ready` | Final package is ready for manual publishing. |
| `Archived` | Removed from the active working view but kept for record. |

The Posts table hides `Archived` by default when the status filter is `All statuses`. Selecting `Archived` in the status filter shows archived records.

When a post draft is cancelled from the Post Drafts table:

- The post draft status becomes `Archived`.
- The linked topic status becomes `funnel`.
- Existing draft assets remain linked for historical traceability.
- A later `Add` action on the same topic should create a new active draft, because archived drafts are not treated as active queue items.

When a topic is added to Posts, the system should create a brief Markdown file immediately and link it through `assets.brief` and `sourceAssets.brief`, while keeping the post status as `Added`.

When Generate Draft runs successfully, the system should create:

- `assets.publishCopy`
- `assets.copyReview`
- `sourceAssets.publishCopy`
- `sourceAssets.copyReview`

The post status should remain `Added` until the user accepts the draft. When Accept Draft runs successfully, the post status should become `Drafted` and `workflowState.draftAccepted` should be `true`.

### `assets`

Used by the browser UI to fetch Markdown content.

Example:

```json
{
  "brief": "data/pipeline/example_brief.md",
  "carouselScript": "data/pipeline/example_carousel.md",
  "publishCopy": "data/pipeline/example_publish-copy.md",
  "copyReview": "data/pipeline/example_copy-review.md",
  "visualStyleOptions": "data/pipeline/example_visual-style-options.md",
  "imagePrompts": "data/pipeline/example_image-prompts.md"
}
```

### `sourceAssets`

Canonical project paths used by backend logic and Codex.

Example:

```json
{
  "brief": "content_pipeline/drafts/example_brief.md",
  "carouselScript": "content_pipeline/drafts/example_carousel.md",
  "publishCopy": "content_pipeline/drafts/example_publish-copy.md",
  "copyReview": "content_pipeline/drafts/example_copy-review.md",
  "visualStyleOptions": "content_pipeline/drafts/example_visual-style-options.md",
  "imagePrompts": "content_pipeline/drafts/example_image-prompts.md"
}
```

### `publishedPosts`

Same general shape as `posts`, but used for content that has already been published.

### `postMetrics`

Performance data for published posts.

The durable source is:

- `performance/post_metrics.csv`

Expected metrics can include:

- publish date
- title
- views
- likes
- saves
- comments
- follows
- save rate
- notes from weekly review

## Markdown Asset Locations

Canonical post drafts:

- `content_pipeline/drafts/`

UI-readable copies:

- `ui/data/pipeline/`

Canonical templates:

- `content_pipeline/templates/`

UI-readable template copies:

- `ui/data/templates/`

## Naming Convention

Use English file names.

Recommended pattern:

```text
YYYY-MM-DD_short-english-slug_asset-type.md
```

Examples:

- `2026-06-10_ai-pm-project-proof_brief.md`
- `2026-06-10_ai-pm-project-proof_carousel.md`
- `2026-06-10_ai-pm-project-proof_image-prompts.md`

Screenshot batches should also use English names:

```text
YYYY-MM-DD_keyword_01.png
```

Example:

```text
2026-06-10_ai-product-manager_01.png
```
