# XHS Ops Codex

This project is a local operating system for one Xiaohongshu account: `momo`, a North America AI PM transition and AI portfolio coaching persona.

It is not a generic content archive. It is designed to help plan topics, draft posts, generate visual directions, prepare image prompts, track performance, and run weekly strategy pivots.

## Current Product Shape

The project has two connected surfaces:

- A strategy and content folder system made of Markdown, CSV, screenshots, and generated assets.
- A lightweight local web UI served by Node.js.

The web UI now has two first-level workspaces:

- `XHS Ops`: the original Xiaohongshu operating system. Its pages live as second-level pages: Home, Strategy, Page Styles, Topics, and Posts.
- `LinkedIn Ops`: an English-only LinkedIn operating system modeled after XHS Ops. It targets non-technical business owners who need AI Ops systems and practical AI products. Its workflow is text-first and does not include image generation.

There is no database right now. The app uses files as the source of truth:

- Main UI data snapshot: `ui/data/xhs-data.json`
- Draft bodies: `content_pipeline/drafts/`
- Reusable templates: `content_pipeline/templates/`
- Screenshot trend signals: `trend_inbox/processed/`
- Performance metrics: `performance/post_metrics.csv`

## Daily NLJR

NLJR has two reading levels:

- Home shows the three highest-ranked recommendations with full analysis.
- `#home/nljr-day/YYYY-MM-DD` shows the complete dated edition: the same three
  deep recommendations plus up to seven concise new-feed items.

The daily automation may publish fewer than ten items when not enough readable,
relevant, and non-duplicate sources qualify.

## North Star

The account optimizes for this sequence:

1. Test commercial topic potential.
2. Build the North America AI PM coach persona.
3. Improve save rate and content usefulness.
4. Grow followers.
5. Drive coaching and consulting leads.
6. Rebuild a consistent publishing rhythm.

Every post should help answer:

> Would this help a Chinese-speaking North America professional move closer to an AI PM offer through better positioning, a stronger AI project, or better interview preparation?

## Main Workflow

The workflow has two layers.

Reusable template layer:

1. Brief Template
2. Carousel Script Template
3. Visual Style Options Template
4. Image Prompts Template

Individual post layer:

1. Topic
2. Brief
3. Generate Copy
4. Review Copy
5. Visual Direction
6. Image Prompts
7. Images
8. Publish

## Running Frontend And Backend

This project currently uses one local Node server for both frontend and backend:

- Frontend: serves `ui/index.html`, `ui/app.js`, `ui/styles.css`, and static data/assets.
- Backend: serves `/api/*` routes and writes workflow changes back to project files.

Start the local server from the project root:

```bash
npm run dev
```

Then open the frontend UI:

```text
http://127.0.0.1:5177/ui/index.html
```

From another device on the same trusted LAN/Wi-Fi, use:

```text
http://<your-lan-ip>:5177/ui/index.html
```

Both the Node server and the fallback server listen on `0.0.0.0` so LAN devices can reach them. If another device cannot open the URL, allow inbound TCP traffic for port `5177` in Windows Firewall.

Check whether the backend is running:

```text
http://127.0.0.1:5177/api/health
```

Expected response:

```json
{
  "ok": true
}
```

If port `5177` is busy, start on another port:

```bash
PORT=5180 npm run dev
```

Then open:

```text
http://127.0.0.1:5180/ui/index.html
```

To run a basic validation:

```bash
npm run check
```

To run the unit tests:

```bash
node scripts/test_nljr.js
```

To run a manual dry-run feed refresh scan (CLI):

```bash
node scripts/refresh_nljr.js --dry-run
```

To run a manual feed refresh scan (writes to files):

```bash
node scripts/refresh_nljr.js
```

Important: real workflow actions such as changing topic status, adding a topic to Posts, or refreshing the NLJR feeds only persist when the Node server is running.

To allow Windows Firewall from an Administrator terminal:

```powershell
netsh advfirewall firewall add rule name="XHS Ops 5177" dir=in action=allow protocol=TCP localport=5177 profile=private
```

## Documentation Map

- `docs/business_requirements.md`: what the product is supposed to do and why.
- `docs/architecture.md`: how the local UI, Node server, files, and API routes fit together.
- `docs/data_model.md`: current data structures and where each type of content lives.
- `docs/workflows.md`: topic, post, visual, image, trend, and weekly pivot logic.
- `docs/contributor_guide.md`: how a new collaborator should safely work in this folder.

## Important Current Constraint

This is intentionally local-first and file-first. That makes it transparent and easy to work with in Codex. If topics, drafts, metrics, and generated assets become large or need stronger query/history behavior, the natural next step is SQLite.
