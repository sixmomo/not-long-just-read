# Codex To Antigravity Handoff

Date: 2026-06-23

## Project Snapshot

This repo is `xhs-ops-codex`, a local-first operating system for momo's Xiaohongshu and LinkedIn content workflows. It combines strategy docs, Markdown content artifacts, structured JSON/CSV state, and a lightweight local web UI.

The app is intentionally file-backed. Treat repo files as the source of truth; there is no database layer right now.

## Recommended Entry Points

Read these first:

- `README.md` for product shape, runtime commands, and documentation map.
- `CLAUDE.md` for the current agent-oriented project guide.
- `docs/architecture.md` for server, API, and file boundaries.
- `docs/data_model.md` for structured state ownership.
- `docs/workflows.md` for topic, post, visual, image, trend, and NLJR rules.

For UI work:

- `ui/index.html`
- `ui/app.js`
- `ui/styles.css`
- `ui/data/xhs-data.json`

For backend/write behavior:

- `server.mjs`
- `scripts/local_test_server.py`

## How To Run

From the repository root:

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:5177/ui/index.html
```

Backend health check:

```text
http://127.0.0.1:5177/api/health
```

Fallback server:

```bash
npm run dev:fallback
```

Basic validation:

```bash
npm run check
```

The Node server is the primary runtime. The Python server is only a fallback and should remain behaviorally compatible for supported routes.

## Implementation Guardrails

- Keep changes small and grounded in the existing file-backed architecture.
- Do not introduce fake metrics, fake posts, or generic filler data.
- Persist real workflow changes to their owning files.
- Preserve stable IDs and cross-file references.
- Keep canonical templates under `content_pipeline/templates/` synchronized with browser-readable template copies under `ui/data/templates/` when template behavior changes.
- Do not treat `not-long-just-read/` as the parent app unless the task explicitly targets the standalone NLJR package.
- If port `5177` is busy, identify the owning process before restarting anything.
- If UI behavior changes, verify both the page and the related API route.

## Current Known Runtime Note

Codex recently verified the local app through the Node server:

- Frontend: `http://127.0.0.1:5177/ui/index.html`
- Backend: `http://127.0.0.1:5177/api/health`
- Health response: `"ok": true`
- Logs: `.run/server.stdout.log` and `.run/server.stderr.log`

That was a live check during the current setup session, but it should be refreshed before depending on it.

## Good First Checks

1. Confirm the health endpoint answers.
2. Run `npm run check`.
3. Inspect the target data file before editing.
4. For frontend changes, verify the app still loads from `/ui/index.html`.
5. For backend changes, verify the specific `/api/*` route involved.

## Collaboration Note

If handing work back to Codex or Claude, write a short update in `handoff/` with:

- Goal
- Files touched
- What was verified
- What remains risky or unfinished
