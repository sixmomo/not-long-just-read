# Contributor Guide

## First Read

Start with these files:

1. `README.md`
2. `VISION.md`
3. `docs/business_requirements.md`
4. `docs/architecture.md`
5. `docs/data_model.md`
6. `docs/workflows.md`

Then inspect:

- `ui/data/xhs-data.json`
- `strategy/account_strategy.md`
- `strategy/audience_persona.md`
- `strategy/topic_matrix.md`

## Start The App

The current app has one Node server that serves both frontend and backend.

From the project root:

```bash
npm run dev
```

If Node fails to start because of a Windows path permission issue in the Codex sandbox, use:

```bash
npm run dev:fallback
```

The fallback command runs `scripts/local_test_server.py`. It is intended for local UI and Topic List testing, and the terminal must stay open while testing.

Open the frontend:

```text
http://127.0.0.1:5177/ui/index.html
```

From another device on the same trusted LAN/Wi-Fi:

```text
http://<your-lan-ip>:5177/ui/index.html
```

If the LAN URL does not load, confirm the server is running and add a Windows Firewall inbound private-network rule for TCP port `5177`.

Check the backend:

```text
http://127.0.0.1:5177/api/health
```

Expected response:

```json
{
  "ok": true
}
```

If `5177` is unavailable:

```bash
PORT=5180 npm run dev
```

Then use:

```text
http://127.0.0.1:5180/ui/index.html
```

Do not perform real workflow actions from a static file view. Topic status changes, Add to Posts, visual direction selection, and generation tasks should be done with the Node backend running so the records are written back to files.

## Working Principles

This project is a strategy and workflow system first, and a code app second.

Preserve these defaults:

- One account only.
- Persona name: `momo`.
- Main language: Chinese with natural English mixing.
- File names: English only.
- Default content format: Xiaohongshu carousel / image-text note.
- Human chooses topic and visual direction.
- Codex assists with structure, drafting, analysis, and asset generation.

## Editing Rules

Use the existing folder structure.

Do not introduce a database unless the project explicitly needs:

- Larger scale.
- Advanced querying.
- Stronger revision history.
- Multi-user editing.
- Cross-post analytics.

When changing strategy:

1. Archive the previous strategy version.
2. Update active files under `strategy/`.
3. Keep version and date at the top of strategy docs.

When changing UI behavior:

1. Update `ui/app.js`.
2. Update `ui/styles.css` if layout changes.
3. Update `server.mjs` only if persistence or backend actions are needed.
4. Run `npm run check`.

## Data Safety

Important source files:

- `ui/data/xhs-data.json`
- `content_pipeline/drafts/`
- `content_pipeline/templates/`
- `strategy/`
- `performance/post_metrics.csv`
- `performance/token_usage.csv`
- `trend_inbox/processed/`

Avoid overwriting user-created screenshots, drafts, or strategy files without archiving or confirming intent.

## Persistence Rule

Every real workflow change must be written back to files.

Do not rely on temporary browser state for operations decisions. If the user changes a topic status, adds a topic to Posts, selects a visual direction, or creates a generation task, the resulting state should be saved to the project files.

Current primary write target:

- `ui/data/xhs-data.json`

For long-form assets, also write or update the relevant Markdown file under:

- `content_pipeline/drafts/`
- `content_pipeline/templates/`

For each user question or project task, append a row to:

- `performance/token_usage.csv`

If exact token counts are not available from the runtime, write `unknown` for token fields and explain that limitation in `notes`.

## Adding A Topic

Preferred flow:

1. Add or process trend evidence.
2. Create a topic candidate in `ui/data/xhs-data.json`.
3. Set `status` to `funnel`.
4. Assign a numeric `priority`.
5. Link `sourceId` to a valid item in `topicSources`.

When the user selects it:

- Set `status` to `selected`.
- Add a post item to `posts`.
- Generate a brief Markdown file immediately.
- Link the brief through `assets.brief` and `sourceAssets.brief`.
- Keep the post status as `Added`.
- Set the next step to Generate Draft.

The UI Add button does this automatically when the backend is running.

Topic status is system-controlled in the UI. Users should use the `Action` column:

- `Add`: sets the topic to `selected` and creates the post draft record if needed.
- `Cancel`: sets the topic to `cancelled`.

## Cancelling A Post Draft

Use the Post Drafts table `Cancel` action when a selected topic should return to the topic funnel.

The backend should:

- Set the post draft status to `Archived`.
- Set the linked topic status back to `funnel`.
- Preserve existing brief, draft, review, visual, and image assets for traceability.
- Treat archived drafts as inactive when the same topic is added again later.

## Adding A Post Draft

Recommended files:

- `content_pipeline/drafts/YYYY-MM-DD_slug_brief.md`
- `content_pipeline/drafts/YYYY-MM-DD_slug_publish-copy.md`
- `content_pipeline/drafts/YYYY-MM-DD_slug_copy-review.md`
- `content_pipeline/drafts/YYYY-MM-DD_slug_visual-style-options.md`
- `content_pipeline/drafts/YYYY-MM-DD_slug_image-prompts.md`

Also add UI-readable copies under:

- `ui/data/pipeline/`

Then link them in the post object:

- `assets`
- `sourceAssets`

Use only these post status values:

- `Added`
- `Drafted`
- `Generate Image`
- `Ready`
- `Archived`

Do not use old internal status names such as `selected_topic`, `image_prompts_ready`, or `images_generated`.

## Common Validation

Run:

```bash
npm run check
```

This verifies:

- `ui/app.js` parses.
- `ui/data/xhs-data.json` is valid JSON.

For data changes, also check:

- Topics have `id`, `title`, `priority`, and `status`.
- Posts have `id`, `title`, `nextStep`, `assets`, and `sourceAssets`.
- Asset paths point to files that exist.

## When To Update Documentation

Update docs when changing:

- Workflow stages.
- Topic statuses.
- Data model fields.
- API routes.
- Storage locations.
- Image generation behavior.
- Strategy versioning rules.

Small visual tweaks usually do not need doc updates unless they change how a user works.
