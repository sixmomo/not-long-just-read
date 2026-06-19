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
- `scripts/nljr.py`: local generator, validator, source helper, and dev server.

Never store credentials in the registry. If a source requires a login or paid account, store only a human-readable note and ask the user before adding any sensitive detail.

## Common Workflows

### Set up NLJR

1. Locate the NLJR kit root. It should contain `scripts/nljr.py`, `data/`, `ui/`, and this `skills/not-long-just-read/` folder.
2. Run `python scripts/nljr.py validate`.
3. If files are missing, create them from the kit defaults or ask the user for the intended workspace folder.
4. Tell the user the local file paths where their data will be stored.

### Add a source

Use the script instead of editing JSON by hand when possible:

```bash
python scripts/nljr.py add-source --name "Source Name" --url "https://example.com" --feed-url "https://example.com/feed" --archive-url "https://example.com/archive" --priority high --tags "ai,product"
```

If the URL is unknown, add the source with `sourceConfidence` set to `needs_url_confirmation` and explain that it will be skipped by automated generation until confirmed.

### Scan subscriptions and generate today's feed

1. Read active subscriptions from `data/source-registry.json`.
2. Fetch actual posts published since the previous successful check. Prefer RSS or another structured feed. Use an archive page only to discover direct article URLs.
3. Normalize each direct article URL and compare it with the complete article ledger.
4. Ignore URLs already recorded in any lifecycle state. Never create duplicate ledger entries.
5. Read and summarize genuinely new articles.
6. Add each discovery through:

```bash
python scripts/nljr.py add-article --source-id "source-id" --source-name "Source Name" --title "Direct article title" --url "https://example.com/p/article" --published-at "YYYY-MM-DD" --summary "..." --why-it-matters "..." --topic-angle "..." --priority high
```

7. Record the source scan result:

```bash
python scripts/nljr.py record-scan --source-id "source-id" --status healthy --last-item-seen "https://example.com/p/article"
```

Use `no_new_posts` when a scan succeeds without discoveries. Use `error` with `--error` when it fails.

8. Generate and validate:

```bash
python scripts/nljr.py generate
python scripts/nljr.py validate
```

Report the generated date, item count, archive path, and any source health issues.

### Open the local UI

Run:

```bash
python scripts/nljr.py serve
```

Then give the user the local URL printed by the command. The UI is local and reads/writes the files in the workspace through the local server.

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
