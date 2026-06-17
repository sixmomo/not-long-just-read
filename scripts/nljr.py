#!/usr/bin/env python3
"""Local NLJR generator, validator, source helper, and UI server."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
REGISTRY_PATH = DATA_DIR / "source-registry.json"
FEED_PATH = DATA_DIR / "nljr-feed.json"
ARCHIVE_DIR = ROOT / "content_pipeline" / "nljr_archive"


def read_json(path: Path, fallback: dict) -> dict:
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def today() -> str:
    return dt.datetime.now().date().isoformat()


def now_utc() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:80] or "source"


def source_url(source: dict) -> str:
    return source.get("url") or source.get("archiveUrl") or source.get("homepageUrl") or ""


def source_name(source: dict) -> str:
    return source.get("sourceName") or source.get("publicationName") or source.get("name") or "Source"


def item_from_source(source: dict, date: str, index: int) -> dict:
    is_manual = source.get("sourceMode") == "manual_inbox"
    title = source.get("name") if is_manual else "Archive scan ready"
    url = source_url(source)
    summary = source.get("notes") or "Source captured for today's NLJR review."
    if not is_manual and source.get("archiveUrl"):
        summary = f"Use the public archive source for today's scan: {source.get('archiveUrl')}"
    return {
        "id": f"{date}-{source.get('id') or slugify(source.get('name', 'source'))}-{index + 1}",
        "sourceId": source.get("id"),
        "sourceName": source_name(source),
        "title": title,
        "url": url,
        "publishedAt": source.get("publishedAt", ""),
        "summary": summary,
        "whyItMatters": "This was explicitly added as a manual signal." if is_manual else "This verified source is ready for recurring NLJR scanning.",
        "relevance": source.get("relevance", []),
        "suggestedUse": ["Topic seed", "Strategy signal"],
        "topicAngle": source.get("notes") or "Review this source for useful daily signals.",
        "priority": source.get("priority") or "medium",
    }


def build_markdown(today_feed: dict) -> str:
    lines = [
        f"# NLJR Daily Feed - {today_feed.get('date', '')}",
        "",
        f"Generated at: {today_feed.get('generatedAt', '')}",
        "",
        "## Top Signals",
        "",
    ]
    items = today_feed.get("items", [])
    if not items:
        lines.extend(["No NLJR items generated.", ""])
    for index, item in enumerate(items, start=1):
        lines.extend(
            [
                f"### {index}. {item.get('title', 'Untitled signal')}",
                "",
                f"Source: {item.get('sourceName', 'Source')}",
                f"URL: {item.get('url', '')}",
                "",
                "#### Summary",
                "",
                item.get("summary", ""),
                "",
                "#### Why It Matters",
                "",
                item.get("whyItMatters", ""),
                "",
                "#### Suggested Use",
                "",
                ", ".join(item.get("suggestedUse", [])),
                "",
                "#### Topic Angle",
                "",
                item.get("topicAngle", ""),
                "",
            ]
        )
    health = today_feed.get("sourceHealth", {})
    lines.extend(
        [
            "## Source Health",
            "",
            f"- Active sources: {health.get('activeSources', 0)}",
            f"- Verified archive sources: {health.get('verifiedArchiveSources', 0)}",
            f"- Need URL confirmation: {health.get('needsUrlConfirmation', 0)}",
            f"- Adhoc items: {health.get('adhocItems', 0)}",
            f"- Keyword watches: {health.get('keywordWatches', 0)}",
            "",
        ]
    )
    skipped = health.get("skippedSources", [])
    if skipped:
        lines.extend(["## Skipped Sources", ""])
        for source in skipped:
            lines.append(f"- {source.get('name', 'Source')}: {source.get('reason', '')}")
        lines.append("")
    return "\n".join(lines)


def generate() -> dict:
    registry = read_json(REGISTRY_PATH, {"meta": {}, "sources": []})
    existing_feed = read_json(FEED_PATH, {"archive": []})
    date = today()
    generated_at = now_utc()
    active_sources = [source for source in registry.get("sources", []) if source.get("status") != "archived"]
    adhocs = [source for source in active_sources if source.get("sourceMode") == "manual_inbox" and source_url(source)]
    verified_archives = [
        source
        for source in active_sources
        if source.get("sourceMode") == "subscription"
        and source.get("sourceConfidence") == "verified_archive"
        and source.get("archiveUrl")
    ]
    keyword_watches = [source for source in active_sources if source.get("sourceMode") == "keyword_watch"]
    needs_url = [source for source in active_sources if "needs" in str(source.get("sourceConfidence") or "")]
    priority_rank = {"high": 0, "medium": 1, "low": 2}
    source_pool = sorted([*adhocs, *verified_archives, *keyword_watches], key=lambda source: priority_rank.get(source.get("priority"), 9))
    items = [item_from_source(source, date, index) for index, source in enumerate(source_pool[:3])]
    today_feed = {
        "date": date,
        "status": "generated",
        "generatedAt": generated_at,
        "items": items,
        "sourceHealth": {
            "activeSources": len(active_sources),
            "verifiedArchiveSources": len(verified_archives),
            "needsUrlConfirmation": len(needs_url),
            "adhocItems": len(adhocs),
            "keywordWatches": len(keyword_watches),
            "skippedSources": [
                {
                    "sourceId": source.get("id"),
                    "name": source.get("name"),
                    "reason": "URL/archive needs confirmation before automated scanning.",
                }
                for source in needs_url
            ],
        },
    }
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    archive_path = ARCHIVE_DIR / f"{date}.md"
    archive_path.write_text(build_markdown(today_feed), encoding="utf-8")
    archive_entry = {
        "date": date,
        "path": str(archive_path.relative_to(ROOT)).replace("\\", "/"),
        "itemCount": len(items),
        "generatedAt": generated_at,
        "summary": ", ".join(item.get("sourceName") or "" for item in items) or "No NLJR items generated.",
    }
    archive = [archive_entry] + [entry for entry in existing_feed.get("archive", []) if entry.get("date") != date]
    data = {"today": today_feed, "archive": archive}
    write_json(FEED_PATH, data)
    return {"ok": True, "data": data, "archivePath": archive_entry["path"]}


def validate() -> dict:
    registry = read_json(REGISTRY_PATH, {"sources": []})
    feed = read_json(FEED_PATH, {})
    today_feed = feed.get("today", {})
    items = today_feed.get("items", [])
    archive_path = ""
    archive_exists = False
    if feed.get("archive"):
        archive_path = feed["archive"][0].get("path", "")
        archive_exists = bool(archive_path and (ROOT / archive_path).exists())
    result = {
        "ok": True,
        "sourceCount": len(registry.get("sources", [])),
        "todayDate": today_feed.get("date", ""),
        "itemCount": len(items),
        "itemLimitOk": len(items) <= 3,
        "archivePath": archive_path,
        "archiveExists": archive_exists,
    }
    if len(items) > 3:
        result["ok"] = False
    return result


def add_source(args: argparse.Namespace) -> dict:
    registry = read_json(REGISTRY_PATH, {"meta": {"name": "NLJR Source Registry"}, "sources": []})
    name = args.name.strip()
    source_id = args.id or f"source-{slugify(name)}"
    source = {
        "id": source_id,
        "name": name,
        "sourceMode": args.mode,
        "type": args.type,
        "status": "active",
        "priority": args.priority,
        "relevance": split_csv(args.relevance),
        "tags": split_csv(args.tags),
        "notes": args.notes or "Added locally by NLJR.",
        "url": args.url or "",
        "archiveUrl": args.archive_url or "",
        "sourceConfidence": args.confidence or ("verified_archive" if args.archive_url else "needs_url_confirmation"),
    }
    registry["sources"] = [source] + [existing for existing in registry.get("sources", []) if existing.get("id") != source_id]
    registry.setdefault("meta", {})["updatedAt"] = today()
    write_json(REGISTRY_PATH, registry)
    return {"ok": True, "source": source}


def split_csv(value: str) -> list[str]:
    return [part.strip() for part in (value or "").split(",") if part.strip()]


class NLJRHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format: str, *args) -> None:
        return

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/":
            self.path = "/ui/index.html"
            return super().do_GET()
        if parsed.path == "/api/source-registry":
            return self.send_json(read_json(REGISTRY_PATH, {"meta": {}, "sources": []}))
        if parsed.path == "/api/nljr-feed":
            return self.send_json(read_json(FEED_PATH, {"today": {}, "archive": []}))
        return super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/nljr-feed/generate":
            return self.send_json(generate())
        self.send_error(404)

    def send_json(self, data: dict) -> None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def serve(args: argparse.Namespace) -> None:
    server = ThreadingHTTPServer((args.host, args.port), NLJRHandler)
    print(f"NLJR local UI: http://{args.host}:{args.port}")
    print("Press Ctrl+C to stop.")
    server.serve_forever()


def main() -> None:
    parser = argparse.ArgumentParser(description="NLJR local-first toolkit")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("generate")
    subparsers.add_parser("validate")
    serve_parser = subparsers.add_parser("serve")
    serve_parser.add_argument("--host", default="127.0.0.1")
    serve_parser.add_argument("--port", default=8765, type=int)
    add_parser = subparsers.add_parser("add-source")
    add_parser.add_argument("--name", required=True)
    add_parser.add_argument("--url", default="")
    add_parser.add_argument("--archive-url", default="")
    add_parser.add_argument("--priority", choices=["high", "medium", "low"], default="medium")
    add_parser.add_argument("--tags", default="")
    add_parser.add_argument("--relevance", default="Strategy")
    add_parser.add_argument("--notes", default="")
    add_parser.add_argument("--mode", default="subscription")
    add_parser.add_argument("--type", default="newsletter")
    add_parser.add_argument("--confidence", default="")
    add_parser.add_argument("--id", default="")
    args = parser.parse_args()
    if args.command == "generate":
        print(json.dumps(generate(), indent=2, ensure_ascii=False))
    elif args.command == "validate":
        result = validate()
        print(json.dumps(result, indent=2, ensure_ascii=False))
        if not result["ok"]:
            raise SystemExit(1)
    elif args.command == "add-source":
        print(json.dumps(add_source(args), indent=2, ensure_ascii=False))
    elif args.command == "serve":
        serve(args)


if __name__ == "__main__":
    main()
