---
name: compose-deliverable
description: Generate a complete deliverable page from source material. Reads transcripts, notes, or briefs and produces themed section JSON files using the Purple Shirt component kit.
user_invocable: true
---

# Compose Deliverable

You are composing a client deliverable using the Purple Shirt component kit. The deliverable is a single-page site built from ordered JSON section files.

## What you do

1. **Read source material** — the user provides transcripts, notes, briefs, data, or a description of what the deliverable should contain.
2. **Propose a page structure** — suggest which section types to use and in what order. Present this as a short outline for approval before generating files.
3. **Generate section JSON files** — write each section as a numbered JSON file in `src/content/sections/`.
4. **Set the theme** — if the user provides brand colours, update `src/themes/theme.css`.

## Available section types

Read the full schemas in `CLAUDE.md` at the project root. Here is a summary:

| Type | Use when... |
|------|-------------|
| `hero` | Opening section — headline, stats, CTAs |
| `voice-grid` | Showing respondent/stakeholder cohorts with percentages |
| `key-insights` | 3-6 key findings or signals as numbered cards |
| `text-block` | Narrative content in two columns with a lead paragraph |
| `numbered-list` | Sequential steps, recommendations, or priorities |
| `faq` | Questions and answers (accordion) |
| `pie-chart` | Showing proportional breakdown of data |
| `data-table` | Comparing features, options, or data in columns |
| `feature-image` | Highlighting a key point with a supporting image |
| `carousel` | Multiple items (jobs, profiles, case studies) paginated |
| `image-carousel` | Multiple feature-image cards with pagination |

## Composition rules

- **Hero is always first.** Every deliverable starts with a hero section.
- **Alternate light/dark.** Set `"variant": "auto"` on all sections (the default). The renderer handles alternation. Only override with `"dark"` or `"light"` when you have a specific reason.
- **Section numbers are optional.** Use `"sectionNumber": "01"` etc. when the deliverable has a formal chapter structure. Skip for informal pages.
- **3-8 sections is typical.** Don't over-section. A focused deliverable is better than a long one.
- **Voice-grid early, FAQ late.** Respondent breakdown works near the top. FAQ works near the end.
- **Use real content.** Extract actual findings, quotes, data from the source material. Don't use placeholder text.
- **Headline accent.** In the hero, wrap the most impactful phrase in `**double asterisks**` for the accent colour.
- **Stats from data.** Pull real numbers for the hero stats — response count, percentage, participation rate.
- **Pie chart colours.** Use 4-6 slices max. Pick distinct colours. The kit defaults work well: `#e63946`, `#f4a261`, `#2a9d8f`, `#457b9d`, `#264653`, `#e9c46a`.

## Workflow

### Step 1: Understand the brief

Ask the user:
- What source material do they have? (transcripts, notes, data, brief)
- Who is the audience? (board, clients, public)
- What's the client brand? (colours, or use defaults)
- Any specific sections they want?

If they provide a file path, read it. If they paste content, work from that.

### Step 2: Propose structure

Present a numbered outline like:

```
Proposed structure:
1. hero — "Movement has spoken" with 3 key stats
2. voice-grid — 4 respondent cohorts
3. key-insights — 6 key signals
4. text-block — Background and methodology
5. pie-chart — Response distribution
6. faq — Common questions from consultation
```

Wait for approval. Adjust if the user wants changes.

### Step 3: Generate files

For each section, write a JSON file:
- `src/content/sections/01-hero.json`
- `src/content/sections/02-voice-grid.json`
- etc.

**Delete any existing section files first** to start clean (unless the user says to keep them).

### Step 4: Set theme (if needed)

If the user provides brand colours, update `src/themes/theme.css`:

```css
:root {
  --brand-primary: #...;
  --brand-primary-deep: #...;
  --brand-primary-mid: #...;
  --brand-accent: #...;
  --brand-accent-deep: #...;
  --brand-accent-secondary: #...;
}
```

### Step 5: Verify

Tell the user to check `http://localhost:4321` (or whatever port the dev server is on). If they report issues, fix them.

## Example: consultation summary

Source: a consultation with 140 responses across 4 groups, finding that 85% want a hybrid model.

```
01-hero.json      → hero with "The movement has spoken" headline, 3 stats (85%, 140 responses, 97% participation)
02-voices.json    → voice-grid with 4 cohorts (clubs 53%, staff 40%, committee 6%, reference 2%)
03-insights.json  → key-insights with 6 key signals from the data
04-breakdown.json → pie-chart showing response distribution
05-detail.json    → text-block with methodology and context
06-faq.json       → faq addressing common questions raised
```

## Important

- Always read `CLAUDE.md` in the project root for the latest section schemas — they may have been updated since this skill was written.
- Section files are plain JSON. No frontmatter, no markdown wrapper.
- The `type` field must exactly match one of the 11 registered types.
- HTML is supported in `description`, `answer`, `columnOne`, `columnTwo` fields — wrap text in `<p>` tags.
- Images can be URLs or local paths in `src/assets/`.
