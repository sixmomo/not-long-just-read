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

- `data/source-registry.json`: source list, source status, priority, tags, notes, URLs, and source confidence.
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
python scripts/nljr.py add-source --name "Source Name" --url "https://example.com" --archive-url "https://example.com/archive" --priority high --tags "ai,product"
```

If the URL is unknown, add the source with `sourceConfidence` set to `needs_url_confirmation` and explain that it will be skipped by automated generation until confirmed.

### Generate today's feed

Run:

```bash
python scripts/nljr.py generate
```

Then validate:

```bash
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

- Include up to 3 items.
- Prefer active manual inbox items with URLs, then active verified archive sources, then active keyword watches.
- Skip archived sources.
- Skip sources with `sourceConfidence` containing `needs` from automated generation, and include them in source health.
- Always write both `data/nljr-feed.json` and `content_pipeline/nljr_archive/YYYY-MM-DD.md`.

## User-Facing Tone

Assume the user is non-technical. Use phrases like "I set up your local NLJR folder" and "Your source list is stored here" instead of implementation jargon. Keep file names visible for trust, but do not require the user to understand them.

For detailed schema and privacy language, read `references/data-boundaries.md`.
