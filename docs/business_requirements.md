# Business Requirements

## Purpose

This project supports one Xiaohongshu account focused on North America AI PM transition and AI portfolio coaching.

The account helps Chinese-speaking professionals in North America, or targeting North America roles, move from vague interest in AI PM to a more credible career transition path.

## Target Audience

Primary audience:

- Chinese-speaking professionals aged roughly 24-34.
- Based in North America, or targeting North America roles.
- Not complete beginners; they usually have some work experience.
- Interested in transitioning into AI PM.

Highest-priority audience segments:

1. Non-technical professionals who want to package a credible AI project.
2. TPM, BA, consulting, operations, or adjacent-background professionals who want to transition into AI PM.

Secondary audience segments:

- PMs repositioning into AI PM.
- Data or analytics professionals who need stronger PM storytelling.
- SWE candidates who need to show product judgment beyond technical implementation.

## Commercial Problem

The audience may pay to solve:

- How to transition into AI PM from their current background.
- How to choose and scope an AI portfolio project.
- How to use AI tools to create a concrete artifact.
- How to explain the project from a PM perspective.
- How to prepare for AI PM interviews.
- How to translate existing work experience into AI PM-relevant stories.

Primary commercial wedge:

> AI portfolio / project coaching for non-technical or adjacent-background professionals who want to transition into AI PM.

Secondary wedge:

> AI PM mock interview and interview story coaching.

## Account Persona

Public self-reference:

> momo

Credible persona:

- 10+ years North America product manager.
- Actively upgrading PM toolset and mindset for the AI era.
- Recently practicing vibe coding and build-in-public.
- Turns messy AI learning into practical AI PM transition guidance.

The account should not overclaim:

- Not an AI expert.
- Not an ML researcher.
- Not a FAANG authority persona.
- No guaranteed offers.

## Product Requirements

The folder and UI should support:

- Strategy storage and updates.
- Topic sourcing from strategy, screenshots, trend inbox, and external signals.
- Topic prioritization and status tracking.
- Selection of topics into a post pipeline.
- Post draft generation and review.
- Visual direction selection.
- Image prompt generation.
- Optional image generation task creation or OpenAI image API integration.
- Performance tracking after publishing.
- Weekly pivot based on previous note performance.

### Daily NLJR

Each daily NLJR is a dated edition.

The Home page must:

- Show exactly the three highest-ranked recommended items when available.
- Show the full content-specific Summary, Why it matters, and Topic angle for
  those recommendations.
- Include a visible link to the dated full NLJR edition.

The dated NLJR page must:

- Include the same three deep recommendations shown on Home.
- Include up to seven additional qualifying new feeds, for up to ten total.
- Rank all items by relevance to momo's AI PM coaching, AI portfolio, AI Ops,
  product, career, and commercial strategy interests.
- Show items 4-10 in a concise scan format with title, source, date, direct
  link, concise content summary, and concise reason to read.
- Include fewer than ten items when not enough sources pass the reading,
  relevance, freshness, accessibility, and deduplication quality gates.

Each daily edition must be archived by date. Processed articles cannot appear
in a later edition.

## Non-Goals

This project is not currently intended to:

- Automate Xiaohongshu scraping or posting.
- Replace human selection of topics and style.
- Manage multiple accounts.
- Become a general social media management SaaS.
- Store data in a cloud database.

## Success Signals

Content success:

- Higher save rate.
- More comments that reveal commercial pain.
- More followers who match AI PM transition needs.
- More inbound questions about AI portfolio, AI PM transition, or interview preparation.

System success:

- The next post can be started from a known workflow.
- Past topic decisions are traceable.
- Drafts and visual decisions are easy to find.
- Performance can be reviewed before each weekly pivot.
