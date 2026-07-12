import datetime
import http.server
import json
import pathlib
import re
import socket
import socketserver


ROOT = pathlib.Path(__file__).resolve().parents[1]
PORT = 5177
HOST = "0.0.0.0"
LAN_HOST = socket.gethostbyname(socket.gethostname())

TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml; charset=utf-8",
}


def safe_path(relative_path):
    resolved = (ROOT / relative_path).resolve()
    if not str(resolved).startswith(str(ROOT)):
        raise ValueError("Path outside root")
    return resolved


def read_json(relative_path):
    return json.loads(safe_path(relative_path).read_text(encoding="utf-8-sig"))


def write_json(relative_path, data):
    safe_path(relative_path).write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def read_optional_json(relative_path, fallback):
    path = safe_path(relative_path)
    if not path.exists():
        return fallback
    return json.loads(path.read_text(encoding="utf-8-sig"))


def read_linkedin_overrides():
    data = read_optional_json("ui/data/linkedin-overrides.json", {})
    return {
        "topicPlatforms": data.get("topicPlatforms") or {},
    }


def normalize_list(value):
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return [item.strip() for item in str(value or "").split(",") if item.strip()]


def read_source_registry():
    data = read_optional_json("ui/data/source-registry.json", {})
    return {
        "meta": {
            "name": data.get("meta", {}).get("name") or "NLJR Source Registry",
            "description": data.get("meta", {}).get("description")
            or "Unified input list for Not Long; Just Read daily feed signals.",
            "updatedAt": data.get("meta", {}).get("updatedAt") or today(),
        },
        "sources": data.get("sources") if isinstance(data.get("sources"), list) else [],
    }


def save_source_registry(data):
    registry = read_source_registry()
    registry["meta"] = data.get("meta", registry["meta"])
    registry["meta"]["updatedAt"] = today()
    registry["sources"] = data.get("sources") if isinstance(data.get("sources"), list) else []
    write_json("ui/data/source-registry.json", registry)
    return registry


def source_defaults(source):
    source = source or {}
    source_mode = source.get("sourceMode") or "subscription"
    source_id = source.get("id") or f"{source_mode}-{slugify(source.get('name') or 'new-source')}-{datetime.datetime.now().strftime('%H%M%S')}"
    normalized = {
        "id": source_id,
        "name": source.get("name") or "New Source",
        "sourceMode": source_mode,
        "type": source.get("type")
        or ("keyword" if source_mode == "keyword_watch" else "manual" if source_mode == "manual_inbox" else "website"),
        "status": source.get("status") or "active",
        "scanStatus": source.get("scanStatus")
        or ("never_checked" if source_mode == "subscription" else ""),
        "lastError": source.get("lastError") or "",
        "priority": source.get("priority") or "medium",
        "relevance": normalize_list(source.get("relevance") or ["Strategy"]),
        "tags": normalize_list(source.get("tags") or []),
        "notes": source.get("notes") or "",
    }
    normalized.update(source)
    normalized["id"] = source_id
    normalized["sourceMode"] = source_mode
    for key in ["relevance", "tags", "keywords", "platforms", "language", "acceptedFormats", "defaultRelevance"]:
        if key in normalized:
            normalized[key] = normalize_list(normalized[key])
    if source_mode == "keyword_watch":
        try:
            normalized["lookbackHours"] = int(normalized.get("lookbackHours") or 24)
        except (TypeError, ValueError):
            normalized["lookbackHours"] = 24
    return normalized


def update_source_registry_source(body):
    source_id = body.get("sourceId")
    if not source_id:
        return {"ok": False, "error": "sourceId is required"}
    registry = read_source_registry()
    source = next((item for item in registry["sources"] if item.get("id") == source_id), None)
    if not source:
        return {"ok": False, "error": f"Source not found: {source_id}"}
    updates = body.get("updates") or {}
    for key, value in updates.items():
        if key in ["relevance", "tags", "keywords", "platforms", "language", "acceptedFormats", "defaultRelevance"]:
            source[key] = normalize_list(value)
        elif key == "lookbackHours":
            try:
                source[key] = int(value or 24)
            except (TypeError, ValueError):
                source[key] = 24
        else:
            source[key] = value
    return {"ok": True, "source": source, "data": save_source_registry(registry)}


def read_nljr_feed():
    data = read_optional_json("ui/data/nljr-feed.json", {})
    return {
        "today": data.get("today")
        or {
            "date": "",
            "status": "not_generated",
            "generatedAt": "",
            "items": [],
            "sourceHealth": {},
        },
        "archive": data.get("archive") if isinstance(data.get("archive"), list) else [],
    }

def read_nljr_article_ledger():
    data = read_optional_json("ui/data/nljr-article-ledger.json", {})
    return {
        "meta": data.get("meta")
        or {"name": "NLJR Article Ledger", "updatedAt": ""},
        "articles": data.get("articles")
        if isinstance(data.get("articles"), list)
        else [],
    }

def save_nljr_article_ledger(data):
    ledger = {
        "meta": {
            "name": data.get("meta", {}).get("name") or "NLJR Article Ledger",
            "description": data.get("meta", {}).get("description")
            or "Tracks discovered subscription posts so a processed article is never included in NLJR again.",
            "updatedAt": today(),
        },
        "articles": data.get("articles")
        if isinstance(data.get("articles"), list)
        else [],
    }
    write_json("ui/data/nljr-article-ledger.json", ledger)
    return ledger


def nljr_item_from_article(article, source, date, index):
    return {
        "id": f"{date}-{slugify(article.get('id') or article.get('title') or article.get('url'))}-{index + 1}",
        "articleId": article.get("id"),
        "sourceId": article.get("sourceId"),
        "sourceName": article.get("sourceName") or source.get("name") or "Unknown source",
        "title": article.get("title") or "Untitled article",
        "url": article.get("url"),
        "publishedAt": article.get("publishedAt") or "",
        "summary": article.get("summary") or "",
        "whyItMatters": article.get("whyItMatters") or "",
        "conciseSummary": article.get("conciseSummary") or "",
        "conciseWhyRelevant": article.get("conciseWhyRelevant") or "",
        "relevance": article.get("relevance") or source.get("relevance") or [],
        "suggestedUse": article.get("suggestedUse") or ["Topic seed", "Strategy signal"],
        "topicAngle": article.get("topicAngle") or "",
        "priority": article.get("priority") or source.get("priority") or "medium",
        "detailLevel": "recommended" if index < 3 else "brief",
    }


def build_nljr_markdown(today_feed):
    items = today_feed.get("items") or []
    recommended_ids = set(today_feed.get("recommendedItemIds") or [])
    recommended = [
        item
        for index, item in enumerate(items)
        if (item.get("articleId") or item.get("id")) in recommended_ids
        or (not recommended_ids and index < 3)
    ]
    recommended_item_ids = {item.get("id") for item in recommended}
    additional = [item for item in items if item.get("id") not in recommended_item_ids]
    health = today_feed.get("sourceHealth") or {}
    item_blocks = []
    for index, item in enumerate(recommended, start=1):
        item_blocks.append(
            f"""### {index}. {item.get('title')}

Source: {item.get('sourceName')}
URL: {item.get('url') or 'N/A'}

#### Summary

{item.get('summary')}

#### Why It Matters

{item.get('whyItMatters')}

#### Suggested Use

{', '.join(item.get('suggestedUse') or [])}

#### Topic Angle

{item.get('topicAngle')}
"""
        )
    skipped = health.get("skippedSources") or []
    skipped_lines = "\n".join(f"- {item.get('name')}: {item.get('reason')}" for item in skipped) or "- None"
    additional_blocks = []
    for index, item in enumerate(additional, start=4):
        additional_blocks.append(
            f"""### {index}. {item.get('title')}

Source: {item.get('sourceName')}
URL: {item.get('url') or 'N/A'}

{item.get('conciseSummary') or item.get('summary')}

Why read: {item.get('conciseWhyRelevant') or item.get('whyItMatters')}
"""
        )
    return f"""# NLJR Daily Feed - {today_feed.get('date')}

Generated at: {today_feed.get('generatedAt')}

## Recommended Deep Reads

{chr(10).join(item_blocks)}

## More New Feeds

{chr(10).join(additional_blocks) or "No additional qualifying feeds."}

## Source Health

- Active sources: {health.get('activeSources') or 0}
- Active subscriptions: {health.get('activeSubscriptions') or 0}
- Need URL confirmation: {health.get('needsUrlConfirmation') or 0}
- Keyword watches: {health.get('keywordWatches') or 0}
- New articles available: {health.get('newArticlesAvailable') or 0}
- Processed articles: {health.get('processedArticles') or 0}

## Skipped Sources

{skipped_lines}
"""


def generate_nljr_feed():
    registry = read_source_registry()
    feed = read_nljr_feed()
    ledger = read_nljr_article_ledger()
    date = today()
    generated_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    active_sources = [source for source in registry["sources"] if source.get("status") != "archived"]
    subscriptions = [source for source in active_sources if source.get("sourceMode") == "subscription"]
    keyword_watches = [source for source in active_sources if source.get("sourceMode") == "keyword_watch"]
    needs_url = [source for source in active_sources if "needs" in str(source.get("sourceConfidence") or "")]
    priority_rank = {"high": 0, "medium": 1, "low": 2}
    source_by_id = {source.get("id"): source for source in registry["sources"]}
    new_articles = sorted(
        [
            article
            for article in ledger["articles"]
            if article.get("status") == "new" and article.get("url")
        ],
        key=lambda article: (
            priority_rank.get(article.get("priority"), 9),
            str(article.get("publishedAt") or article.get("discoveredAt") or ""),
        ),
    )
    selected_articles = new_articles[:10]
    items = [
        nljr_item_from_article(
            article,
            source_by_id.get(article.get("sourceId")) or {},
            date,
            index,
        )
        for index, article in enumerate(selected_articles)
    ]
    selected_ids = {article.get("id") for article in selected_articles}
    for article in ledger["articles"]:
        if article.get("id") in selected_ids:
            article["status"] = "processed"
            article["processedAt"] = generated_at
            article["includedIn"] = date
    save_nljr_article_ledger(ledger)
    today_feed = {
        "date": date,
        "status": "generated" if items else "no_new_posts",
        "generatedAt": generated_at,
        "items": items,
        "recommendedItemIds": [
            item.get("articleId") or item.get("id") for item in items[:3]
        ],
        "sourceHealth": {
            "activeSources": len(active_sources),
            "activeSubscriptions": len(subscriptions),
            "needsUrlConfirmation": len(needs_url),
            "keywordWatches": len(keyword_watches),
            "newArticlesAvailable": len(
                [article for article in ledger["articles"] if article.get("status") == "new"]
            ),
            "processedArticles": len(
                [article for article in ledger["articles"] if article.get("status") == "processed"]
            ),
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
    archive_path = f"content_pipeline/nljr_archive/{date}.md"
    safe_path("content_pipeline/nljr_archive").mkdir(parents=True, exist_ok=True)
    safe_path(archive_path).write_text(build_nljr_markdown(today_feed), encoding="utf-8")
    archive_entry = {
        "date": date,
        "path": archive_path,
        "itemCount": len(items),
        "generatedAt": generated_at,
        "summary": ", ".join(item.get("sourceName") or "" for item in items) or "No NLJR items generated.",
    }
    archive = [archive_entry] + [entry for entry in feed.get("archive", []) if entry.get("date") != date]
    data = {"today": today_feed, "archive": archive}
    write_json("ui/data/nljr-feed.json", data)
    return {"ok": True, "data": data, "archivePath": archive_path}


def today():
    return datetime.datetime.now().date().isoformat()


def slugify(value):
    slug = re.sub(r"[^a-z0-9]+", "-", str(value or "topic").lower()).strip("-")[:80]
    return slug or "topic"


def normalize_status(value):
    return {"new": "funnel", "generated": "funnel", "deselected": "cancelled"}.get(value, value)


def normalize_data(data):
    data.setdefault("posts", [])
    data.setdefault("publishedPosts", [])
    for index, topic in enumerate(data.get("topics", [])):
        try:
            topic["priority"] = int(topic.get("priority", index + 1))
        except (TypeError, ValueError):
            topic["priority"] = index + 1
        topic["status"] = normalize_status(topic.get("status")) or "funnel"
        topic["platform"] = topic.get("platform") or "XHS"
    return data


def brief_markdown_from_topic(topic):
    return f"""# Why This Post

## Recommended Because

- It sits inside the pillar: **{topic.get('pillar') or 'Unassigned'}**.
- It directly tests the AI portfolio / project coaching wedge.
- It speaks to a concrete anxiety: "I want to transition to AI PM, but I do not know what project will survive interview follow-up."
- It can attract high-quality comments from readers sharing their background, target role, or project idea.

## What Signal To Watch

- Saves: readers treat the checklist as reusable.
- Comments: readers mention background, target role, project idea, or portfolio confusion.
- Lead signal: readers ask for project review, AI PM portfolio help, mock interview, or private diagnosis.

---

# Brief

## Topic

{topic.get('title')}

## What It Does

Turn this selected topic into a concrete post direction before drafting copy.

## Audience

Chinese-speaking professionals targeting AI PM roles, especially non-technical or adjacent-background candidates who need credible project proof.

## Core Pain

They want to transition into AI PM, but they are not sure what project would look credible, relevant, and strong enough to survive interview follow-up.

## Commercial Hypothesis

{topic.get('hypothesis') or 'This topic should test whether readers need portfolio, project, or AI PM transition coaching.'}

## Suggested Output

- A clear XHS post angle.
- A save-worthy checklist or diagnostic framework.
- A comment prompt that invites background, target role, and project idea.
- A next step into Generate Draft after this brief is accepted mentally.

## Next Step

Click Generate Draft to create the actual post copy. Review belongs to the draft stage, not the topic-add stage.
"""


def unique_post_id(data, base_post_id):
    existing_ids = {
        post.get("id")
        for post in data.get("posts", []) + data.get("publishedPosts", [])
        if post.get("id")
    }
    if base_post_id not in existing_ids:
        return base_post_id
    counter = 2
    while f"{base_post_id}-{counter}" in existing_ids:
        counter += 1
    return f"{base_post_id}-{counter}"


def post_from_topic(topic, data=None):
    data = data or {}
    date = today()
    short_slug = slugify(topic.get("title"))
    post_id = unique_post_id(data, f"{date}-{short_slug}")
    filename = f"{date}_{short_slug}_brief.md"
    source_path = f"content_pipeline/drafts/{filename}"
    ui_path = f"data/pipeline/{filename}"
    brief = brief_markdown_from_topic(topic)
    safe_path("content_pipeline/drafts").mkdir(parents=True, exist_ok=True)
    safe_path("ui/data/pipeline").mkdir(parents=True, exist_ok=True)
    safe_path(source_path).write_text(brief, encoding="utf-8")
    safe_path(f"ui/{ui_path}").write_text(brief, encoding="utf-8")
    return {
        "id": post_id,
        "topicId": topic.get("id"),
        "title": topic.get("title"),
        "status": "Added",
        "pillar": topic.get("pillar"),
        "owner": "momo",
        "date": date,
        "sourcePath": source_path,
        "nextStep": "Brief is ready. Generate Draft next.",
        "assets": {"brief": ui_path},
        "sourceAssets": {"brief": source_path},
        "workflowState": {"briefGenerated": True},
    }


def draft_markdown_from_brief(post, topic, brief):
    brief_path = post.get("sourceAssets", {}).get("brief") or post.get("sourcePath") or post.get("assets", {}).get("brief") or "No brief file recorded."
    return f"""# Draft

## Title Options

1. {post.get('title')}
2. 非技术背景转 AI PM，别再做炫技 demo
3. 你的 AI project 要证明的不是技术，而是 PM 判断

## XHS Caption Draft

很多想转 AI PM 的人，第一反应是：

> 我是不是应该先做一个很酷的 AI demo？

但如果你是非技术背景，真正要解决的问题不是“demo 看起来多高级”，而是：

> 面试官看完之后，会不会相信你能像 AI PM 一样定义问题、做取舍、解释价值？

一个更适合转型候选人的 AI project，通常要回答 5 件事：

1. **Problem**：你到底在解决谁的什么问题？
2. **User**：这个用户为什么现在会痛？
3. **Workflow**：AI 放进去之后，工作流发生了什么变化？
4. **Metric**：怎么判断这个 project 有用？
5. **Tradeoff**：你知道它的风险、边界和下一步吗？

所以不要一上来就问：

> 我要用什么模型？我要做什么酷功能？

先问：

> 我过去的经历里，有没有一个我真的懂的 workflow？这个 workflow 里，AI 可以减少哪一步摩擦？

## Comment Prompt

如果你也在想转 AI PM，可以评论：

- 你的当前背景
- 目标 role
- 你正在想做的 AI project idea

我可以帮你判断它更像“炫技 demo”，还是更像一个能证明 PM 判断的 portfolio project。

## Source Brief

- Post: {post.get('title')}
- Pillar: {post.get('pillar') or (topic or {}).get('pillar') or 'Unassigned'}
- Topic hypothesis: {(topic or {}).get('hypothesis') or 'No topic hypothesis found.'}
- Brief file: {brief_path}
"""


def copy_review_markdown_from_draft(post, topic):
    return f"""# Review

## Review

This review checks whether the draft is ready to move from Drafted into Visual Direction. It should judge the post against strategy fit, save value, comment potential, and commercial subtlety.

## Overall Verdict

This draft is aligned with the account strategy because it connects a high-intent audience pain, non-technical AI PM transition, to the commercial wedge: AI portfolio / project coaching.

## Strategy Fit

- Audience fit: strong for non-technical, BA, Ops, Consulting, and TPM backgrounds.
- Commercial fit: strong because readers may ask whether their own project idea is credible.
- Persona fit: strong for momo as a practical North America PM helping candidates translate AI learning into PM proof.

## Strengths

- Clear pain: candidates do not know what AI project to build.
- Strong save potential: the 5-part standard can become a checklist.
- Good comment potential: asks readers to share background, target role, and project idea.
- Avoids overclaiming technical authority.

## Risks

- The draft should avoid sounding too generic; add concrete examples when possible.
- If the carousel becomes too text-heavy, split the 5-part standard across pages.
- The CTA should stay consultative, not salesy.

## Revision Suggestions

1. Add one concrete mini-example for BA, Ops, or Consulting.
2. Keep page 1 direct and high-anxiety.
3. Make page 7 explicitly interview-facing: "how to present this project when challenged."
4. End with a comment prompt, not a hard Calendly push.

"""


def get_post(data, post_id):
    return next((item for item in data.get("posts", []) + data.get("publishedPosts", []) if item.get("id") == post_id), None)


def image_workflow_from_body(post, body):
    workflow = post.setdefault("workflowState", {}).setdefault("imageWorkflow", {})
    workflow["imageRequired"] = body.get("imageRequired") is not False
    workflow["styleOption"] = body.get("styleOption") or workflow.get("styleOption") or "Option B"
    workflow["goals"] = body.get("goals") if isinstance(body.get("goals"), list) else []
    workflow["latestComment"] = body.get("comment") or ""
    workflow["updatedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    return workflow


def write_post_asset(post, key, suffix, content):
    brief_path = post.get("sourceAssets", {}).get("brief") or f"content_pipeline/drafts/{post.get('id')}_brief.md"
    base_name = re.sub(r"^content_pipeline/drafts/", "", brief_path)
    base_name = re.sub(r"_brief\\.md$", "", base_name)
    filename = f"{base_name}_{suffix}.md"
    source_path = f"content_pipeline/drafts/{filename}"
    ui_path = f"data/pipeline/{filename}"
    safe_path("content_pipeline/drafts").mkdir(parents=True, exist_ok=True)
    safe_path("ui/data/pipeline").mkdir(parents=True, exist_ok=True)
    safe_path(source_path).write_text(content, encoding="utf-8")
    safe_path(f"ui/{ui_path}").write_text(content, encoding="utf-8")
    post.setdefault("assets", {})[key] = ui_path
    post.setdefault("sourceAssets", {})[key] = source_path


def carousel_script_content(post, workflow):
    goals = ", ".join(workflow.get("goals") or ["save", "trust"])
    return f"""# Carousel Script

## Post

{post.get('title')}

## Visual Direction

- Image required: {"yes" if workflow.get("imageRequired") else "no"}
- Style option: {workflow.get("styleOption")}
- Goals: {goals}
- Adjustment: {workflow.get("latestComment") or "None"}

## Page Plan

1. Cover: make the audience stop.
2. Diagnosis: shiny demo vs PM proof.
3. Reframe: PM judgment over AI buzzwords.
4. Framework: problem, user, workflow, metric, tradeoff.
5. Example workflow from adjacent background.
6. Interview follow-up simulation.
7. Portfolio fix checklist.
8. Comment invitation and soft coaching signal.
"""


def image_prompts_content(post, workflow):
    goals = ", ".join(workflow.get("goals") or ["save", "trust"])
    pages = [
        "Cover: AI portfolio is not a flashy demo",
        "Diagnosis: shiny demo vs PM proof",
        "Reframe: PM judgment over AI buzzwords",
        "Framework: problem user workflow metric tradeoff",
        "Example workflow from BA Ops Consulting TPM background",
        "Interview follow-up simulation",
        "Portfolio fix checklist",
        "Comment invitation and soft coaching signal",
    ]
    blocks = []
    for index, title in enumerate(pages, start=1):
        blocks.append(f"""## Page {index}

Prompt:
```text
Create a 3:4 Xiaohongshu carousel image for "{post.get('title')}". Page {index}: {title}. Use {workflow.get('styleOption')}. Goal: {goals}. Premium, mobile-readable AI PM portfolio coaching visual.
```
""")
    return "# Image Prompts\n\n" + "\n".join(blocks)


def ready_caption(post):
    draft_path = post.get("sourceAssets", {}).get("publishCopy")
    if not draft_path:
        return "Use accepted draft copy."
    text = safe_path(draft_path).read_text(encoding="utf-8") if safe_path(draft_path).exists() else ""
    match = re.search(r"## XHS Caption Draft\\s+([\\s\\S]*?)(?=\\n## |$)", text)
    return match.group(1).strip() if match else "Use accepted draft copy."


def escape_svg(value):
    return (
        str(value or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def wrap_svg_text(text, max_chars=18):
    words = str(text or "").split()
    lines = []
    current = ""
    for word in words:
        if len(current + word) > max_chars and current:
            lines.append(current.strip())
            current = word
        else:
            current = f"{current} {word}".strip()
    if current:
        lines.append(current.strip())
    return lines[:5]


def local_carousel_svg(post, workflow, page, title):
    style = workflow.get("styleOption") or "Option B"
    dark = style == "Option A"
    bg = "#151515" if dark else ("#f4f0e8" if style == "Option C" else "#f7f8f5")
    ink = "#f5f1e8" if dark else "#1f2428"
    muted = "#9da6a0" if dark else "#66706a"
    accent = "#d85f45" if style == "Option A" else ("#2f6f73" if style == "Option C" else "#2f8f66")
    line_nodes = "\n  ".join(
        f'<text x="112" y="{365 + index * 74}" fill="{ink}" font-family="Arial, sans-serif" font-size="58" font-weight="800">{escape_svg(line)}</text>'
        for index, line in enumerate(wrap_svg_text(title, 20))
    )
    subtitle = post.get("title") if page == 1 else "AI PM portfolio coaching"
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1365" viewBox="0 0 1024 1365">
  <rect width="1024" height="1365" fill="{bg}"/>
  <rect x="72" y="72" width="880" height="1221" rx="28" fill="{'#202020' if dark else '#ffffff'}" stroke="{'#3c3c3c' if dark else '#d9ded7'}" stroke-width="3"/>
  <text x="112" y="145" fill="{accent}" font-family="Arial, sans-serif" font-size="34" font-weight="700">PAGE {page}</text>
  <text x="112" y="205" fill="{muted}" font-family="Arial, sans-serif" font-size="28">momo · North America AI PM</text>
  {line_nodes}
  <rect x="112" y="790" width="800" height="2" fill="{'#3c3c3c' if dark else '#d9ded7'}"/>
  <text x="112" y="855" fill="{muted}" font-family="Arial, sans-serif" font-size="30">{escape_svg(subtitle)[:70]}</text>
  <g transform="translate(112 940)">
    <rect width="800" height="210" rx="18" fill="{'#171717' if dark else '#f1f4ef'}"/>
    <circle cx="72" cy="72" r="28" fill="{accent}"/>
    <text x="120" y="82" fill="{ink}" font-family="Arial, sans-serif" font-size="34" font-weight="700">problem · user · workflow · metric · tradeoff</text>
    <text x="120" y="142" fill="{muted}" font-family="Arial, sans-serif" font-size="26">designed for save-worthy XHS carousel review</text>
  </g>
  <text x="112" y="1235" fill="{muted}" font-family="Arial, sans-serif" font-size="24">Generated locally without API key</text>
</svg>'''


def generate_local_svg_images(post, workflow):
    titles = [
        "AI portfolio is not a flashy demo",
        "Shiny demo does not prove PM readiness",
        "PM judgment beats AI buzzwords",
        "Problem User Workflow Metric Tradeoff",
        "Find project ideas from your real workflow",
        "Prepare for interview follow-up questions",
        "Fix your portfolio before calling it AI PM",
        "Comment your background and target role",
    ]
    image_dir = safe_path(f"content_pipeline/generated_images/{post.get('id')}")
    image_dir.mkdir(parents=True, exist_ok=True)
    generated = []
    for index, title in enumerate(titles, start=1):
        filename = f"page-{index:02d}.svg"
        output_path = image_dir / filename
        output_path.write_text(local_carousel_svg(post, workflow, index, title), encoding="utf-8")
        generated.append(f"content_pipeline/generated_images/{post.get('id')}/{filename}")
    return generated


def images_index_html(post, images):
    cards = []
    for index, item in enumerate(images, start=1):
        filename = pathlib.Path(item).name
        cards.append(
            f'''<article>
        <a href="./{filename}" target="_blank" rel="noreferrer">
          <img src="./{filename}" alt="Page {index}" />
        </a>
        <p>Page {index}</p>
      </article>'''
        )
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escape_svg(post.get("title"))} images</title>
  <style>
    body{{margin:0;padding:24px;background:#f7f8f5;color:#1f2428;font-family:Arial,sans-serif}}
    h1{{font-size:24px;line-height:1.25}}
    .grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px}}
    article{{background:#fff;border:1px solid #d9ded7;border-radius:8px;padding:12px}}
    img{{width:100%;aspect-ratio:3/4;object-fit:contain;background:#f1f4ef;border-radius:6px}}
    p{{margin:10px 0 0;color:#66706a;font-size:13px;font-weight:700}}
  </style>
</head>
<body>
  <h1>{escape_svg(post.get("title"))}</h1>
  <div class="grid">{''.join(cards)}</div>
</body>
</html>'''


class Handler(http.server.BaseHTTPRequestHandler):
    def send_body(self, status, body, content_type="application/json; charset=utf-8"):
        if isinstance(body, bytes):
            payload = body
        elif isinstance(body, str):
            payload = body.encode("utf-8")
        else:
            payload = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def request_json(self):
        length = int(self.headers.get("Content-Length", "0") or 0)
        raw = self.rfile.read(length).decode("utf-8") if length else "{}"
        return json.loads(raw or "{}")

    def do_GET(self):
        if self.path == "/api/health":
            return self.send_body(
                200,
                {
                    "ok": True,
                    "server": "python-local",
                    "frontend": f"http://127.0.0.1:{PORT}/ui/index.html",
                },
            )
        if self.path == "/api/data":
            return self.send_body(200, read_json("ui/data/xhs-data.json"))
        if self.path == "/api/linkedin-overrides":
            return self.send_body(200, read_linkedin_overrides())
        if self.path == "/api/source-registry":
            return self.send_body(200, read_source_registry())
        if self.path == "/api/nljr-feed":
            return self.send_body(200, read_nljr_feed())
        if self.path == "/api/nljr-article-ledger":
            return self.send_body(200, read_nljr_article_ledger())

        relative_path = self.path.split("?", 1)[0]
        if relative_path == "/":
            relative_path = "/ui/index.html"
        try:
            file_path = safe_path(relative_path.lstrip("/"))
        except ValueError:
            return self.send_body(403, "Forbidden", "text/plain; charset=utf-8")
        if not file_path.is_file():
            return self.send_body(404, "Not found", "text/plain; charset=utf-8")
        return self.send_body(
            200,
            file_path.read_bytes(),
            TYPES.get(file_path.suffix.lower(), "application/octet-stream"),
        )

    def do_POST(self):
        try:
            if self.path == "/api/topics/status":
                body = self.request_json()
                data = normalize_data(read_json("ui/data/xhs-data.json"))
                status = body.get("status")
                if status not in {"funnel", "selected", "cancelled"}:
                    return self.send_body(
                        400,
                        {"ok": False, "error": "topicId and valid status are required"},
                    )
                topic = next(
                    (item for item in data.get("topics", []) if item.get("id") == body.get("topicId")),
                    None,
                )
                if not topic:
                    return self.send_body(404, {"ok": False, "error": "Topic not found"})
                topic["status"] = status
                exists = any(
                    post.get("status") != "Archived"
                    and (post.get("topicId") == topic.get("id") or post.get("title") == topic.get("title"))
                    for post in data["posts"] + data["publishedPosts"]
                )
                if status == "selected" and not exists:
                    data["posts"].insert(0, post_from_topic(topic, data))
                write_json("ui/data/xhs-data.json", data)
                return self.send_body(200, {"ok": True, "topic": topic, "data": data})

            if self.path == "/api/topics/platform":
                body = self.request_json()
                data = normalize_data(read_json("ui/data/xhs-data.json"))
                platform = body.get("platform")
                if platform not in {"XHS", "LinkedIn", "Both"}:
                    return self.send_body(
                        400,
                        {"ok": False, "error": "topicId and valid platform are required"},
                    )
                topic = next(
                    (item for item in data.get("topics", []) if item.get("id") == body.get("topicId")),
                    None,
                )
                if not topic:
                    return self.send_body(404, {"ok": False, "error": "Topic not found"})
                topic["platform"] = platform
                write_json("ui/data/xhs-data.json", data)
                return self.send_body(200, {"ok": True, "topic": topic, "data": data})

            if self.path == "/api/linkedin/topics/platform":
                body = self.request_json()
                platform = body.get("platform")
                if platform not in {"XHS", "LinkedIn", "Both"}:
                    return self.send_body(
                        400,
                        {"ok": False, "error": "topicId and valid platform are required"},
                    )
                topic_id = body.get("topicId")
                if not topic_id:
                    return self.send_body(400, {"ok": False, "error": "topicId is required"})
                data = read_linkedin_overrides()
                data["topicPlatforms"][topic_id] = platform
                write_json("ui/data/linkedin-overrides.json", data)
                return self.send_body(
                    200,
                    {"ok": True, "topicId": topic_id, "platform": platform, "data": data},
                )

            if self.path == "/api/source-registry/source":
                body = self.request_json()
                registry = read_source_registry()
                source = source_defaults(body.get("source") or {})
                registry["sources"] = [source] + [
                    item for item in registry["sources"] if item.get("id") != source.get("id")
                ]
                return self.send_body(
                    200,
                    {"ok": True, "source": source, "data": save_source_registry(registry)},
                )

            if self.path == "/api/source-registry/archive":
                body = self.request_json()
                return self.send_body(
                    200,
                    update_source_registry_source(
                        {"sourceId": body.get("sourceId"), "updates": {"status": "archived"}}
                    ),
                )

            if self.path == "/api/nljr-feed/generate":
                return self.send_body(200, generate_nljr_feed())

            if self.path == "/api/topics/add-to-posts":
                body = self.request_json()
                data = normalize_data(read_json("ui/data/xhs-data.json"))
                topic = next(
                    (item for item in data.get("topics", []) if item.get("id") == body.get("topicId")),
                    None,
                )
                if not topic:
                    return self.send_body(404, {"ok": False, "error": "Topic not found"})
                topic["status"] = "selected"
                post = next(
                    (
                        item
                        for item in data["posts"] + data["publishedPosts"]
                        if item.get("status") != "Archived"
                        and (item.get("topicId") == topic.get("id") or item.get("title") == topic.get("title"))
                    ),
                    None,
                )
                if not post:
                    post = post_from_topic(topic, data)
                    data["posts"].insert(0, post)
                write_json("ui/data/xhs-data.json", data)
                return self.send_body(200, {"ok": True, "topic": topic, "post": post, "data": data})

            if self.path == "/api/posts/cancel":
                body = self.request_json()
                data = normalize_data(read_json("ui/data/xhs-data.json"))
                post = next((item for item in data["posts"] if item.get("id") == body.get("postId")), None)
                if not post:
                    return self.send_body(404, {"ok": False, "error": "Active post draft not found"})
                post["status"] = "Archived"
                post["nextStep"] = "Archived. Topic returned to funnel."
                workflow = post.setdefault("workflowState", {})
                workflow["cancelledAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
                workflow["returnedTopicToFunnel"] = True
                topic = next(
                    (
                        item
                        for item in data.get("topics", [])
                        if item.get("id") == post.get("topicId") or item.get("title") == post.get("title")
                    ),
                    None,
                )
                if topic:
                    topic["status"] = "funnel"
                write_json("ui/data/xhs-data.json", data)
                return self.send_body(200, {"ok": True, "post": post, "topic": topic, "data": data})

            if self.path == "/api/drafts/accept":
                body = self.request_json()
                data = normalize_data(read_json("ui/data/xhs-data.json"))
                post = next((item for item in data["posts"] if item.get("id") == body.get("postId")), None)
                if not post:
                    return self.send_body(404, {"ok": False, "error": "Post draft not found"})
                if post.get("status") == "Archived":
                    return self.send_body(400, {"ok": False, "error": "Archived post drafts cannot be accepted"})
                post["status"] = "Drafted"
                post["nextStep"] = "Draft accepted. Start Generate Image next."
                workflow = post.setdefault("workflowState", {})
                workflow["draftGenerated"] = True
                workflow["draftAccepted"] = True
                workflow["draftAcceptedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
                write_json("ui/data/xhs-data.json", data)
                return self.send_body(200, {"ok": True, "post": post, "data": data})

            if self.path == "/api/image-workflow/carousel-script":
                body = self.request_json()
                data = normalize_data(read_json("ui/data/xhs-data.json"))
                post = get_post(data, body.get("postId"))
                if not post:
                    return self.send_body(404, {"ok": False, "error": "Post not found"})
                workflow = image_workflow_from_body(post, body)
                content = carousel_script_content(post, workflow)
                write_post_asset(post, "carouselScript", "carousel", content)
                workflow["carouselScriptPreview"] = content
                workflow["carouselScriptGenerated"] = True
                workflow["carouselScriptAccepted"] = False
                post["status"] = "Generate Image"
                post["nextStep"] = "Carousel script generated. Review and accept it to generate image prompts."
                write_json("ui/data/xhs-data.json", data)
                return self.send_body(200, {"ok": True, "message": "Carousel script generated.", "post": post, "data": data})

            if self.path == "/api/image-workflow/image-prompts":
                body = self.request_json()
                data = normalize_data(read_json("ui/data/xhs-data.json"))
                post = get_post(data, body.get("postId"))
                if not post:
                    return self.send_body(404, {"ok": False, "error": "Post not found"})
                workflow = image_workflow_from_body(post, body)
                workflow["carouselScriptAccepted"] = True
                content = image_prompts_content(post, workflow)
                write_post_asset(post, "imagePrompts", "image-prompts", content)
                workflow["imagePromptsPreview"] = content
                workflow["imagePromptsGenerated"] = True
                workflow["imagePromptsAccepted"] = False
                post["status"] = "Generate Image"
                post["nextStep"] = "Image prompts generated. Review and accept them to generate images."
                write_json("ui/data/xhs-data.json", data)
                return self.send_body(200, {"ok": True, "message": "Image prompts generated.", "post": post, "data": data})

            if self.path == "/api/image-workflow/generate-images":
                body = self.request_json()
                data = normalize_data(read_json("ui/data/xhs-data.json"))
                post = get_post(data, body.get("postId"))
                if not post:
                    return self.send_body(404, {"ok": False, "error": "Post not found"})
                workflow = image_workflow_from_body(post, body)
                workflow["imagePromptsAccepted"] = True
                image_dir = safe_path(f"content_pipeline/generated_images/{post.get('id')}")
                image_dir.mkdir(parents=True, exist_ok=True)
                images = generate_local_svg_images(post, workflow)
                workflow["generatedImages"] = images
                post["generatedImages"] = images
                workflow["imagesGenerated"] = True
                workflow["imagesAccepted"] = False
                content = (
                    "# Image Review\n\n## Generated Image Queue\n\n"
                    + "\n".join(f"- {item}" for item in images)
                    + "\n\n## Preview\n\n"
                    + "\n\n".join(f"![Page {index}]({item})" for index, item in enumerate(images, start=1))
                    + "\n"
                )
                image_dir.joinpath("image_review.md").write_text(content, encoding="utf-8")
                image_dir.joinpath("index.html").write_text(images_index_html(post, images), encoding="utf-8")
                workflow["imageReviewPreview"] = content
                post["status"] = "Generate Image"
                post["nextStep"] = "Image review package generated. Review and accept images to mark Ready."
                write_json("ui/data/xhs-data.json", data)
                return self.send_body(200, {"ok": True, "message": "Image review package generated.", "post": post, "data": data})

            if self.path == "/api/image-workflow/accept-package":
                body = self.request_json()
                data = normalize_data(read_json("ui/data/xhs-data.json"))
                post = get_post(data, body.get("postId"))
                if not post:
                    return self.send_body(404, {"ok": False, "error": "Post not found"})
                workflow = image_workflow_from_body(post, body)
                workflow["imagesAccepted"] = True
                package_dir = safe_path(f"content_pipeline/post_packages/{post.get('id')}")
                package_dir.mkdir(parents=True, exist_ok=True)
                images = workflow.get("generatedImages") or post.get("generatedImages") or []
                content = (
                    f"# Ready Package\n\n## Title\n\n{post.get('title')}\n\n## XHS Caption Draft\n\n{ready_caption(post)}\n\n## Images\n\n"
                    + "\n".join(f"- {item}" for item in images)
                    + f"\n\n## Images Folder\n\n[Open images folder](/content_pipeline/generated_images/{post.get('id')}/index.html)\n\n## Final Comment\n\n{workflow.get('latestComment') or 'Accepted without extra comment.'}\n"
                )
                package_dir.joinpath("ready_package.md").write_text(content, encoding="utf-8")
                workflow["readyPackagePreview"] = content
                post.setdefault("assets", {})["readyPackage"] = f"content_pipeline/post_packages/{post.get('id')}/ready_package.md"
                post["status"] = "Ready"
                post["nextStep"] = "Ready package saved. Publish manually on XHS."
                write_json("ui/data/xhs-data.json", data)
                return self.send_body(200, {"ok": True, "message": "Ready package saved.", "post": post, "data": data})

            if self.path == "/api/visual-option":
                body = self.request_json()
                data = normalize_data(read_json("ui/data/xhs-data.json"))
                post = next(
                    (item for item in data["posts"] + data["publishedPosts"] if item.get("id") == body.get("postId")),
                    None,
                )
                if not post:
                    return self.send_body(404, {"ok": False, "error": "Post not found"})
                workflow = post.setdefault("workflowState", {})
                workflow["visualOptionSelected"] = True
                workflow["selectedVisualOption"] = body.get("selectedOption") or "Option B"
                workflow["visualAdjustment"] = body.get("adjustment") or ""
                post["status"] = "Generate Image"
                post["nextStep"] = "Generate image prompts using the selected visual direction."
                write_json("ui/data/xhs-data.json", data)
                return self.send_body(200, {"ok": True, "postId": body.get("postId"), "data": post})

            if self.path == "/api/generate-draft":
                body = self.request_json()
                data = normalize_data(read_json("ui/data/xhs-data.json"))
                post = next(
                    (item for item in data["posts"] + data["publishedPosts"] if item.get("id") == body.get("postId")),
                    None,
                )
                if not post:
                    return self.send_body(404, {"ok": False, "error": "Post not found"})
                if not post.get("sourceAssets", {}).get("brief"):
                    return self.send_body(400, {"ok": False, "error": "This post has no brief asset yet."})
                topic = next(
                    (
                        item
                        for item in data.get("topics", [])
                        if item.get("id") == post.get("topicId") or item.get("title") == post.get("title")
                    ),
                    None,
                )
                brief = safe_path(post["sourceAssets"]["brief"]).read_text(encoding="utf-8")
                base_name = pathlib.Path(post["sourceAssets"]["brief"]).name.replace("_brief.md", "")
                publish_filename = f"{base_name}_publish-copy.md"
                review_filename = f"{base_name}_copy-review.md"
                publish_source_path = f"content_pipeline/drafts/{publish_filename}"
                review_source_path = f"content_pipeline/drafts/{review_filename}"
                publish_ui_path = f"data/pipeline/{publish_filename}"
                review_ui_path = f"data/pipeline/{review_filename}"
                publish_copy = draft_markdown_from_brief(post, topic, brief)
                copy_review = copy_review_markdown_from_draft(post, topic)
                safe_path(publish_source_path).write_text(publish_copy, encoding="utf-8")
                safe_path(review_source_path).write_text(copy_review, encoding="utf-8")
                safe_path(f"ui/{publish_ui_path}").write_text(publish_copy, encoding="utf-8")
                safe_path(f"ui/{review_ui_path}").write_text(copy_review, encoding="utf-8")
                if post.get("status") != "Archived" and not post.get("workflowState", {}).get("draftAccepted"):
                    post["status"] = "Added"
                post["nextStep"] = "Draft and copy review are ready. Review and accept draft next."
                post.setdefault("assets", {})["publishCopy"] = publish_ui_path
                post.setdefault("assets", {})["copyReview"] = review_ui_path
                post.setdefault("sourceAssets", {})["publishCopy"] = publish_source_path
                post.setdefault("sourceAssets", {})["copyReview"] = review_source_path
                post.setdefault("workflowState", {})["draftGenerated"] = True
                write_json("ui/data/xhs-data.json", data)
                return self.send_body(
                    200,
                    {
                        "ok": True,
                        "post": post,
                        "publishCopyPath": publish_source_path,
                        "copyReviewPath": review_source_path,
                        "data": data,
                    },
                )

            return self.send_body(404, {"ok": False, "error": "API route not found"})
        except Exception as error:
            return self.send_body(500, {"ok": False, "error": str(error)})

    def do_PATCH(self):
        try:
            if self.path == "/api/source-registry/source":
                return self.send_body(200, update_source_registry_source(self.request_json()))
            return self.send_body(404, {"ok": False, "error": "API route not found"})
        except Exception as error:
            return self.send_body(500, {"ok": False, "error": str(error)})

    def log_message(self, *_args):
        return


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((HOST, PORT), Handler) as server:
        print(f"XHS local test server running locally at http://127.0.0.1:{PORT}/ui/index.html")
        print(f"LAN access URL: http://{LAN_HOST}:{PORT}/ui/index.html")
        server.serve_forever()
