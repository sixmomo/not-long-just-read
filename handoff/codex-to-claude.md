# Codex To Claude Handoff

Date: 2026-06-23

## Current Context

This repo is `xhs-ops-codex`, a local-first content operations system for momo's Xiaohongshu and LinkedIn workflows. The main app is file-backed: there is no database, and project files are the source of truth.

Start by reading `CLAUDE.md`. It is the intended Claude Code entrypoint and points to the required reading order:

1. `README.md`
2. `VISION.md`
3. `docs/business_requirements.md`
4. `docs/architecture.md`
5. `docs/data_model.md`
6. `docs/workflows.md`
7. `docs/contributor_guide.md`

For content or positioning decisions, also read the relevant files under `strategy/`.

## Runtime Shape

The project currently uses one Node server for both frontend and backend.

- Frontend: `ui/index.html`, `ui/app.js`, `ui/styles.css`, static data/assets.
- Backend: `server.mjs`, serving `/api/*` routes and persisting workflow changes back to files.
- Primary command: `npm run dev`
- Frontend URL: `http://127.0.0.1:5177/ui/index.html`
- Backend health URL: `http://127.0.0.1:5177/api/health`
- Fallback command: `npm run dev:fallback`
- Basic validation: `npm run check`

If the server is already running, prefer checking `/api/health` before restarting it. If the port is stale or hung, stop only the process owning port `5177`.

## Important Project Rules

- Preserve unrelated user changes.
- Do not invent fake dashboard data or placeholder metrics.
- Persist workflow actions to the owning file; UI-only state is not enough.
- `ui/data/xhs-data.json` owns most XHS workflow state.
- `ui/data/source-registry.json`, `ui/data/nljr-feed.json`, and `ui/data/nljr-article-ledger.json` own NLJR state.
- Direct article URL is the NLJR deduplication key.
- Home shows only the three IDs in `today.recommendedItemIds`.
- The dated NLJR page can show up to ten ranked items, but should not be padded with weak material.
- `not-long-just-read/` is a separate portable package; do not confuse its `data/` files with the live parent app files under `ui/data/`.

## Recent Codex Work

Codex helped get GitHub CLI located and explained that `gh.exe` is installed at:

```text
C:\Program Files\GitHub CLI\gh.exe
```

If `gh` is not recognized in PowerShell, use the full executable path or add `C:\Program Files\GitHub CLI` to the Windows PATH.

Codex also started the local app server successfully. The last verified runtime state was:

- Frontend responded at `http://127.0.0.1:5177/ui/index.html`
- Backend responded at `http://127.0.0.1:5177/api/health`
- Health payload included `"ok": true`
- Server logs were written under `.run/`

This state may be stale if the machine was restarted or the hidden server process exited.

## Suggested Next Step For Claude

1. Read `CLAUDE.md`.
2. Check whether the local server still answers `/api/health`.
3. Run `npm run check` before making behavior changes.
4. For any UI or workflow change, update the relevant source-of-truth doc if behavior changes.
5. Leave a short note in this `handoff/` folder if handing work back to Codex or another agent.
