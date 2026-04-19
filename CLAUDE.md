# Purple Shirt Deliverable

This is a client deliverable built with the Purple Shirt component kit. Each page is composed from ordered JSON section files, themed with 6 CSS variables, and edited in-browser during dev mode.

## Project structure

```
src/
├─ content/sections/    ← Ordered JSON files. Each file = one page section.
│  ├─ 01-hero.json
│  ├─ 02-voices.json
│  └─ ...
├─ themes/theme.css     ← Client brand overrides (6 CSS variables)
├─ kit/                 ← Component library (components, styles, lib)
├─ components/          ← Dev-mode editor (editor.ts, editor.css, DevEditor.astro)
├─ layouts/SectionRenderer.astro  ← Maps section type → kit component
├─ pages/index.astro    ← Reads sections in order, renders them
└─ assets/              ← Client logo, images
```

## How sections work

Each file in `src/content/sections/` is a JSON object with a `type` field. Files render in filename sort order — prefix with `01-`, `02-`, etc. All sections support an optional `variant` field: `"auto"` (default — alternates light/dark by position), `"light"`, or `"dark"`.

Every section (except `header` and `footer`, which are excluded from the floating nav) also supports an optional `menuLabel` — a short label used only in the floating nav. It is never rendered on the component itself. If omitted, the nav falls back to `heading`, then `eyebrow`, then the section type.

## Available section types (16)

### header
Client logo + project title bar. Sits at the top of the page (above the hero). Self-styled — not affected by light/dark alternation.
```json
{
  "type": "header",
  "logo": "/assets/logo.svg",
  "logoAlt": "Client logo",
  "title": "Project Title"
}
```

### hero
Full-width hero with animated stat counters, accent headline, and CTAs.
```json
{
  "type": "hero",
  "eyebrow": "Pill badge text",
  "headline": "Main heading.\n**Accent-coloured part.**",
  "lede": "Subheading paragraph.",
  "stats": [{ "value": 85, "unit": "%", "label": "description" }],
  "ctas": [{ "label": "Button text", "href": "#target", "variant": "primary" }]
}
```

### hero-simple
Clean hero with headline only — no stats or CTAs. Same branded background as hero.
```json
{
  "type": "hero-simple",
  "eyebrow": "Badge text",
  "headline": "Main heading.\n**Accent-coloured part.**",
  "lede": "Subheading paragraph."
}
```

### voice-grid
Respondent cohort cards. Supports optional heading/badge.
```json
{
  "type": "voice-grid",
  "variant": "auto",
  "heading": "Who we heard from",
  "sectionNumber": "02",
  "voices": [
    { "percent": 53, "title": "Group name", "meta": "74 respondents", "description": "What this group represents.", "color": "#E4002B" }
  ]
}
```

### key-insights
Numbered card grid with titles and descriptions.
```json
{
  "type": "key-insights",
  "variant": "auto",
  "sectionNumber": "03",
  "heading": "Key findings",
  "subtitle": "Summary of what we learned.",
  "insights": [
    { "title": "Finding title", "text": "Finding description." }
  ]
}
```

### text-block
Title with optional lead text and two-column body.
```json
{
  "type": "text-block",
  "variant": "auto",
  "sectionNumber": "04",
  "heading": "Background",
  "leadText": "Introductory paragraph.",
  "columnOne": "<p>Left column HTML.</p>",
  "columnTwo": "<p>Right column HTML.</p>"
}
```

### numbered-list
Vertical numbered items with title and description.
```json
{
  "type": "numbered-list",
  "variant": "auto",
  "heading": "Steps",
  "subtitle": "How this works.",
  "items": [
    { "title": "Step title", "description": "Step description." }
  ]
}
```

### faq
Accordion of questions and answers. Answers support HTML.
```json
{
  "type": "faq",
  "variant": "auto",
  "heading": "Frequently asked questions",
  "items": [
    { "question": "Question text?", "answer": "<p>Answer HTML.</p>" }
  ]
}
```

### pie-chart
Animated donut chart with legend. Title and description on the left, chart on the right. Builds on scroll.
```json
{
  "type": "pie-chart",
  "variant": "auto",
  "heading": "Breakdown",
  "subtitle": "Distribution across categories.",
  "description": "<p>Optional longer description shown beside the chart.</p>",
  "slices": [
    { "label": "Category A", "value": 45, "color": "#e63946" },
    { "label": "Category B", "value": 30, "color": "#f4a261" }
  ]
}
```

### bar-chart
Horizontal bar graph with hover tooltips. Title and description on the left, bars on the right.
```json
{
  "type": "bar-chart",
  "variant": "auto",
  "sectionNumber": "03",
  "heading": "Response breakdown",
  "description": "<p>How responses were distributed.</p>",
  "bars": [
    { "label": "Category A", "value": 85, "color": "#e63946" },
    { "label": "Category B", "value": 72, "color": "#f4a261" }
  ],
  "unit": "%"
}
```

### data-table
Table with header row and body rows. All cells are strings (HTML allowed).
```json
{
  "type": "data-table",
  "variant": "auto",
  "heading": "Comparison",
  "headers": ["Feature", "Option A", "Option B"],
  "rows": [
    ["First item", "Yes", "No"],
    ["Second item", "Partial", "Yes"]
  ]
}
```

### feature-image
Contained card with text left and image right. Rounded corners, within page width.
```json
{
  "type": "feature-image",
  "variant": "auto",
  "eyebrow": "Featured",
  "heading": "Section title",
  "description": "<p>Description paragraph.</p>",
  "image": "/assets/photo.jpg",
  "imageAlt": "Alt text"
}
```

### carousel
Paginated text cards with left/right navigation.
```json
{
  "type": "carousel",
  "variant": "auto",
  "heading": "Roles",
  "items": [
    { "title": "Card title", "description": "<p>Card description.</p>" }
  ]
}
```

### image-carousel
Paginated feature-image cards with left/right navigation. Each slide has text + image.
```json
{
  "type": "image-carousel",
  "variant": "auto",
  "heading": "Featured stories",
  "slides": [
    { "eyebrow": "Story one", "heading": "Slide title", "description": "<p>Slide text.</p>", "image": "/assets/photo.jpg", "imageAlt": "Alt" }
  ]
}
```

### quote-carousel
Paginated quote cards with attribution. Each quote has a title, subtitle, and quote text.
```json
{
  "type": "quote-carousel",
  "variant": "auto",
  "heading": "What people said",
  "quotes": [
    { "quote": "Quote text here.", "title": "Jane Smith", "subtitle": "Club President" }
  ]
}
```

### flip-cards
Click-to-flip cards with image + title on the front and title + description on the back. Cards gently float up/down with randomised timing. Supports pagination.
```json
{
  "type": "flip-cards",
  "variant": "auto",
  "heading": "Featured cards",
  "subtitle": "Click a card to learn more.",
  "cardsPerPage": 3,
  "cards": [
    {
      "title": "Card title",
      "description": "<p>Back-side description.</p>",
      "image": "/assets/photo.jpg",
      "imageAlt": "Alt text"
    }
  ]
}
```

## Branding

Edit `src/themes/theme.css` — 6 variables control the entire brand:

```css
:root {
  --brand-primary: #...;          /* hero bg, headings, badges */
  --brand-primary-deep: #...;     /* gradient dark end */
  --brand-primary-mid: #...;      /* gradient light end */
  --brand-accent: #...;           /* CTAs, highlights */
  --brand-accent-deep: #...;      /* hover states */
  --brand-accent-secondary: #...; /* stat borders, accent text */
}
```

## Dev-mode editor

Run `npm run dev` — hover any section to see Edit/Delete/Drag controls. Use "+ Add section" to add new sections, "Brand colours" to edit the theme. All editor UI is stripped from production builds.

## Background alternation

Sections auto-alternate light/dark backgrounds. Hero is always self-styled. Set `"variant": "dark"` or `"variant": "light"` in any section's JSON to override.

## Commands

- `npm run dev` — Start dev server with editor UI
- `npm run build` — Production build to `dist/`
- `npm run preview` — Preview production build
