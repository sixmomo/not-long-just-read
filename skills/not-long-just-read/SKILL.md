---
name: not-long-just-read
description: Local-first Not Long; Just Read daily reading system for private source registries, local feed generation, archive writing, and optional local Web UI setup. Use when a user wants to set up NLJR, add or review sources, generate today's feed, validate NLJR files, open the local UI, explain stored data, or keep newsletter/research signals on their own machine or private repo.
---

# Not Long; Just Read

NLJR is a local-first daily reading operating system. Use the user's local files as the source of truth, generate a short daily brief, write a dated Markdown archive, and use the local Web UI only as a review and management surface.

## First Response

When a user asks to set up or use NLJR, start by explaining the data boundary in plain language:

> NLJR stores your source list, generated feed, and daily archive in this local workspace. NLJR does not require a hosted service. Your AI agent may still read and process these files according to the privacy policy of the agent provider you choose.

Then perform the requested action. Do not ask the user to manually edit JSON unless there is no safer local option.

## File Contract

Use these files in the NLJR workspace:

- `data/source-registry.json`: subscriptions, user-controlled status, scan health, URLs, and source confidence.
- `data/nljr-article-ledger.json`: direct article records and their lifecycle state.
- `data/nljr-feed.json`: current generated feed read by the UI.
- `content_pipeline/nljr_archive/YYYY-MM-DD.md`: dated daily archive written after generation.
- `ui/`: local-only Web UI that reads `data/nljr-feed.json` and `data/source-registry.json`.
- `server.mjs`: Node.js API and static file server.
- `scripts/refresh_nljr.js`: local Node.js scraper, generator, and validator.
- `scripts/test_nljr.js`: scraper unit tests.

Never store credentials in the registry. If a source requires a login or paid account, store only a human-readable note and ask the user before adding any sensitive detail.

## Common Workflows

### Set up NLJR

1. Locate the NLJR kit root. It should contain `server.mjs`, `data/`, `ui/`, and this `skills/not-long-just-read/` folder.
2. Run `node scripts/test_nljr.js` to validate that unit tests pass.
3. If files are missing, create them from the sample templates `data/*.json.example` or ask the user for the intended workspace folder.
4. Tell the user the local file paths where their data will be stored.

### Add a source

Directly read and modify `data/source-registry.json` to insert the new source into the `sources` array. You can use standard JSON parser tools:

```json
{
  "id": "subscription-anthropic-blog",
  "name": "Anthropic News & Research",
  "sourceMode": "subscription",
  "type": "website",
  "status": "active",
  "scanStatus": "never_checked",
  "lastError": "",
  "priority": "high",
  "relevance": ["Strategy"],
  "tags": ["AI Research"],
  "notes": "Anthropic announcements.",
  "url": "https://www.anthropic.com/news",
  "feedUrl": "https://www.anthropic.com/index.xml",
  "fetchMethod": "rss"
}
```

If the URL is unknown, add the source with `sourceConfidence` set to `needs_url_confirmation` and explain that it will be skipped by automated generation until confirmed.

### Scan subscriptions and generate today's feed

1. Read active subscriptions from `data/source-registry.json`.
2. Run the Node.js scraper to fetch actual posts, check RSS/Atom links, download new posts, and compile the feed:
   ```bash
   node scripts/refresh_nljr.js
   ```
3. The scraper will automatically update `data/nljr-feed.json`, `data/nljr-article-ledger.json`, `data/source-registry.json`, and write a daily Markdown archive in `content_pipeline/nljr_archive/YYYY-MM-DD.md`.
4. Report the generated date, item count, archive path, and any source health issues.

### Open the local UI

Run the Node server:

```bash
node server.mjs
```

Then give the user the local URL (http://127.0.0.1:8765) printed by the command. The UI is local and reads/writes the files in the workspace through the local server.

## Generation Rules

- Include up to 3 direct articles from the ledger with status `new`.
- Select higher-priority articles first, then newer articles.
- Mark selected articles `processed` with `processedAt` and `includedIn`.
- Never select an article whose direct URL already exists in the ledger.
- Never turn a subscription homepage, RSS URL, or archive page into a feed item.
- Keep source `status` separate from system-owned `scanStatus`.
- Write `no_new_posts` with an empty item list when a completed scan finds nothing.
- Always write both `data/nljr-feed.json` and `content_pipeline/nljr_archive/YYYY-MM-DD.md`.

## User-Facing Tone

Assume the user is non-technical. Use phrases like "I set up your local NLJR folder" and "Your source list is stored here" instead of implementation jargon. Keep file names visible for trust, but do not require the user to understand them.

For detailed schema and privacy language, read `references/data-boundaries.md`.
