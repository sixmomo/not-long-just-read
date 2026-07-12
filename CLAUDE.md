# Claude Code Project Guide

This repository is a local-first content operations system for:

- Xiaohongshu content for North America AI PM coaching.
- LinkedIn content for AI Ops and AI products for non-technical business owners.
- NLJR daily source discovery, summarization, deduplication, and topic seeding.

Use this file as the reading index. Do not treat it as a replacement for the
requirements and architecture documents linked below.

## Required Reading Order

Read these files before making structural or workflow changes:

1. `README.md` - project overview, runtime commands, and documentation map.
2. `VISION.md` - product purpose, audience, north star, and development phases.
3. `docs/business_requirements.md` - product behavior and business rules.
4. `docs/architecture.md` - runtime components, APIs, and file-backed design.
5. `docs/data_model.md` - structured files, fields, statuses, and ownership.
6. `docs/workflows.md` - end-to-end workflow and NLJR editorial rules.
7. `docs/contributor_guide.md` - safe editing and verification practices.

For content decisions, also read the relevant files under `strategy/`.

## Setup And Validation

From the repository root:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5177/ui/index.html
```

Validation:

```bash
npm run check
```

Unit Tests:

```bash
node scripts/test_nljr.js
```

NLJR Feed CLI Refresh:

```bash
node scripts/refresh_nljr.js
node scripts/refresh_nljr.js --dry-run
```

The Node server in `server.mjs` is the primary runtime serving both static files and REST APIs on port 5177.

## Authoritative Directories

### Product documentation

- `docs/` - requirements, architecture, data model, workflows, contributor guide.
- `README.md` - setup and high-level project map.
- `VISION.md` - strategic product vision.

### Strategy

- `strategy/account_strategy.md`
- `strategy/audience_persona.md`
- `strategy/topic_matrix.md`
- `strategy/viral_review.md`
- `strategy/voice_guide.md`

### Application

- `ui/index.html` - frontend entry point.
- `ui/app.js` - frontend routes, views, and interactions.
- `ui/styles.css` - frontend styles.
- `server.mjs` - primary local server and write APIs.
- `scripts/local_test_server.py` - fallback server.

### Structured application state

- `ui/data/xhs-data.json` - topics, drafts, posts, styles, and workflow state.
- `ui/data/source-registry.json` - NLJR sources and subscription scan state.
- `ui/data/nljr-feed.json` - current NLJR and archive index.
- `ui/data/nljr-article-ledger.json` - article lifecycle and URL deduplication.
- `ui/data/linkedin-overrides.json` - LinkedIn-specific overrides.

Do not hand-edit generated state casually. Preserve stable IDs, status
transitions, and cross-file references.

### Content artifacts

- `content_pipeline/templates/` - canonical reusable templates.
- `content_pipeline/drafts/` - post briefs, copy, reviews, and image workflow files.
- `content_pipeline/generated_images/` - generated XHS images.
- `content_pipeline/linkedin_posts/` - LinkedIn-ready artifacts.
- `content_pipeline/nljr_archive/` - dated NLJR Markdown snapshots.
- `content_pipeline/tasks/` - queued local/Codex work.

`ui/data/templates/` contains browser-readable copies. Keep canonical and UI
template copies synchronized when changing templates.

### Research and operations

- `references/` - trend sources and research procedures.
- `trend_inbox/` - screenshots, manual signals, and processed research.
- `performance/` - post metrics.
- `weekly_pivots/` - strategy review history.
- `visual_system/` - XHS visual direction and style assets.
- `archive/` - versioned historical documents.

### Standalone NLJR package

- `not-long-just-read/` - a separate portable NLJR package and skill.

Do not confuse its `data/` files with the live application state in
`ui/data/`. Unless the task explicitly targets the standalone package, the
live app uses the files under `ui/data/`.

## Important Rules

- The repository is file-backed; there is no database.
- Persist user actions to the owning file. UI-only state is not sufficient.
- Use English filenames.
- XHS content is Chinese-first with natural English terms.
- LinkedIn content is English.
- Archive strategy documents before major rewrites when the established
  versioning workflow applies.
- Do not repeat processed NLJR articles. Direct article URL is the
  deduplication key.
- NLJR summaries must come from the article, transcript, or substantive show
  notes, not RSS teaser text.
- NLJR `whyItMatters` must explain the reusable strategic lesson.
- NLJR `topicAngle` must be an actionable post thesis, not generic relevance.
- Home renders only the three IDs in `today.recommendedItemIds`.
- A dated NLJR edition renders up to ten ranked `today.items`.
- Items 1-3 require deep editorial fields; items 4-10 require
  `conciseSummary` and `conciseWhyRelevant`.
- Do not pad an edition to ten with unreadable, paywalled, stale, generic, or
  low-relevance material.
- Preserve unrelated user changes in a dirty worktree.

## Documentation Maintenance

When behavior changes, update the corresponding source of truth:

- Product scope or user behavior: `docs/business_requirements.md`
- Runtime or component boundaries: `docs/architecture.md`
- Fields, statuses, or storage: `docs/data_model.md`
- Workflow steps or editorial rules: `docs/workflows.md`
- Setup commands: `README.md` and this file
- Strategic positioning: `VISION.md` and the relevant `strategy/` files
