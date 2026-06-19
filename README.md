# Not Long; Just Read

NLJR means **Not Long; Just Read**. It is a local-first daily reading and signal system for people who want a short daily brief without putting their source list, notes, or archive into a hosted app.

The intended user flow is simple:

1. Install the `not-long-just-read` skill in an AI coding agent such as Codex or Claude Code.
2. Ask the agent: "Set up NLJR for me."
3. The agent creates or checks the local files, generates the daily feed, and opens the local UI when needed.

## What This Stores

NLJR stores these files in your local workspace:

- `data/source-registry.json`: sources, URLs, tags, notes, priority, and source health.
- `data/nljr-article-ledger.json`: discovered direct articles and their processing status.
- `data/nljr-feed.json`: today's generated feed for the UI.
- `content_pipeline/nljr_archive/YYYY-MM-DD.md`: daily Markdown archive.
- `ui/`: local Web UI files.

NLJR does not require a hosted NLJR service. Your AI agent may still read and process these files according to the privacy policy of the agent provider you choose.

## Use With an Agent

Install or point your agent to:

```text
skills/not-long-just-read
```

Then ask:

```text
Use $not-long-just-read to set up NLJR in this workspace.
```

Useful follow-up prompts:

```text
Use $not-long-just-read to add this source to my registry: https://example.com/archive
Use $not-long-just-read to scan my subscriptions and generate today's NLJR feed.
Use $not-long-just-read to validate my NLJR files.
Use $not-long-just-read to open the local UI.
```

## Manual Commands

The skill is the primary interface, but the kit also works from a terminal:

```bash
python scripts/nljr.py validate
python scripts/nljr.py generate
python scripts/nljr.py serve
```

The local UI runs at:

```text
http://127.0.0.1:8765
```

## How Daily NLJR Works

1. Your agent reads active subscriptions.
2. It checks RSS feeds first and uses archive pages only to discover direct article links.
3. It compares every direct article URL with the local article ledger.
4. It adds genuinely new articles as `new`.
5. The generator selects up to three articles and marks them `processed`.
6. Processed URLs never appear again.

Subscriptions have two separate states:

- `status`: your control, using `active`, `paused`, or `archived`.
- `scanStatus`: system health, using `never_checked`, `healthy`, `no_new_posts`, or `error`.

Articles use `new`, `processed`, `skipped`, or `failed`. A source page or archive page is never itself an NLJR article.

## Repository Layout

```text
data/
  source-registry.json
  nljr-article-ledger.json
  nljr-feed.json
content_pipeline/
  nljr_archive/
scripts/
  nljr.py
skills/
  not-long-just-read/
ui/
  index.html
  styles.css
  app.js
```
