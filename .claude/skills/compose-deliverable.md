---
name: compose-deliverable
description: Generate a complete deliverable page from source material. Reads transcripts, notes, or briefs and produces themed section JSON files using the Purple Shirt component kit.
user_invocable: true
---

# Compose Deliverable

You are composing a client deliverable using the Purple Shirt component kit. The deliverable is a single-page site built from ordered JSON section files.

## Pair this skill with the `writing` skill

This skill governs **structure** (which component, in what order, with what JSON shape). The `writing` skill governs **prose** (voice, tone, sentence shape, what a Purple Shirt deliverable sounds like).

**Whenever you draft any text content** — headlines, ledes, eyebrows, card titles and descriptions, quote attributions, subtitles, FAQ answers, table cells, struggles/opportunities, JTBD statements, anything a reader will see — first invoke or read the `writing` skill (`anthropic-skills:writing`) and apply its conventions.

In practice that means:
- Before generating section JSON, load the writing skill once at the start of the job
- Apply its voice/tone/structure conventions to every text field you fill in
- If the writing skill conflicts with sizing guidance in this skill (e.g. "card titles 2–6 words"), the sizing guidance here wins because it's component-specific; the writing skill governs everything else (word choice, register, clarity, NZ English, etc.)

## What you do

1. **Read source material** — the user provides transcripts, notes, briefs, data, or a description of what the deliverable should contain.
2. **Load the `writing` skill** — apply its conventions to all prose you draft below.
3. **Propose a page structure** — suggest which section types to use and in what order. Present this as a short outline for approval before generating files.
4. **Generate section JSON files** — write each section as a numbered JSON file in `src/content/sections/`. All text fields drafted using writing-skill conventions.
5. **Set the theme** — if the user provides brand colours, update `src/themes/theme.css`.

## Content type → Component (start here)

When reading source material, **identify the content type first, then pick the component**. This table covers the recurring content types in Purple Shirt deliverables. The first row in each block is the default — pick an alternate only if the default doesn't fit.

### Insights, observations, summaries
| Content type | Default | Alternates | Notes |
|---|---|---|---|
| **Research insights / findings** | `key-insights` | `numbered-list` (if ranked), `flip-cards` (if image-driven) | Aim for 3–6 cards. One sentence title + one sentence body each. |
| **Observations** (what we noticed) | `key-insights` | `text-block` (narrative), `numbered-list` | If observations have a logical sequence, use numbered-list. |
| **Summaries** (executive / chapter) | `key-insights` (3–6 points) | `text-block` (narrative), `hero` (if leading with stats) | A summary section near the top is great. |
| **Context / background** | `text-block` | `hero-simple` (if it's the framing of the whole doc) | Two-column layout fits framing prose well. |

### People & voices
| Content type | Default | Alternates | Notes |
|---|---|---|---|
| **User / customer types** (personas) | `customer-type` | `voice-grid` (if percentage-driven), `flip-cards` (if you only have name + image + blurb) | Customer-type holds **struggles + opportunities** on the back. Use it when you have that depth. |
| **Customer modes** (states/contexts a user is in) | `customer-type` | `voice-grid`, `flip-cards` | Modes act like personas but lighter. If each mode has struggles/opps → customer-type. Otherwise flip-cards. |
| **Customer cohorts** (groups with %) | `voice-grid` | `pie-chart` (if proportional), `bar-chart` (if comparative) | Voice-grid is the right pick when you have a percentage and a one-line descriptor per group. |
| **Quotes** (verbatim) | `quote-carousel` (3+) | `quote-block` (1 hero quote) | Trim ums. Keep authentic but tight. Always include attribution. |

### Action & direction
| Content type | Default | Alternates | Notes |
|---|---|---|---|
| **Recommendations** | `numbered-list` | `key-insights` (if non-sequential), `flip-cards` (if each rec has back-side detail) | Recommendations are usually ordered — numbered-list signals priority. |
| **Design principles** | `numbered-list` | `key-insights`, `flip-cards` (front: principle, back: rationale) | Principles benefit from a number + name + one-line rationale. |
| **Jobs to be done** | `flip-cards` | `numbered-list` (if short statements only), `key-insights` | JTBDs are usually text-heavy. **Front**: the JTBD statement ("When [context] I want [motivation] so that [outcome]"). **Back**: supporting detail — triggers, current workarounds, success criteria, related frustrations. Use `numbered-list` only if you genuinely have one-liners with no back-side detail. |
| **Activities** (what happens) | `numbered-list` | `customer-journey` (if stage-based), `carousel` (if many to browse) | Sequential = numbered-list. Stage-based with phases = customer-journey. |

### Frameworks & journeys
| Content type | Default | Alternates | Notes |
|---|---|---|---|
| **Customer journey** | `customer-journey` | `numbered-list` (if simple linear) | Use customer-journey when there are stages and touchpoints to map. |
| **Models / frameworks** (e.g. barriers to adoption) | `key-insights` | `flip-cards` (front: name, back: description), `data-table` (if matrix), `numbered-list` | Pick by structure: list-of-named-things → key-insights; named-things-with-back-detail → flip-cards; rows×cols → data-table. |
| **Technology enablers** | `image-carousel` (if rich) | `feature-image` (single hero), `numbered-list`, `data-table` (comparison) | If each enabler has a logo/screenshot + meaty description, image-carousel is best. |

### Data
| Content type | Default | Alternates | Notes |
|---|---|---|---|
| **Proportional breakdown** (parts of a whole) | `pie-chart` | `bar-chart` | Pie if values sum to 100%. |
| **Comparative magnitudes** | `bar-chart` | `pie-chart`, `data-table` | Bars if categories are independent quantities. |
| **Tabular data / option comparison** | `data-table` | `bar-chart` (if visualisable) | When you need rows × columns and the structure matters. |

### Q&A
| Content type | Default | Alternates | Notes |
|---|---|---|---|
| **FAQ** | `faq` | — | Always near the end. |

### A note on flip-cards
`flip-cards` is the most flexible card-based component — it can hold almost anything. The cost is interaction (the user has to click). Reach for it when:
- The front would be visually striking on its own (you have good imagery)
- The back-side detail is genuinely worth a click (not the same info reformatted)
- The set is exploratory rather than reference (e.g. "options to consider" not "facts to remember")

If the reader needs all the info in one glance, use `key-insights` or `numbered-list` instead.

## Available section types

Read the full schemas in `CLAUDE.md` at the project root for exact field definitions. **Always check CLAUDE.md before generating** — the schema list is the source of truth and may have been updated since this skill was written.

Pick the right component for the job. The kit covers four broad needs:

### Frame & narrative
| Type | Use when... |
|------|-------------|
| `header` | Top-of-page client logo + project title bar. Sticky on scroll. |
| `hero` | Opening section with headline, **animated stats**, and CTAs. Use when there are key numbers to lead with. |
| `hero-simple` | Opening section with just headline + lede. Use when there are no killer stats or you want a calmer entry. |
| `text-block` | Two-column narrative with optional lead paragraph. Use for background, methodology, framing, or context. |
| `numbered-list` | Sequential items: steps, recommendations, priorities, principles. |
| `feature-image` | Single highlight: text on the left, supporting image on the right. |
| `footer` | Closing block — sign-off, prepared-by line. |

### Findings & data
| Type | Use when... |
|------|-------------|
| `key-insights` | 3–6 numbered cards summarising **what we found**. The most common findings section. |
| `voice-grid` | Respondent / stakeholder cohorts with percentages and short descriptors. Best near the top. |
| `pie-chart` | Proportional breakdown — animates on scroll, has title + description on the left, chart + legend on the right. |
| `bar-chart` | Horizontal bars with hover tooltips for values. Title + description on left, chart on right. |
| `data-table` | Comparing options/features across columns, or showing structured tabular data. |

### Voices & people
| Type | Use when... |
|------|-------------|
| `quote-carousel` | A series of quotes paginated with dots/arrows. Speech-themed soundwave background. Best for 3–10 quotes. |
| `quote-block` | A single hero quote with eyebrow + attribution. Use for one really important quote. |
| `customer-type` | Up to 4 persona cards. **Front**: image + name + description. **Back** (click to flip): struggles + opportunities. Cards float gently. |

### Multi-item explorers
| Type | Use when... |
|------|-------------|
| `carousel` | Paginated text cards (title + description). Use for things like job descriptions, role profiles, case study summaries. |
| `image-carousel` | Paginated feature-image cards (eyebrow + heading + description + image per slide). |
| `flip-cards` | Click-to-flip cards in a paginated row. **Front**: image + title. **Back**: title + description. Cards float. Use for concepts, stories, options where front-side mystery encourages exploration. |
| `customer-journey` | Map a journey across stages with phases and touchpoints. |
| `faq` | Accordion of questions and answers. Best near the end. |

## Choosing between similar components

A few choices come up often — here's how to decide:

- **`hero` vs `hero-simple`** — Use `hero` only when you have 1–5 strong stats to lead with. Otherwise `hero-simple`.
- **`pie-chart` vs `bar-chart`** — Pie for parts-of-a-whole (must add to ~100%). Bar for comparisons across categories where values are independent.
- **`quote-carousel` vs `quote-block`** — Carousel for 3+ quotes the reader can browse. Block when one quote is the centrepiece of the section.
- **`carousel` vs `flip-cards` vs `image-carousel`** — Carousel for text-only items (e.g. job descriptions). Flip-cards when you have an image AND want the back to reveal extra detail. Image-carousel when each slide is a fully-formed story with title, eyebrow, and description.
- **`customer-type` vs `voice-grid`** — Customer-type for **personas** (depth: image, struggles, opportunities). Voice-grid for **cohorts** (breadth: percentages, group names, short descriptors).
- **`key-insights` vs `numbered-list`** — Insights for **findings** (what we learned). Numbered-list for **actions** (what to do, in order).

## Composition rules

- **Header is optional but recommended.** If the project has a client brand to put up front, lead with `header`.
- **Hero is mandatory.** Every deliverable has either `hero` or `hero-simple` as the first content section.
- **Alternate light/dark.** Set `"variant": "auto"` on all sections (the default). The renderer handles alternation. Only override with `"dark"` or `"light"` when you have a specific reason.
- **Section numbers are optional.** Use `"sectionNumber": "01"` etc. when the deliverable has a formal chapter structure. Skip for informal pages.
- **3–10 sections is typical.** Don't over-section. A focused deliverable beats a long one. If you find yourself adding a 12th section, the document is probably trying to do too much.
- **Voice/cohorts early, FAQ late.** Respondent breakdown works near the top to set the data foundation. FAQ works near the end.
- **Use real content.** Extract actual findings, quotes, data from the source material. Don't use placeholder text in production deliverables.
- **Headline accent.** In the hero, wrap the most impactful phrase in `**double asterisks**` for the accent colour. Use `\n` for line breaks in the headline.
- **Stats from data.** Pull real numbers for the hero stats — response count, percentage, participation rate. Stats need to be a real `number` field, not a string.
- **Chart colours.** Use 4–6 slices/bars max. Pick distinct colours. The kit defaults work well: `#e63946`, `#f4a261`, `#2a9d8f`, `#457b9d`, `#264653`, `#e9c46a`.

## Card components — content guidance

Card-based sections (flip-cards, customer-type, carousels, key-insights) are easy to misuse by stuffing too much text. Keep these short:

- **Card titles**: 2–6 words. They're a label, not a sentence.
- **Card descriptions on the front**: 1–2 sentences max. Front faces are about hooking attention.
- **Card backs (flip-cards, customer-type)**: 2–4 sentences OR a short bulleted list. The reader has clicked to learn more, but they shouldn't be reading an essay.
- **Customer-type struggles & opportunities**: 2–4 bullets each, each bullet one sentence. Specific verbs > vague descriptions.
- **Quote text**: 1–3 sentences. Trim ums/repetition. Keep voice authentic but don't ramble.

For flip-cards, choose **images that hint at the concept** without giving the back away — the reader should want to flip.

## Workflow

### Step 1: Understand the brief

Ask the user:
- What source material do they have? (transcripts, notes, data, brief)
- Who is the audience? (board, clients, public)
- What's the client brand? (colours, or use defaults)
- Any specific sections they want?

If they provide a file path, read it. If they paste content, work from that.

### Step 2: Inventory content types, then propose structure

**Don't jump straight to components.** First, scan the source material and list what *types* of content are in there. This forces an honest mapping rather than reaching for whatever component seems flashy.

Useful inventory categories (use whichever apply):
- Context / background
- Research insights / findings
- Observations
- Customer types or personas
- Customer modes
- Customer journey
- Jobs to be done
- Design principles
- Recommendations
- Activities (what happens)
- Quotes (verbatim)
- Models / frameworks (e.g. barriers to adoption)
- Technology enablers
- Stats / proportional data / comparative data
- Summaries / executive overview
- Open questions / FAQ

Then map each content type to a component using the **Content type → Component** table above. If two content types want the same component, decide whether to merge them or pick a different component for one.

Present the proposed structure with the **content type AND component** for each section, like this:

```
Proposed structure:
1. header        — Client logo + project title
2. hero          — Executive summary with 3 key stats
3. voice-grid    — 4 respondent cohorts (% breakdown)
4. key-insights  — 6 research insights
5. customer-type — 4 personas (image, struggles, opportunities)
6. numbered-list — 5 design principles
7. quote-carousel — 6 representative quotes
8. flip-cards    — 4 barriers to adoption (name on front, mitigation on back)
9. flip-cards    — 5 jobs to be done (JTBD statement on front, triggers + success criteria on back)
9. numbered-list — 5 prioritised recommendations
10. text-block   — Methodology & next steps
11. faq          — Common questions raised
```

Wait for approval. Adjust if the user wants changes.

### Step 3: Generate files

**Before drafting any prose, load the `writing` skill** (`anthropic-skills:writing`) if you haven't already. Every text field you populate — headlines, ledes, eyebrows, card titles, descriptions, struggle/opportunity bullets, JTBD statements, FAQ answers, quote attributions, table cells, button labels — must follow its voice/tone/structure conventions. Component-specific sizing rules in this skill (e.g. "card titles 2–6 words") still win over generic writing rules; everything else (word choice, register, NZ English, sentence shape) comes from the writing skill.

For each section, write a JSON file:
- `src/content/sections/00-header.json`
- `src/content/sections/01-hero.json`
- `src/content/sections/02-voice-grid.json`
- etc.

Use `00-` for header so it sorts before the hero. Use `99-` for footer so it sorts last.

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

Tell the user to check `http://localhost:4321` (or whatever port the dev server is on). If they report issues, fix them. Run `npm test` if you want to confirm structural validity.

## Assets

Images referenced as `/assets/foo.jpg` must exist in `public/assets/foo.jpg`. If you need to add an image, drop it in `public/assets/` first or use a stock URL.

## Important

- **Always read `CLAUDE.md` in the project root for the latest section schemas.** The list above may have drifted.
- Section files are plain JSON. No frontmatter, no markdown wrapper.
- The `type` field must exactly match one of the registered types in `src/layouts/SectionRenderer.astro` (its `knownTypes` array is the source of truth).
- HTML is supported in `description`, `answer`, `columnOne`, `columnTwo`, and similar long-text fields — wrap text in `<p>` tags.
- Images can be URLs or local paths under `/assets/...` (mapped to `public/assets/`).
