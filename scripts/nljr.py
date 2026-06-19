#!/usr/bin/env python3
"""Local NLJR generator, validator, source helper, and UI server."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlparse

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
REGISTRY_PATH = DATA_DIR / "source-registry.json"
LEDGER_PATH = DATA_DIR / "nljr-article-ledger.json"
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
    slug = re.sub(r"[^a-z0-9]+", "-", str(value).lower()).strip("-")
    return slug[:80] or "item"


def split_csv(value: str) -> list[str]:
    return [part.strip() for part in (value or "").split(",") if part.strip()]


def normalize_url(value: str) -> str:
    parsed = urlparse((value or "").strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return ""
    path = parsed.path.rstrip("/") or "/"
    tracking_keys = {"fbclid", "gclid", "ref", "source"}
    query = urlencode(
        [
            (key, item)
            for key, item in parse_qsl(parsed.query, keep_blank_values=True)
            if not key.lower().startswith("utm_") and key.lower() not in tracking_keys
        ]
    )
    return parsed._replace(
        netloc=parsed.netloc.lower(),
        path=path,
        query=query,
        fragment="",
    ).geturl()


def read_ledger() -> dict:
    return read_json(
        LEDGER_PATH,
        {
            "meta": {
                "name": "NLJR Article Ledger",
                "description": "Tracks direct article URLs so processed items never appear again.",
                "updatedAt": "",
            },
            "articles": [],
        },
    )


def write_ledger(ledger: dict) -> None:
    ledger.setdefault("meta", {})["updatedAt"] = today()
    ledger["meta"].setdefault("name", "NLJR Article Ledger")
    ledger["meta"].setdefault(
        "description",
        "Tracks direct article URLs so processed items never appear again.",
    )
    ledger.setdefault("articles", [])
    write_json(LEDGER_PATH, ledger)


def item_from_article(article: dict, source: dict, date: str, index: int) -> dict:
    return {
        "id": f"{date}-{slugify(article.get('id') or article.get('title') or article.get('url'))}-{index + 1}",
        "articleId": article.get("id"),
        "sourceId": article.get("sourceId"),
        "sourceName": article.get("sourceName") or source.get("name") or "Unknown source",
        "title": article.get("title") or "Untitled article",
        "url": article.get("url") or "",
        "publishedAt": article.get("publishedAt") or "",
        "summary": article.get("summary") or "",
        "whyItMatters": article.get("whyItMatters") or "",
        "relevance": article.get("relevance") or source.get("relevance") or [],
        "suggestedUse": article.get("suggestedUse") or ["Topic seed", "Strategy signal"],
        "topicAngle": article.get("topicAngle") or "",
        "priority": article.get("priority") or source.get("priority") or "medium",
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
        lines.extend(["No new qualifying posts were found.", ""])
    for index, item in enumerate(items, start=1):
        lines.extend(
            [
                f"### {index}. {item.get('title', 'Untitled article')}",
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
            f"- Active subscriptions: {health.get('activeSubscriptions', 0)}",
            f"- Need URL confirmation: {health.get('needsUrlConfirmation', 0)}",
            f"- Keyword watches: {health.get('keywordWatches', 0)}",
            f"- New articles available: {health.get('newArticlesAvailable', 0)}",
            f"- Processed articles: {health.get('processedArticles', 0)}",
            "",
            "## Skipped Sources",
            "",
        ]
    )
    skipped = health.get("skippedSources", [])
    lines.extend(
        [f"- {source.get('name', 'Source')}: {source.get('reason', '')}" for source in skipped]
        or ["- None"]
    )
    lines.append("")
    return "\n".join(lines)


def generate() -> dict:
    registry = read_json(REGISTRY_PATH, {"meta": {}, "sources": []})
    existing_feed = read_json(FEED_PATH, {"archive": []})
    ledger = read_ledger()
    date = today()
    generated_at = now_utc()
    active_sources = [
        source for source in registry.get("sources", []) if source.get("status") == "active"
    ]
    subscriptions = [
        source for source in active_sources if source.get("sourceMode") == "subscription"
    ]
    keyword_watches = [
        source for source in active_sources if source.get("sourceMode") == "keyword_watch"
    ]
    needs_url = [
        source
        for source in active_sources
        if "needs" in str(source.get("sourceConfidence") or "")
    ]
    source_by_id = {source.get("id"): source for source in registry.get("sources", [])}
    priority_rank = {"high": 0, "medium": 1, "low": 2}
    eligible_articles = [
        article
        for article in ledger.get("articles", [])
        if article.get("status") == "new" and normalize_url(article.get("url", ""))
    ]
    eligible_articles.sort(
        key=lambda article: str(
            article.get("publishedAt") or article.get("discoveredAt") or ""
        ),
        reverse=True,
    )
    eligible_articles.sort(
        key=lambda article: priority_rank.get(article.get("priority"), 9)
    )
    selected_articles = eligible_articles[:3]
    items = [
        item_from_article(
            article,
            source_by_id.get(article.get("sourceId"), {}),
            date,
            index,
        )
        for index, article in enumerate(selected_articles)
    ]
    selected_ids = {article.get("id") for article in selected_articles}
    for article in ledger.get("articles", []):
        if article.get("id") in selected_ids:
            article["status"] = "processed"
            article["processedAt"] = generated_at
            article["includedIn"] = date
    write_ledger(ledger)
    today_feed = {
        "date": date,
        "status": "generated" if items else "no_new_posts",
        "generatedAt": generated_at,
        "items": items,
        "sourceHealth": {
            "activeSources": len(active_sources),
            "activeSubscriptions": len(subscriptions),
            "needsUrlConfirmation": len(needs_url),
            "keywordWatches": len(keyword_watches),
            "newArticlesAvailable": len(
                [
                    article
                    for article in ledger.get("articles", [])
                    if article.get("status") == "new"
                ]
            ),
            "processedArticles": len(
                [
                    article
                    for article in ledger.get("articles", [])
                    if article.get("status") == "processed"
                ]
            ),
            "skippedSources": [
                {
                    "sourceId": source.get("id"),
                    "name": source.get("name"),
                    "reason": "URL/feed needs confirmation before automated scanning.",
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
        "summary": ", ".join(item.get("sourceName") or "" for item in items)
        or "No new qualifying posts.",
    }
    archive = [archive_entry] + [
        entry for entry in existing_feed.get("archive", []) if entry.get("date") != date
    ]
    data = {"today": today_feed, "archive": archive}
    write_json(FEED_PATH, data)
    return {"ok": True, "data": data, "archivePath": archive_entry["path"]}


def validate() -> dict:
    registry = read_json(REGISTRY_PATH, {"sources": []})
    ledger = read_ledger()
    feed = read_json(FEED_PATH, {})
    today_feed = feed.get("today", {})
    items = today_feed.get("items", [])
    archive_path = feed.get("archive", [{}])[0].get("path", "") if feed.get("archive") else ""
    archive_exists = bool(archive_path and (ROOT / archive_path).exists())
    article_urls = [
        normalize_url(article.get("url", "")) for article in ledger.get("articles", [])
    ]
    article_urls = [url for url in article_urls if url]
    duplicate_urls = sorted({url for url in article_urls if article_urls.count(url) > 1})
    archive_urls = {
        normalize_url(source.get("archiveUrl", ""))
        for source in registry.get("sources", [])
        if source.get("archiveUrl")
    }
    placeholder_items = [
        item.get("id")
        for item in items
        if item.get("title") == "Archive scan ready"
        or normalize_url(item.get("url", "")) in archive_urls
    ]
    result = {
        "ok": len(items) <= 3 and not duplicate_urls and not placeholder_items,
        "sourceCount": len(registry.get("sources", [])),
        "articleCount": len(ledger.get("articles", [])),
        "todayDate": today_feed.get("date", ""),
        "todayStatus": today_feed.get("status", ""),
        "itemCount": len(items),
        "itemLimitOk": len(items) <= 3,
        "duplicateArticleUrls": duplicate_urls,
        "placeholderItems": placeholder_items,
        "archivePath": archive_path,
        "archiveExists": archive_exists,
    }
    return result


def add_source(args: argparse.Namespace) -> dict:
    registry = read_json(
        REGISTRY_PATH,
        {"meta": {"name": "NLJR Source Registry"}, "sources": []},
    )
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
        "feedUrl": args.feed_url or "",
        "archiveUrl": args.archive_url or "",
        "sourceConfidence": args.confidence
        or ("verified_archive" if args.feed_url or args.archive_url else "needs_url_confirmation"),
        "scanStatus": "never_checked" if args.mode == "subscription" else "",
        "lastCheckedAt": "",
        "lastItemSeen": "",
        "lastError": "",
    }
    registry["sources"] = [
        source,
        *[
            existing
            for existing in registry.get("sources", [])
            if existing.get("id") != source_id
        ],
    ]
    registry.setdefault("meta", {})["updatedAt"] = today()
    write_json(REGISTRY_PATH, registry)
    return {"ok": True, "source": source}


def add_article(args: argparse.Namespace) -> dict:
    ledger = read_ledger()
    url = normalize_url(args.url)
    if not url:
        return {"ok": False, "error": "A direct http(s) article URL is required."}
    existing = next(
        (
            article
            for article in ledger.get("articles", [])
            if normalize_url(article.get("url", "")) == url
        ),
        None,
    )
    if existing:
        return {"ok": True, "duplicate": True, "article": existing}
    url_fingerprint = hashlib.sha1(url.encode("utf-8")).hexdigest()[:10]
    article = {
        "id": args.id or f"article-{slugify(args.title)}-{url_fingerprint}",
        "sourceId": args.source_id,
        "sourceName": args.source_name,
        "title": args.title,
        "url": url,
        "publishedAt": args.published_at,
        "discoveredAt": now_utc(),
        "summary": args.summary,
        "whyItMatters": args.why_it_matters,
        "topicAngle": args.topic_angle,
        "relevance": split_csv(args.relevance),
        "suggestedUse": split_csv(args.suggested_use)
        or ["Topic seed", "Strategy signal"],
        "priority": args.priority,
        "status": args.status,
    }
    ledger["articles"] = [article, *ledger.get("articles", [])]
    write_ledger(ledger)
    return {"ok": True, "duplicate": False, "article": article}


def record_scan(args: argparse.Namespace) -> dict:
    registry = read_json(
        REGISTRY_PATH,
        {"meta": {"name": "NLJR Source Registry"}, "sources": []},
    )
    source = next(
        (
            item
            for item in registry.get("sources", [])
            if item.get("id") == args.source_id
        ),
        None,
    )
    if not source:
        return {"ok": False, "error": f"Source not found: {args.source_id}"}
    source["scanStatus"] = args.status
    source["lastCheckedAt"] = now_utc()
    source["lastItemSeen"] = args.last_item_seen
    source["lastError"] = args.error if args.status == "error" else ""
    registry.setdefault("meta", {})["updatedAt"] = today()
    write_json(REGISTRY_PATH, registry)
    return {"ok": True, "source": source}


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
        if parsed.path == "/api/nljr-article-ledger":
            return self.send_json(read_ledger())
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
    add_parser.add_argument("--feed-url", default="")
    add_parser.add_argument("--archive-url", default="")
    add_parser.add_argument("--priority", choices=["high", "medium", "low"], default="medium")
    add_parser.add_argument("--tags", default="")
    add_parser.add_argument("--relevance", default="Strategy")
    add_parser.add_argument("--notes", default="")
    add_parser.add_argument("--mode", default="subscription")
    add_parser.add_argument("--type", default="newsletter")
    add_parser.add_argument("--confidence", default="")
    add_parser.add_argument("--id", default="")

    article_parser = subparsers.add_parser("add-article")
    article_parser.add_argument("--source-id", required=True)
    article_parser.add_argument("--source-name", required=True)
    article_parser.add_argument("--title", required=True)
    article_parser.add_argument("--url", required=True)
    article_parser.add_argument("--published-at", default="")
    article_parser.add_argument("--summary", required=True)
    article_parser.add_argument("--why-it-matters", required=True)
    article_parser.add_argument("--topic-angle", required=True)
    article_parser.add_argument("--relevance", default="Strategy")
    article_parser.add_argument("--suggested-use", default="Topic seed,Strategy signal")
    article_parser.add_argument("--priority", choices=["high", "medium", "low"], default="medium")
    article_parser.add_argument(
        "--status",
        choices=["new", "processed", "skipped", "failed"],
        default="new",
    )
    article_parser.add_argument("--id", default="")

    scan_parser = subparsers.add_parser("record-scan")
    scan_parser.add_argument("--source-id", required=True)
    scan_parser.add_argument(
        "--status",
        choices=["never_checked", "healthy", "no_new_posts", "error"],
        required=True,
    )
    scan_parser.add_argument("--last-item-seen", default="")
    scan_parser.add_argument("--error", default="")

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
    elif args.command == "add-article":
        result = add_article(args)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        if not result["ok"]:
            raise SystemExit(1)
    elif args.command == "record-scan":
        result = record_scan(args)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        if not result["ok"]:
            raise SystemExit(1)
    elif args.command == "serve":
        serve(args)


if __name__ == "__main__":
    main()
