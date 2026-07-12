# Image Prompts: AI PM Project Proof

## Source

```yaml
post_id: 2026-06-10-ai-pm-project-proof
visual_style_file: content_pipeline/drafts/2026-06-10_ai-pm-project-proof_visual-style-options.md
status: image_prompts_ready
owner: momo
date: 2026-06-11
aspect_ratio: 3:4
selected_style: "Option B: Clean Notion Workbook with darker cover"
generation_mode: "generate editable visual backgrounds / layout frames first, add final Chinese text manually"
```

## Global Style Lock

Use one consistent visual system across all pages:

- Format: 3:4 vertical Xiaohongshu carousel.
- Cover: darker graphite cover for stronger hook.
- Inner pages: clean Notion-style workbook, warm off-white / light gray background, white cards, charcoal text placeholders.
- Accent: muted red, used sparingly for warnings, highlights, arrows, and selected labels.
- Typography: modern sans-serif placeholder typography, similar to Inter / SF Pro / HarmonyOS Sans.
- Texture: premium product-strategy workbook, not PPT, not course-sales poster.
- Text policy: do not generate final Chinese text inside the image. Generate clear text blocks, title areas, and label placeholders; final Chinese copy should be added manually in layout.

## Global Negative Prompt

```text
No cheap blue-purple gradient, no random neon lines, no distorted Chinese text, no tiny dense body text, no PPT bullet-slide feeling, no plastic 3D icons, no childish cartoon style, no cluttered decorations, no fake course-sales poster, no aggressive sales CTA, no elements blocking title safe area, no glossy tech cliche, no overwhelming shadows, no stock-photo corporate people.
```

## Page 1: Cover

```yaml
page_goal: earn the click and frame the topic as serious but useful
manual_text:
  headline: "想转 AI PM，先做一个经得住追问的 project"
  subheadline: "不是炫技 demo，也不是 PDF 作品集"
  small_note: "AI PM Portfolio / Project Proof"
layout_notes:
  - top-left title area should take 35-45% of the page
  - central visual should be a project dossier card
  - keep enough empty space for Chinese headline
```

Prompt:

```text
Create a 3:4 vertical Xiaohongshu carousel cover for an AI PM portfolio coaching post. Use a dark graphite background, premium Notion-style project dossier card in the center, and a large empty headline safe area in the top-left. The dossier card should include clean English placeholder tags: Problem, AI fit, Workflow, Metrics, Tradeoff. Add subtle muted red annotation lines and small interview-question card elements around the dossier. The mood is sharp, professional, diagnostic, and save-worthy. Use modern sans-serif placeholder typography, white and warm gray text zones, restrained muted red accents. Do not generate real Chinese body text; only create clear title placeholders and layout structure.
```

Negative prompt:

```text
No sales poster, no big CTA button, no fake course ad, no distorted Chinese, no neon purple tech gradient, no cyberpunk background, no cluttered file stack, no tiny unreadable text.
```

Pick if:

- The title area is clean enough for large Chinese text.
- The project dossier is visible and premium.
- It feels like a PM case file, not a course landing page.

## Page 2: Problem Reframe

```yaml
page_goal: make the reader recognize why most AI portfolio attempts fail
manual_text:
  headline: "很多 AI portfolio，一追问就散"
  subheadline: "不是不努力，是 project 没有 PM 味"
  body: "只展示工具和界面，很容易变成 toy demo。AI PM project 要回答：问题为什么值得做，AI 为什么适合，做完怎么验证。"
layout_notes:
  - split comparison: toy demo vs PM project
  - left side slightly messy, right side structured
```

Prompt:

```text
Create a 3:4 vertical diagnostic comparison page in a clean Notion workbook style. Warm off-white background. Two-column layout: left column represents "toy demo" with scattered small UI fragments and weak structure; right column represents "PM project" with a clean project brief card, structured fields, and check marks. Use muted red accents on the left and charcoal / soft mint accents on the right. Reserve a clear top title area and two short body text zones. The page should feel calm, premium, and mobile-readable. Do not generate real Chinese body text; only placeholders.
```

Negative prompt:

```text
No messy collage, no unreadable screenshots, no harsh red-green contrast, no childish icons, no dense bullet list, no PPT comparison table.
```

Pick if:

- The contrast between demo and PM project is immediately readable.
- It feels structured, not chaotic.

## Page 3: Interviewer Lens

```yaml
page_goal: show the five things interviewers are really testing
manual_text:
  headline: "面试官追问 project，其实在看 5 件事"
  subheadline: "不是听你背 AI 名词"
  checklist:
    - "用户问题是否具体"
    - "业务价值是否清楚"
    - "AI 在 workflow 里解决什么"
    - "能力边界是否讲得明白"
    - "指标和 tradeoff 是否像 PM"
layout_notes:
  - five compact checklist modules
  - each module gets one short label area
```

Prompt:

```text
Create a 3:4 vertical premium checklist page showing five compact diagnostic modules. Style: Clean Notion workbook, warm light-gray background, white cards, charcoal placeholder text, subtle muted red highlight marker, small minimal line icon placeholders. The layout should communicate interview evaluation criteria: five stacked cards or a 2+3 grid, with strong hierarchy and large title safe area. It should feel like a professional PM interview checklist, not a school worksheet. Do not generate real Chinese body text; only text placeholders and clean module labels.
```

Negative prompt:

```text
No school worksheet, no exam paper, no tiny text, no generic checklist clipart, no loud colors, no cartoon interviewer.
```

Pick if:

- Five modules are clear and balanced.
- Page feels save-worthy.

## Page 4: Project-Proof Checklist

```yaml
page_goal: create the most save-worthy page in the carousel
manual_text:
  headline: "能放进 portfolio 的 AI project，至少要有这 6 块"
  subheadline: "你可以用它自测"
  blocks:
    - "Problem: 谁的什么痛？"
    - "User: 哪个场景反复发生？"
    - "AI fit: 为什么 AI 更适合？"
    - "Workflow: AI 插在哪一步？"
    - "Metrics: 怎么证明变好了？"
    - "Tradeoff: 成本、质量、信任怎么取舍？"
layout_notes:
  - six connected blocks
  - make this page clean and highly readable
```

Prompt:

```text
Create a 3:4 vertical framework map for an AI PM portfolio project checklist. Use six connected blocks arranged as a clean workflow: Problem, User, AI fit, Workflow, Metrics, Tradeoff. Use warm off-white cards on a light gray background, with a thin muted red line connecting the blocks. Keep the page highly structured, premium, and save-worthy, like a product strategy workbook page. Reserve a clear top title area and a small bottom note area. Do not generate real Chinese body text; use English block labels only if needed and leave space for manual Chinese text.
```

Negative prompt:

```text
No dense mind map, no spaghetti arrows, no tiny labels, no colorful SaaS dashboard, no PPT SmartArt feeling, no 3D plastic blocks.
```

Pick if:

- This can work as a standalone saved checklist.
- Six blocks are spacious enough for manual Chinese overlay.

## Page 5: Nontechnical Background Reassurance

```yaml
page_goal: reassure nontechnical readers without lowering the standard
manual_text:
  headline: "非技术背景，不需要装成 engineer"
  subheadline: "但你要讲清楚 product logic"
  body: "你可以不训练模型，但不能只说：我用了 ChatGPT。你要讲清楚输入、判断、使用方式和失败兜底。"
layout_notes:
  - PM connects user workflow and AI module
  - avoid coding-hero imagery
```

Prompt:

```text
Create a 3:4 vertical editorial diagram page in a warm Notion workbook style. Show a product manager workflow canvas connecting a user journey on the left and an AI module on the right. The visual should imply product logic, workflow design, and AI collaboration, not engineering heroism. Use clean line diagrams, white cards, warm neutral background, charcoal text placeholders, muted red accents. Reserve a clear title area at the top and two short body text zones. No code-heavy visuals, no engineer portrait, no stock-photo people. Do not generate real Chinese body text.
```

Negative prompt:

```text
No programmer hero, no glowing code wall, no machine learning lab, no stock office photo, no robotic hand, no dense technical diagram.
```

Pick if:

- Nontechnical readers feel included.
- The image still feels professional and PM-oriented.

## Page 6: Portfolio Asset Kit

```yaml
page_goal: show what the project becomes as concrete deliverables
manual_text:
  headline: "最后把 project 包装成 4 个资产"
  subheadline: "别只扔一个链接"
  cards:
    - "1-page PM case study"
    - "Prototype / demo"
    - "3-minute interview story"
    - "GitHub / demo video proof"
layout_notes:
  - four asset cards like a portfolio kit
  - practical and premium
```

Prompt:

```text
Create a 3:4 vertical portfolio kit layout in a clean Notion workbook aesthetic. Show four neatly arranged asset cards: one-page PM case study, prototype/demo, 3-minute interview story, GitHub or demo video proof. Use warm off-white background, white cards, charcoal labels, subtle muted red tags, and consistent spacing. The page should feel like a practical deliverable package for AI PM candidates, premium but not salesy. Reserve a clear top title area. Do not generate real Chinese body text; English short labels are acceptable as placeholders.
```

Negative prompt:

```text
No generic file icons only, no resume template, no course bundle ad, no download button, no excessive shadows, no clutter.
```

Pick if:

- The four deliverables feel tangible.
- It looks like a portfolio system, not a product checkout page.

## Page 7: Comment Template

```yaml
page_goal: invite comments without hard-selling
manual_text:
  headline: "不知道你的 project 能不能讲成 AI PM portfolio？"
  subheadline: "可以先用一句话留言"
  form_fields:
    - "现在背景"
    - "目标岗位"
    - "project idea"
  note: "我会挑几个典型例子，公开拆怎么改得更像 AI PM project。"
layout_notes:
  - clean form card
  - low-pressure diagnostic CTA
  - no Calendly
```

Prompt:

```text
Create a 3:4 vertical closing card for a Xiaohongshu carousel. Visual task: invite readers to comment with background, target role, and project idea. Use a clean form-like diagnostic template with three fields: Background, Target Role, Project Idea. Warm off-white background, white form card, charcoal text placeholders, muted red accent line, friendly but professional momo-style tone. The card should feel like a PM portfolio diagnostic worksheet, not a sales page. Reserve title and subtitle space at the top. Do not generate real Chinese body text.
```

Negative prompt:

```text
No public Calendly CTA, no "book now" button, no course-sales poster, no aggressive lead capture form, no stock customer support imagery.
```

Pick if:

- The comment prompt feels natural and low-pressure.
- The form fields are spacious enough for manual Chinese text.

## Generation Workflow

```yaml
step_1: Generate Page 1 and Page 4 first to test the style.
step_2: If Page 1 is too plain, darken only the cover; keep inner pages clean.
step_3: Once Page 1 and Page 4 are approved, generate Pages 2, 3, 5, 6, 7 in the same visual system.
step_4: Add final Chinese text manually after image generation.
step_5: Review on mobile size before publishing.
```

## Style Acceptance Checklist

- The cover has a strong hook area.
- Inner pages feel like a workbook/checklist, not PPT.
- Page 4 is clean enough to be saved.
- No generated Chinese body text is distorted.
- The whole set feels like one visual system.
- The visual tone is diagnostic and useful, not hard-selling.
