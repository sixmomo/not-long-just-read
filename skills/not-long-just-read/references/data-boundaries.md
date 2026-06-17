# NLJR Data Boundaries

Use this reference when explaining what NLJR stores or when reviewing whether a source should be added.

## Stored Locally

- Source names, URLs, archive URLs, tags, notes, priorities, and confidence states.
- Today's generated NLJR feed.
- Dated Markdown archives.
- Local UI preferences if the implementation later adds them.

## Not Stored By Default

- Passwords, API keys, cookies, newsletter login credentials, or paid-content downloads.
- Hosted NLJR account data.
- Remote database rows.

## Important Privacy Clarification

NLJR is local-first storage, not a total privacy guarantee. The user's selected AI agent may read and process the local files while helping them. Describe this plainly:

> NLJR does not need to send your reading list to a hosted NLJR service, but your AI agent may process the local files according to that agent provider's own privacy policy.

## Source Confidence

- `verified_post`: specific public post URL is known.
- `verified_archive`: public archive or listing URL is known.
- `manual_note`: user provided a note or idea without a reliable URL.
- `needs_url_confirmation`: the source name is known but the URL or archive path has not been confirmed.

Only `verified_post`, `verified_archive`, and keyword watches should be eligible for automatic feed generation.
