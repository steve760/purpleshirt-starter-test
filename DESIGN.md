# Purple Shirt — Design System Reference

A complete inventory of tokens, spacing, animations, and every component in this deliverable kit. All components reference only the CSS variables defined below; overriding the 6 brand variables in `src/themes/theme.css` rethemes the entire page.

---

## 1. Design tokens

Defined in `src/kit/styles/tokens.css`. Client themes override only the 6 brand variables.

### Colour — brand (themeable)

| Variable | Default | Used for |
|---|---|---|
| `--brand-primary` | `#1a1a2e` | Hero bg, headings, badges |
| `--brand-primary-deep` | `#0f0f1e` | Gradient dark end |
| `--brand-primary-mid` | `#2a2a4e` | Gradient light end |
| `--brand-accent` | `#e63946` | CTAs, highlights |
| `--brand-accent-deep` | `#c1121f` | Hover states |
| `--brand-accent-secondary` | `#f4a261` | Stat borders, accent text |

### Colour — surfaces & text

| Variable | Default |
|---|---|
| `--surface` | `#f7f5ef` |
| `--surface-alt` | `#efead8` |
| `--surface-card` | `#ffffff` |
| `--surface-dark` | `var(--brand-primary)` |
| `--text` | `#1a2236` |
| `--text-muted` | `#556077` |
| `--text-on-dark` | `#ffffff` |
| `--text-on-dark-muted` | `rgba(255,255,255,0.68)` |

### Borders & shadows

| Variable | Default |
|---|---|
| `--line` | `rgba(0,0,0,0.12)` |
| `--line-dark` | `rgba(255,255,255,0.12)` |
| `--shadow` | `0 8px 30px rgba(0,0,0,0.10)` |
| `--radius` | `14px` |

### Layout & typography

| Variable | Default |
|---|---|
| `--maxw` | `1260px` |
| `--font-body` | `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif` |
| `--font-display` | `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif` |

Base body `font-size: 16px`, `line-height: 1.55`, weight `400`, font-smoothing antialiased. Headings `h1/h2` weight `800`; `h3` weight `700`. `letter-spacing: 0.005em` on `h1/h2/h3`.

---

## 2. Spacing & layout

### Section padding pattern (vertical × horizontal)

Almost every section uses the same centring formula on the horizontal axis:

```css
padding: 96px max(28px, calc((100% - var(--maxw)) / 2));
```

This keeps content within a 1260 px column, with a minimum 28 px gutter on narrow viewports.

| Component | Vertical padding | Notes |
|---|---|---|
| Hero | `96px ... 96px` | Same horizontal pattern |
| Header | `18px` | Short bar |
| Footer | `32px` | Short strip |
| Quote Carousel | `0` vertical | Own internal padding |
| Quote Block | `56px` top / bottom | Narrower bleed |
| Customer Journey | `64px` top / bottom | Shorter due to visual rhythm |
| All others | `96px` top / bottom | Standard |

### Mobile overrides

Global: below `600px`, `.ps-section { padding: 64px 18px; }`.

Per-component breakpoints:

| Width | Components affected |
|---|---|
| `900px` | VoiceGrid (grid collapse), CustomerType (2→1 cols) |
| `820px` | CustomerJourney |
| `768px` | FeatureImage (stack), ImageCarousel, FlipCards |
| `720px` | QuoteBlock |
| `600px` | Most components — reduced padding, smaller type |
| `520px` | VoiceGrid (tightest) |

### Floating-nav right reservation

On viewports `>= 1200px`, the floating nav occupies the top-right 260 px. To prevent content from sliding beneath it, the section-padding rule in `floating-nav.css` reserves extra right padding:

```css
.ps-section, .ps-hero, .ps-header, .ps-feature-section, .ps-footer-section {
  padding-right: max(28px, calc((100% - var(--maxw)) / 2), 296px);
}
```

---

## 3. Animation & transition system

### Reveal-on-scroll (global)

Defined in `base.css` and driven by `src/kit/lib/animations.ts`.

- `.ps-reveal` — initial: `opacity: 0; translateY(12px)`. Transition `0.7s cubic-bezier(0.25, 0.1, 0.25, 1)`.
- `.ps-reveal.in` — applied by IntersectionObserver (`threshold: 0.08`, `rootMargin: 0 0 -40px 0`).
- `.ps-reveal-child` — children within a revealed section get a staggered `0.5s` transition with delay `((index % 6) * 0.08)s`.
- The Hero never gets `.ps-reveal` (it's above-the-fold).
- When the user scrolls back to top (`scrollY < 20`), all reveals reset and re-observe — animations replay on next downward scroll.

### Chart-specific animations (JS-driven)

Defined in `animations.ts`. Each uses its own IntersectionObserver.

**Pie chart** (`threshold: 0.3`):
- Paths: `opacity 0.4s ease` + `transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)`, staggered `i * 0.1s`.
- Inner circle: fades + scales last.

**Bar chart** (`threshold: 0.15`):
- Bar fills: `width 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)`, staggered `i * 0.08s`.

### Counter animation

`src/kit/lib/counter.ts` drives the Hero stat counters (0 → target value) when they enter the viewport.

### Keyframes defined in component CSS

| Name | File | Duration | Purpose |
|---|---|---|---|
| `ps-feature-zoom` | feature-image.css | 9s infinite | Slow zoom pulse on featured image (1 → 1.08 scale) |
| `qwave` | quote-carousel.css | 5s infinite | Ambient soundwave background bars |
| `qwave-burst` | quote-carousel.css | 0.5s one-shot | Burst effect applied to wave on slide change |
| `ps-flipcards-float` | flip-cards.css | per-card (4–8s) infinite | Gentle floating motion, per-card random offset |
| `ps-persona-float` | customer-type.css | per-card (4–8s) infinite | Same float pattern on persona cards |

All infinite motion animations respect `@media (prefers-reduced-motion: reduce)` and fall back to a static state.

### Common transitions

- Buttons (`.ps-btn`): `transform 0.15s ease, background 0.2s ease`. `ps-btn-primary:hover` lifts `translateY(-1px)`.
- Floating nav links: `background 0.15s, color 0.15s`. Active link gets brand-primary bg.
- Flip cards / personas: `transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)` on `.flipped`.
- FAQ toggle: icon `transform 0.2s ease`.
- BarChart hover tooltip: `opacity 0.15s ease`, bar `filter 0.2s ease`.
- Flip icon (top-right of flippable cards): `transform 0.25s ease` — rotates 180° on card hover.

---

## 4. Components (alphabetical)

Every component has a `variant` prop: `"auto"` (alternate light/dark by position), `"light"`, or `"dark"`. All except `header` and `footer` also accept an optional `menuLabel` string that shows in the floating nav only — it is never rendered on the component itself.

Each component below lists its **Props** (TypeScript), **HTML structure** (compact class tree), and full **CSS** breakdown: section, typography, layout, interactions, animations, dark variant, mobile breakpoints, and reduced-motion handling (where present).

---

### BarChart — `.ps-barchart-section`

**Props (TS)**
```ts
interface Bar { label: string; value: number; color?: string; }
interface Props {
  sectionNumber?: string;
  heading: string;
  description?: string;
  bars: Bar[];
  unit?: string;
  dark?: boolean;
}
```

**HTML structure**
```
<section class="ps-section ps-barchart-section">
  <div class="ps-barchart-layout">
    <div class="ps-barchart-text">
      <div class="ps-barchart-header">
        <div class="ps-barchart-section-num">num</div>
        <h2>heading</h2>
      </div>
      <div class="ps-barchart-description">description</div>
    </div>
    <div class="ps-barchart-chart">
      <div class="ps-barchart-bar-row">
        <div class="ps-barchart-bar-label">label</div>
        <div class="ps-barchart-bar-track">
          <div class="ps-barchart-bar-fill" style="--bar-width:X%; background:color" data-value="value+unit"></div>
        </div>
      </div>
    </div>
  </div>
</section>
```

**CSS — section:** padding `96px max(28px, calc((100% - var(--maxw)) / 2))`; background `var(--surface)`.

**CSS — typography:** h2 `clamp(32px, 4vw, 56px)` color `var(--brand-primary)`; section-num `clamp(28px, 3.2vw, 44px)` weight 900; bar-label 14px weight 600 color `var(--brand-primary)`; description 16px line-height 1.65 color `var(--text)`; tooltip (::after) 13px weight 700.

**CSS — layout / children:**
- `.ps-barchart-layout`: grid `1fr 1.4fr`, gap 64px, align-items start
- `.ps-barchart-header`: flex, gap 18px, align-items center, margin-bottom 12px
- `.ps-barchart-section-num`: padding 10px 14px 8px, border-radius 10px, background `var(--brand-primary)`
- `.ps-barchart-chart`: flex-column, gap 16px, padding-top 8px
- `.ps-barchart-bar-row`: flex-column, gap 6px
- `.ps-barchart-bar-track`: height 36px, background rgba(0,0,0,0.06), border-radius 4px, overflow hidden
- `.ps-barchart-bar-fill`: height 100%, width `var(--bar-width)`, border-radius 4px

**CSS — interactions:**
- `.ps-barchart-bar-fill:hover`: filter brightness(1.15), transition `filter 0.2s ease`
- `.ps-barchart-bar-fill::after` (tooltip): content `attr(data-value)`, absolute right -8px top 50%, transform translate(100%, -50%), background `var(--brand-primary)`, padding 4px 10px, border-radius 4px, opacity 0, transition `opacity 0.15s ease`
- Hover fill: `::after` opacity 1
- For high-value bars (`--bar-width: 9X%` / 100%): tooltip flips to inside-left (right auto, left 12px)

**CSS — animations:** bar widths animate in from 0% via JS (`animations.ts`, `width 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)`, staggered `i*0.08s`).

**CSS — dark (`.ps-barchart-dark`):** gradient background; h2 `--text-on-dark`; section-num background `--brand-accent-secondary`; bar-track `rgba(255,255,255,0.1)`; tooltip inverts colours.

**CSS — mobile (600px):** section padding 64px 18px; layout 1 col, gap 32px; h2 32px; bar-track height 30px; label 13px.

---

### Carousel — `.ps-carousel-section`

**Props (TS)**
```ts
interface CarouselItem { title: string; description: string; }
interface Props {
  sectionNumber?: string;
  heading: string;
  subtitle?: string;
  items: CarouselItem[];
  dark?: boolean;
}
```

**HTML structure**
```
<section class="ps-section ps-carousel-section">
  <div class="ps-carousel-header">
    <div class="ps-carousel-section-num">num</div>
    <h2>heading</h2>
  </div>
  <p class="ps-carousel-subtitle">subtitle</p>
  <div class="ps-carousel-container">
    <div class="ps-carousel-track" data-carousel-id>
      <div class="ps-carousel-card" data-index>
        <div class="ps-carousel-card-num">01</div>
        <h3>title</h3>
        <p>description</p>
      </div>
    </div>
  </div>
  <div class="ps-carousel-controls">
    <button class="ps-carousel-btn ps-carousel-prev">&larr;</button>
    <span class="ps-carousel-counter"><span class="ps-carousel-current">1</span> / N</span>
    <button class="ps-carousel-btn ps-carousel-next">&rarr;</button>
  </div>
</section>
```

**CSS — section:** padding `96px max(28px, calc((100% - var(--maxw)) / 2))`; background `var(--surface)`.

**CSS — typography:** h2 `clamp(32px, 4vw, 56px)` color `var(--brand-primary)`; section-num `clamp(28px, 3.2vw, 44px)` weight 900; subtitle 17px color `var(--text-muted)` margin-bottom 44px; h3 24px color `var(--brand-primary)` margin `0 0 12px`; p 16px line-height 1.65 color `var(--text-muted)`.

**CSS — layout / children:**
- `.ps-carousel-container`: overflow hidden
- `.ps-carousel-track`: flex, gap 24px, `overflow-x: auto`, `scroll-snap-type: x mandatory`, `scroll-behavior: smooth`, scrollbar hidden
- `.ps-carousel-card`: flex `0 0 100%`, `scroll-snap-align: start`, border-radius `var(--radius)`, padding 40px, box-shadow `var(--shadow)`
- `.ps-carousel-card::before`: left accent bar 3px `var(--brand-primary)`
- `.ps-carousel-controls`: flex, gap 20px, margin-top 28px

**CSS — interactions:**
- `.ps-carousel-btn`: 48px circle, border `2px var(--brand-primary)`, transition `background 0.2s, color 0.2s`
- Hover (not disabled): background `var(--brand-primary)`, color `var(--text-on-dark)`
- Disabled: opacity 0.3
- Native touch-swipe (via scroll-snap)

**CSS — dark (`.ps-carousel-dark`):** gradient background; card `rgba(255,255,255,0.06)` + border `1px var(--line-dark)`, no shadow; card::before `var(--brand-accent-secondary)`; h3/p inverted.

**CSS — mobile (600px):** section padding 64px 18px; h2 32px; card padding 28px; h3 20px; btn 40px.

---

### CustomerJourney — `.ps-journey-section`

**Props (TS)**
```ts
interface Phase { title: string; description?: string; }
interface Props {
  sectionNumber?: string;
  heading?: string;
  subtitle?: string;
  phases: Phase[];
  dark?: boolean;
}
```

**HTML structure**
```
<section class="ps-section ps-journey-section">
  <div class="ps-journey-header">
    <div class="ps-journey-section-num">num</div>
    <div><h2>heading</h2><p class="ps-journey-subtitle">subtitle</p></div>
  </div>
  <div class="ps-journey-track" data-journey-id>
    <svg class="ps-journey-line"><polyline /></svg>
    <div class="ps-journey-step">
      <div class="ps-journey-label">
        <div class="ps-journey-phase-num">Phase 01</div>
        <div class="ps-journey-title">title</div>
        <p class="ps-journey-desc">description</p>
      </div>
      <div class="ps-journey-dot"><span class="ps-journey-dot-num">1</span></div>
    </div>
  </div>
</section>
```

**CSS — section:** background `var(--surface)`; padding-top 64px; padding-bottom 64px.

**CSS — typography:** h2 `clamp(32px, 4vw, 56px)` color `var(--brand-primary)`; section-num `clamp(28px, 3.2vw, 44px)` weight 900; subtitle 17px color `var(--text-muted)`; phase-num 10px weight 800 letter-spacing 0.14em uppercase color `var(--brand-accent)`; title 15px weight 800 color `var(--brand-primary)`; desc 13px color `var(--text)`.

**CSS — layout / children:**
- `.ps-journey-header`: flex, align-items flex-start, gap 18px, margin-bottom 32px
- `.ps-journey-track`: grid `repeat(var(--n), 1fr)`, relative
- `.ps-journey-line`: absolute inset 0, z-index 1
- `.ps-journey-step`: relative, flex-column, align-items center, justify-content flex-end, `padding-bottom: calc(var(--offset) * var(--rise))`, z-index 2
- `.ps-journey-label`: text-align center, padding `0 6px 12px`, max-width 200px
- `.ps-journey-dot`: size `var(--dot)`, circle, flex, `background var(--brand-primary)`, box-shadow `0 0 0 5px color-mix(...), 0 6px 18px rgba(0,0,0,0.12)`
- `:nth-child(even) .ps-journey-dot`: background `var(--brand-accent)` with matching ring

**CSS — interactions:**
- `.ps-journey-step:hover .ps-journey-dot`: `transform: translateY(-3px) scale(1.04); transition: transform 0.25s ease`

**CSS — animations:**
- Step reveal: opacity 0 → 1, translateY(28px) → 0, `0.55s cubic-bezier(0.25, 0.1, 0.25, 1)` on `.ps-journey-step-in`
- Line opacity: 0 → 1, `0.8s ease 0.2s` on `.ps-journey-revealed`
- Line polyline: stroke-dasharray/offset 2000 → 0, `1.6s cubic-bezier(0.65, 0, 0.35, 1) 0.25s`; final dasharray `6 6` (dashed)

**CSS — dark (`.ps-journey-dark`):** gradient background; h2/subtitle/title/desc inverted; section-num `--brand-accent-secondary`; line colour `rgba(255,255,255,0.3)`; dot `--brand-accent-secondary`; even-dot `--brand-accent`.

**CSS — mobile (820px):**
- Track: grid `auto 1fr`, row-gap 24px
- Step: display `contents`, padding-bottom 0
- Dot goes to grid-col 1, size 56px
- Label goes to grid-col 2, text-align left, `border-left: 2px dashed var(--line)`
- Line hidden (display none)

**CSS — reduced-motion:** all reveal transitions/animations disabled; line fully drawn immediately.

---

### CustomerType — `.ps-persona-section`

**Props (TS)**
```ts
interface Item { text: string; }
interface Persona {
  name: string;
  description?: string;
  image: string;
  imageAlt?: string;
  struggles?: Item[];
  opportunities?: Item[];
}
interface Props {
  sectionNumber?: string;
  heading?: string;
  subtitle?: string;
  personas: Persona[];
  dark?: boolean;
}
```

**HTML structure**
```
<section class="ps-section ps-persona-section">
  <div class="ps-persona-header">
    <div class="ps-persona-section-num">num</div>
    <div><h2>heading</h2><p class="ps-persona-subtitle">subtitle</p></div>
  </div>
  <div class="ps-persona-grid">
    <article class="ps-persona-card" style="--float-dur; --float-delay; --float-amp">
      <div class="ps-persona-inner">
        <div class="ps-persona-face ps-persona-front">
          <div class="ps-persona-image" style="background-image:url(...)"></div>
          <div class="ps-persona-flipicon">svg</div>
          <div class="ps-persona-front-body">
            <h3 class="ps-persona-name">name</h3>
            <p class="ps-persona-desc">description</p>
            <div class="ps-persona-hint">Click to flip</div>
          </div>
        </div>
        <div class="ps-persona-face ps-persona-back">
          <div class="ps-persona-flipicon">svg</div>
          <h3 class="ps-persona-back-name">name</h3>
          <div class="ps-persona-block ps-persona-struggles">
            <div class="ps-persona-block-label">Struggles</div>
            <ul><li>text</li></ul>
          </div>
          <div class="ps-persona-block ps-persona-opportunities">
            <div class="ps-persona-block-label">Opportunities</div>
            <ul><li>text</li></ul>
          </div>
          <div class="ps-persona-hint">Click to flip back</div>
        </div>
      </div>
    </article>
  </div>
</section>
```

**CSS — section:** padding `96px max(28px, calc((100% - var(--maxw)) / 2))`; background `var(--surface)`.

**CSS — typography:** h2 `clamp(32px, 4vw, 56px)` color `var(--brand-primary)`; section-num `clamp(28px, 3.2vw, 44px)` weight 900; subtitle 17px color `var(--text-muted)`; name `clamp(22px, 2vw, 28px)` weight 800 color #fff; desc 14.5px rgba(255,255,255,0.92); hint 11px weight 700 uppercase letter-spacing 0.12em; back-name `clamp(18px, 1.6vw, 22px)` weight 800 color `var(--brand-primary)` + border-bottom 2px `var(--line)`; block-label 11px weight 700 uppercase letter-spacing 0.14em (struggles `--brand-accent`, opportunities `--brand-primary`); block ul 13.5px line-height 1.5 color `var(--text)`.

**CSS — layout / children:**
- `.ps-persona-grid`: grid `repeat(2, minmax(0, 1fr))`, gap 28px, padding `30px 0`
- `.ps-persona-card`: perspective 1400px, aspect-ratio `4 / 3`, cursor pointer, animation `ps-persona-float var(--float-dur) ease-in-out infinite`, `animation-delay: var(--float-delay)`
- `.ps-persona-grid:has(.flipped) .ps-persona-card`: animation paused, translateY(0) forced
- `.ps-persona-inner`: relative, full size, `transform-style: preserve-3d`, transition `transform 0.6s cubic-bezier(0.3, 0.1, 0.3, 1)`
- `.ps-persona-card.flipped .ps-persona-inner`: rotateY(180deg)
- `.ps-persona-face`: absolute inset 0, `backface-visibility: hidden`, border-radius `var(--radius)`, overflow hidden, box-shadow `0 14px 36px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)`
- `.ps-persona-front::after`: gradient overlay transparent 30% → `rgba(0,0,0,0.92)` 100%
- `.ps-persona-front-body`: relative z-index 2, padding 28px
- `.ps-persona-flipicon`: absolute top 14px right 14px, 32px circle, transitions `transform 0.25s, background 0.25s`; front variant `rgba(255,255,255,0.18)` + backdrop-blur; back variant `color-mix(--brand-primary 10%, transparent)`
- `.ps-persona-back`: rotateY(180deg), padding 26px, flex-column gap 16px, border `1px var(--line)`
- `.ps-persona-block li`: padding-left 16px, custom 6px bullet via ::before

**CSS — interactions:**
- Card click: toggles `.flipped`
- `.ps-persona-card:hover .ps-persona-flipicon`: rotate 180°

**CSS — animations:**
- `@keyframes ps-persona-float`: `0%, 100% { translateY(0); } 50% { translateY(calc(var(--float-amp) * -1)); }`, duration `var(--float-dur)` (4–8 s), `ease-in-out infinite`

**CSS — dark (`.ps-persona-dark`):** gradient background; h2/subtitle inverted; section-num `--brand-accent-secondary`; face box-shadow none; back `rgba(255,255,255,0.06)` + `var(--line-dark)`; back-name `--text-on-dark`; struggles label `--brand-accent-secondary`; opportunities label `--text-on-dark`; block ul `--text-on-dark-muted`.

**CSS — mobile (900px):** grid 1 col, gap 24px, card aspect-ratio `4 / 3`.
**CSS — mobile (600px):** section padding 64px 18px; h2 32px; front-body padding 22px; back padding 22px 20px.

**CSS — reduced-motion:** card float animation none; inner flip transition 0.01ms.

---

### DataTable — `.ps-table-section`

**Props (TS)**
```ts
interface Props {
  sectionNumber?: string;
  heading?: string;
  subtitle?: string;
  headers: string[];
  rows: string[][];
  dark?: boolean;
}
```

**HTML structure**
```
<section class="ps-section ps-table-section">
  <div class="ps-table-header">
    <div class="ps-table-section-num">num</div>
    <h2>heading</h2>
  </div>
  <p class="ps-table-subtitle">subtitle</p>
  <div class="ps-table-wrap">
    <table class="ps-table">
      <thead><tr><th>headers</th></tr></thead>
      <tbody><tr><td>cell</td></tr></tbody>
    </table>
  </div>
</section>
```

**CSS — section:** padding `96px max(28px, calc((100% - var(--maxw)) / 2))`; background `var(--surface)`.

**CSS — typography:** h2 `clamp(32px, 4vw, 56px)` color `var(--brand-primary)`; section-num `clamp(28px, 3.2vw, 44px)` weight 900; subtitle 17px color `var(--text-muted)`; th 11px weight 700 letter-spacing 0.12em uppercase color `var(--text-on-dark)`; td 14px color `var(--text)` line-height 1.5.

**CSS — layout / children:**
- `.ps-table-header`: flex, gap 18px, align-items center, margin-bottom 12px
- `.ps-table-section-num`: padding 10px 14px 8px, border-radius 10px, background `var(--brand-primary)`
- `.ps-table-wrap`: `overflow-x: auto`, `-webkit-overflow-scrolling: touch`
- `.ps-table`: width 100%, border-collapse collapse, background `var(--surface-card)`, border-radius `var(--radius)`, box-shadow `var(--shadow)`
- `thead th`: padding 16px 20px, background `var(--brand-primary)`
- `tbody td`: padding 16px 20px, border-top `1px solid var(--line)`, vertical-align top

**CSS — interactions:**
- `tbody tr:hover`: background `rgba(0, 0, 0, 0.02)`
- `tbody tr:first-child td`: border-top 0

**CSS — dark (`.ps-table-dark`):** gradient background; h2 `--text-on-dark`; section-num `--brand-accent-secondary`; table `rgba(255,255,255,0.04)` + border `1px var(--line-dark)`, shadow none; th `rgba(255,255,255,0.08)`; td `--text-on-dark-muted` + `--line-dark` borders; hover `rgba(255,255,255,0.04)`.

**CSS — mobile (600px):** section padding 64px 18px; h2 32px; th/td padding 12px 14px, min-width 120px.

---

### Faq — `.ps-faq-section`

**Props (TS)**
```ts
interface FaqItem { question: string; answer: string; }
interface Props {
  sectionNumber?: string;
  heading: string;
  subtitle?: string;
  items: FaqItem[];
  dark?: boolean;
}
```

**HTML structure**
```
<section class="ps-section ps-faq-section">
  <div class="ps-faq-header">
    <div class="ps-faq-section-num">num</div>
    <h2>heading</h2>
  </div>
  <p class="ps-faq-subtitle">subtitle</p>
  <div class="ps-faq-list">
    <details class="ps-faq-item">
      <summary class="ps-faq-question">question</summary>
      <div class="ps-faq-answer">answer HTML</div>
    </details>
  </div>
</section>
```

**CSS — section:** padding `96px max(28px, calc((100% - var(--maxw)) / 2))`; background `var(--surface)`.

**CSS — typography:** h2 `clamp(32px, 4vw, 56px)` color `var(--brand-primary)`; section-num `clamp(28px, 3.2vw, 44px)` weight 900; subtitle 17px color `var(--text-muted)`; question 18px weight 700 color `var(--brand-primary)`; answer 15px line-height 1.65 color `var(--text-muted)`.

**CSS — layout / children:**
- `.ps-faq-header`: flex, gap 18px, align-items center, margin-bottom 12px
- `.ps-faq-section-num`: padding 10px 14px 8px, border-radius 10px, background `var(--brand-primary)`
- `.ps-faq-list`: max-width 860px
- `.ps-faq-item`: border-bottom `1px solid var(--line)`; first-child adds border-top
- `.ps-faq-question`: padding `22px 0`, flex, justify-content space-between, align-items center
- Native `summary` marker hidden

**CSS — interactions:**
- `.ps-faq-question::after`: content `+`, transition `transform 0.2s ease`
- `.ps-faq-item[open] .ps-faq-question::after`: content `−` (U+2212)
- `.ps-faq-question:hover`: color `var(--brand-accent)`

**CSS — dark (`.ps-faq-dark`):** gradient background; h2 `--text-on-dark`; section-num `--brand-accent-secondary`; question `--text-on-dark`; ::after `--brand-accent-secondary`; subtitle/answer `--text-on-dark-muted`; item borders `--line-dark`.

**CSS — mobile (600px):** section padding 64px 18px; h2 32px; question 16px padding `18px 0`.

---

### FeatureImage — `.ps-feature-section`

**Props (TS)**
```ts
interface Props {
  sectionNumber?: string;
  eyebrow?: string;
  heading: string;
  description: string;
  image: string;
  imageAlt?: string;
  dark?: boolean;
}
```

**HTML structure**
```
<section class="ps-feature-section">
  <div class="ps-feature-layout">
    <div class="ps-feature-text">
      <div class="ps-feature-eyebrow">eyebrow</div>
      <h2>heading</h2>
      <p>description</p>
    </div>
    <div class="ps-feature-image">
      <img src alt loading="lazy" />
    </div>
  </div>
</section>
```

**CSS — section:** padding `96px max(28px, calc((100% - var(--maxw)) / 2))`; background `var(--surface)`.

**CSS — typography:** eyebrow 11px letter-spacing 0.22em uppercase color `--text-on-dark-muted`; h2 `clamp(32px, 4vw, 52px)` weight 800 line-height 1.05 color `--text-on-dark`; p 16px line-height 1.65 color `--text-on-dark-muted` max-width 48ch.

**CSS — layout / children:**
- `.ps-feature-layout`: grid `1fr 1fr`, min-height 420px, border-radius `var(--radius)`, overflow hidden, background `var(--brand-primary)`, box-shadow `var(--shadow)`
- `.ps-feature-text`: flex-column, justify-content center, padding `56px 48px`
- `.ps-feature-image`: relative, overflow hidden, background `#e5e7eb`
- `.ps-feature-image img`: absolute top/left 50%, width/height 120%, `object-fit: cover`, `transform: translate(-50%, -50%) scale(1)`, `transform-origin: center`, `will-change: transform`

**CSS — animations:**
- `@keyframes ps-feature-zoom`: `0%, 100% { translate(-50%,-50%) scale(1); } 50% { translate(-50%,-50%) scale(1.08); }`, duration 9s `ease-in-out infinite`

**CSS — dark (`.ps-feature-dark`):** section becomes gradient; `.ps-feature-layout` `rgba(255,255,255,0.06)` + `1px var(--line-dark)` + shadow none.

**CSS — mobile (768px):** section padding 64px 18px; layout 1 col, min-height auto; text padding 40px 28px; image height 280px.

**CSS — reduced-motion:** image animation none, transform fixed at scale 1.

---

### FlipCards — `.ps-flipcards-section`

**Props (TS)**
```ts
interface Card { title: string; description: string; image: string; imageAlt?: string; }
interface Props {
  sectionNumber?: string;
  heading: string;
  subtitle?: string;
  cardsPerPage?: number;     // default 3
  cards: Card[];
  dark?: boolean;
}
```

**HTML structure**
```
<section class="ps-flipcards-section" data-flipcards-id>
  <div class="ps-flipcards-header">
    <div class="ps-flipcards-section-num">num</div>
    <h2>heading</h2>
  </div>
  <p class="ps-flipcards-subtitle">subtitle</p>
  <div class="ps-flipcards-viewport">
    <div class="ps-flipcards-track" style="--cards-per-page: N">
      <div class="ps-flipcards-card" data-index data-page style="--float-dur; --float-delay; --float-amp">
        <div class="ps-flipcards-inner">
          <div class="ps-flipcards-face ps-flipcards-front">
            <div class="ps-flipcards-image" style="background-image:url(...)"></div>
            <div class="ps-flipcards-flipicon">svg</div>
            <div class="ps-flipcards-front-title">title</div>
            <div class="ps-flipcards-hint">Click to read more</div>
          </div>
          <div class="ps-flipcards-face ps-flipcards-back">
            <div class="ps-flipcards-flipicon">svg</div>
            <h3>title</h3>
            <div class="ps-flipcards-description">description</div>
            <div class="ps-flipcards-hint">Click to flip back</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="ps-flipcards-controls">
    <button class="ps-flipcards-btn ps-flipcards-prev">svg</button>
    <span class="ps-flipcards-counter"><span class="ps-flipcards-current">1</span> / N</span>
    <button class="ps-flipcards-btn ps-flipcards-next">svg</button>
  </div>
</section>
```

**CSS — section:** padding `96px max(28px, calc((100% - var(--maxw)) / 2))`; background `var(--surface)`.

**CSS — typography:** h2 `clamp(32px, 4vw, 56px)` color `var(--brand-primary)`; section-num `clamp(28px, 3.2vw, 44px)` weight 900; subtitle 17px color `var(--text-muted)` margin-bottom 44px; front-title `clamp(20px, 2vw, 26px)` weight 800 color #fff padding `24px 24px 12px`; hint 12px weight 600 uppercase letter-spacing 0.1em padding `0 24px 22px`; back h3 `clamp(18px, 1.6vw, 22px)` weight 800 color `--brand-primary`; description 14px line-height 1.6 color `--text` (scrollable via `overflow-y: auto`).

**CSS — layout / children:**
- `.ps-flipcards-viewport`: relative, `overflow-x: clip`, `overflow-y: visible`, padding `50px 0`
- `.ps-flipcards-track`: flex, gap 24px, `transform: translateX(calc(var(--current-page, 0) * (-100% - 24px)))`, transition `transform 0.45s cubic-bezier(0.25, 0.1, 0.25, 1)`, `will-change: transform`
- `.ps-flipcards-card`: flex-basis `calc((100% - (var(--cards-per-page) - 1) * 24px) / var(--cards-per-page))`, perspective 1400px, aspect-ratio `3 / 4`, cursor pointer, animation `ps-flipcards-float var(--float-dur) ease-in-out infinite`, `animation-delay: var(--float-delay)`
- `.ps-flipcards-track:has(.flipped) .ps-flipcards-card`: animation paused, translateY(0) forced
- `.ps-flipcards-inner`: transform-style preserve-3d, transition `transform 0.6s cubic-bezier(0.3, 0.1, 0.3, 1)`
- `.ps-flipcards-card.flipped .ps-flipcards-inner`: rotateY(180deg)
- `.ps-flipcards-face`: absolute inset 0, backface-visibility hidden, border-radius `var(--radius)`, overflow hidden, box-shadow `0 12px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)`
- `.ps-flipcards-image`: absolute inset 0, background-size cover, background-position center
- `.ps-flipcards-front::after`: gradient overlay to `rgba(0,0,0,0.85)` at bottom
- `.ps-flipcards-flipicon`: absolute `top 14px right 14px`, 32px circle, transitions `transform 0.25s, background 0.25s`; front `rgba(255,255,255,0.18)` + backdrop-blur(6px); back `color-mix(--brand-primary 10%, transparent)` color `--brand-primary`
- `.ps-flipcards-back`: rotateY(180deg), padding `28px 26px`, flex-column gap 14px, border `1px var(--line)`

**CSS — interactions:**
- Card click: toggles `.flipped` (suppressed for 400 ms after a swipe)
- `.ps-flipcards-card:hover .ps-flipcards-flipicon`: rotate 180°
- Touch swipe on viewport: paginates (threshold 40 px dx > |dy|)

**CSS — animations:**
- `@keyframes ps-flipcards-float`: `0%, 100% { translateY(0); } 50% { translateY(calc(var(--float-amp) * -1)); }`, duration per-card 4–8 s, `ease-in-out infinite`

**CSS — dark (`.ps-flipcards-dark`):** gradient background; face shadow none; back `rgba(255,255,255,0.06)` + `--line-dark`; h3/description inverted; buttons + counter inverted.

**CSS — mobile (768px):** section padding 64px 18px; h2 32px; card flex `0 0 100%`, aspect-ratio `4 / 5`; button 38px.

**CSS — reduced-motion:** card float animation none; inner + track transitions 0.01ms.

---

### Footer — `.ps-footer-section`

**Props (TS)**
```ts
interface Props {
  text?: string;
  note?: string;
}
```

**HTML structure**
```
<footer class="ps-footer-section">
  <div class="ps-footer-inner">
    <div class="ps-footer-text">text</div>
    <div class="ps-footer-note">note</div>
  </div>
</footer>
```

**CSS — section:** background `var(--brand-primary-deep)`; color `rgba(255,255,255,0.75)`; border-top `3px solid var(--brand-accent-secondary)`; padding `32px max(28px, calc((100% - var(--maxw)) / 2))`; font-size 13px; line-height 1.5; text-align center.

**CSS — typography:** text `rgba(255,255,255,0.9)`; note 12px `rgba(255,255,255,0.55)`.

**CSS — layout / children:**
- `.ps-footer-inner`: flex-column, align-items center, gap 6px

**CSS — interactions:**
- Links: color `var(--brand-accent-secondary)`, no underline
- Link hover: color `var(--text-on-dark)` + underline

**CSS — dark variant:** N/A (always dark).

**CSS — mobile (600px):** padding 24px 18px.

**Editor behaviour:** pinned as last section; drag handle + delete button hidden; cannot be re-ordered.

---

### Header — `.ps-header`

**Props (TS)**
```ts
interface Props {
  logo: string;
  logoAlt?: string;
  title: string;
}
```

**HTML structure**
```
<header class="ps-header">
  <div class="ps-header-inner">
    <div class="ps-header-left"><img class="ps-header-logo" /></div>
    <div class="ps-header-title">text</div>
  </div>
</header>
```

**CSS — section:** padding `18px max(28px, calc((100% - var(--maxw)) / 2))`; background `var(--brand-primary-deep)`; border-bottom `1px solid var(--line-dark)`; transitions `background 0.25s ease, backdrop-filter 0.25s ease`.

**CSS — typography:** title font-display, weight 700, 15px, line-height 1, color `var(--text-on-dark)`, letter-spacing 0.02em.

**CSS — layout / children:**
- `.ps-header-inner`: flex, space-between, gap 24px, max-width `var(--maxw)`, margin 0 auto
- `.ps-header-logo`: max-width 160px, max-height 36px, width/height auto
- `.ps-header-title`: text-align right, ellipsis on overflow

**CSS — interactions:**
- `.ps-header.ps-header-scrolled`: background `color-mix(in srgb, var(--brand-primary-deep) 72%, transparent)`, `backdrop-filter: saturate(1.3) blur(12px)`

**CSS — mobile (600px):** padding 12px 18px; logo max-height 28px / max-width 120px; title 13px.

**Editor behaviour:** self-styled; excluded from floating nav; doesn't alternate.

---

### Hero — `.ps-hero`

**Props (TS)**
```ts
interface Props {
  eyebrow: string;
  headline: string;                      // supports **accent** markup
  lede: string;
  stats: Array<{ value: number | string; unit?: string; label: string }>;
  ctas?: Array<{ label: string; href: string; variant?: 'primary' | 'ghost' }>;
}
```

**HTML structure**
```
<section class="ps-hero">
  <div class="ps-hero-bg" aria-hidden></div>
  <div class="ps-hero-inner">
    <div class="ps-eyebrow">text</div>
    <h1>headline (with <span class="ps-accent"> segments)</h1>
    <p class="ps-lede">text</p>
    <div class="ps-hero-stats">
      <div class="ps-stat">
        <div class="ps-stat-head">
          <div class="ps-stat-num" data-count>0</div>
          <div class="ps-stat-unit">unit</div>
        </div>
        <div class="ps-stat-label">label</div>
      </div>
    </div>
    <div class="ps-hero-cta">
      <a class="ps-btn ps-btn-primary">label</a>
    </div>
  </div>
</section>
```

**CSS — section:** padding `96px max(28px, calc((100% - var(--maxw)) / 2)) 96px`; background `var(--brand-primary)`; color `var(--text-on-dark)`; relative; overflow hidden.

**CSS — typography:**
- h1: `clamp(52px, 8.6vw, 128px)` line-height 0.98
- `.ps-accent`: color `var(--brand-accent-secondary)`
- eyebrow: 12px letter-spacing 0.22em uppercase color `rgba(255,255,255,0.9)`
- lede: `clamp(16px, 1.4vw, 20px)` color `rgba(255,255,255,0.82)` max-width 100ch
- stat-num: font-display weight 900 `clamp(44px, 5.2vw, 72px)` line-height 1
- stat-unit: font-display weight 900 `clamp(28px, 3vw, 42px)` color `var(--brand-accent-secondary)`
- stat-label: 16px line-height 1.45 color `rgba(255,255,255,0.82)`

**CSS — layout / children:**
- `.ps-hero-bg`: absolute inset 0 (radial glows + diagonal stripe pattern, see `hero.css`)
- `.ps-hero-inner`: relative, max-width `var(--maxw)`, margin 0 auto
- `.ps-eyebrow`: inline-block, padding `6px 12px`, border `1px solid rgba(255,255,255,0.35)`, border-radius 100px, margin-bottom 26px
- `.ps-hero-stats`: grid `auto-fit minmax(180px, 1fr)`, gap 48px, margin-bottom 48px
- `.ps-stat`: `border-left: 3px solid var(--brand-accent-secondary)`, padding `10px 16px 10px 20px`
- `.ps-stat-head`: flex, align-items baseline, gap 2px
- `.ps-hero-cta`: flex, gap 14px, flex-wrap wrap

**CSS — interactions:**
- Stats animate 0 → target via `counter.ts` (IntersectionObserver trigger)
- Buttons (`.ps-btn`, `.ps-btn-primary`, `.ps-btn-ghost`) inherit transitions from `base.css`

**CSS — mobile (600px):** padding `80px 18px 64px`; h1 42px line-height 1.0; eyebrow 10px letter-spacing 0.16em; lede 15px; stats grid `1fr 1fr` gap 20px; stat-num 48px, stat-unit 24px, stat-label 13px; CTAs stack vertical, full-width.

**Editor behaviour:** self-styled; not alternated.

---

### HeroSimple — `.ps-hero`

**Props (TS)**
```ts
interface Props {
  eyebrow: string;
  headline: string;                      // supports **accent** markup
  lede: string;
}
```

**HTML structure**
```
<section class="ps-hero">
  <div class="ps-hero-bg" aria-hidden></div>
  <div class="ps-hero-inner">
    <div class="ps-eyebrow">text</div>
    <h1>headline</h1>
    <p class="ps-lede">text</p>
  </div>
</section>
```

**CSS:** identical section + typography + inner rules as Hero. No stats, no CTAs. Same 600px mobile overrides apply.

---

### ImageCarousel — `.ps-imgcarousel-section`

**Props (TS)**
```ts
interface Slide { eyebrow?: string; heading: string; description: string; image: string; imageAlt?: string; }
interface Props {
  sectionNumber?: string;
  heading?: string;
  subtitle?: string;
  slides: Slide[];
  dark?: boolean;
}
```

**HTML structure**
```
<section class="ps-imgcarousel-section" data-imgcarousel-id>
  <div class="ps-imgcarousel-header">
    <div class="ps-imgcarousel-section-num">num</div>
    <h2>heading</h2>
  </div>
  <p class="ps-imgcarousel-subtitle">subtitle</p>
  <div class="ps-imgcarousel-viewport">
    <div class="ps-imgcarousel-track" id>
      <div class="ps-imgcarousel-slide">
        <div class="ps-imgcarousel-text">
          <div class="ps-imgcarousel-eyebrow">eyebrow</div>
          <h3>heading</h3>
          <p>description</p>
        </div>
        <div class="ps-imgcarousel-image"><img src alt /></div>
      </div>
    </div>
  </div>
  <div class="ps-imgcarousel-controls">
    <button class="ps-imgcarousel-btn ps-imgcarousel-prev">&larr;</button>
    <span class="ps-imgcarousel-counter"><span class="ps-imgcarousel-current">1</span> / N</span>
    <button class="ps-imgcarousel-btn ps-imgcarousel-next">&rarr;</button>
  </div>
</section>
```

**CSS — section:** padding `96px max(28px, calc((100% - var(--maxw)) / 2))`; background `var(--surface)`.

**CSS — typography:** h2 `clamp(32px, 4vw, 56px)` color `var(--brand-primary)`; section-num `clamp(28px, 3.2vw, 44px)` weight 900; subtitle 17px margin-bottom 44px; slide eyebrow 11px weight 600 uppercase letter-spacing 0.22em color `--text-on-dark-muted`; slide h3 `clamp(28px, 3.5vw, 44px)` weight 800 color `--text-on-dark`; slide p 15px line-height 1.65 color `--text-on-dark-muted`.

**CSS — layout / children:**
- `.ps-imgcarousel-viewport`: overflow hidden, border-radius `var(--radius)`
- `.ps-imgcarousel-track`: flex, `overflow-x: auto`, `scroll-snap-type: x mandatory`, `scroll-behavior: smooth`
- `.ps-imgcarousel-slide`: flex `0 0 100%`, grid `1fr 1fr`, min-height 400px, `scroll-snap-align: start`, background `var(--brand-primary)`, border-radius `var(--radius)`
- `.ps-imgcarousel-text`: flex-column, justify-content center, padding `48px 44px`
- `.ps-imgcarousel-image img`: width/height 100%, `object-fit: cover`
- `.ps-imgcarousel-controls`: flex, gap 20px, margin-top 24px

**CSS — interactions:**
- `.ps-imgcarousel-btn`: 48px circle, border `2px var(--brand-primary)`, transitions 0.2s
- Hover swaps background/colour; disabled opacity 0.3
- Native touch-swipe via scroll-snap

**CSS — dark (`.ps-imgcarousel-dark`):** gradient bg; slide `rgba(255,255,255,0.06)` + `--line-dark`; buttons inverted.

**CSS — mobile (768px):** section padding 64px 18px; h2 32px; slide 1 col, min-height auto; text padding `32px 24px`; image height 240px; btn 40px.

---

### KeyInsights — `.ps-insights-section`

**Props (TS)**
```ts
interface Props {
  sectionNumber?: string;
  heading: string;
  subtitle?: string;
  insights: Array<{ title: string; text: string }>;
  dark?: boolean;
}
```

**HTML structure**
```
<section class="ps-section ps-insights-section">
  <div class="ps-insights-header">
    <div class="ps-insights-num">num</div>
    <h2>heading</h2>
  </div>
  <p class="ps-insights-subtitle">subtitle</p>
  <div class="ps-insights-grid">
    <article class="ps-insights-card">
      <div class="ps-insights-card-num">1</div>
      <h3>title</h3>
      <p>text</p>
    </article>
  </div>
</section>
```

**CSS — section:** padding `96px max(28px, calc((100% - var(--maxw)) / 2))`; background `var(--surface)`.

**CSS — typography:** h2 `clamp(32px, 4vw, 56px)` color `var(--brand-primary)`; section-num `clamp(28px, 3.2vw, 44px)` weight 900; subtitle 17px color `--text-muted`; card-num font-display weight 900 40px color `--text-on-dark` on `--brand-primary` bg padding `8px 16px 6px` border-radius 10px; card h3 20px color `--brand-primary`; card p 14px line-height 1.55.

**CSS — layout / children:**
- `.ps-insights-header`: flex, gap 18px, align-items center, margin-bottom 12px
- `.ps-insights-grid`: grid `auto-fit minmax(280px, 1fr)`, gap 22px
- `.ps-insights-card`: background `var(--surface-card)`, border-radius `var(--radius)`, padding 28px, box-shadow `var(--shadow)`, relative overflow hidden
- `.ps-insights-card::before`: left accent bar 3px `var(--brand-primary)`
- `:nth-child(even) .ps-insights-card-num`: `--surface-alt` background

**CSS — dark (`.ps-insights-dark`):** gradient bg; card `rgba(255,255,255,0.06)` + `1px rgba(255,255,255,0.1)` + shadow none; card::before `--brand-accent-secondary`; card-num `--brand-accent-secondary`; nth-child(even) card-num `rgba(255,255,255,0.12)`.

**CSS — mobile (600px):** section padding 64px 18px; h2 32px; card h3 17px; card-num 34px.

**Reveal:** children get `.ps-reveal-child` stagger.

---

### NumberedList — `.ps-numlist-section`

**Props (TS)**
```ts
interface Props {
  sectionNumber?: string;
  heading: string;
  subtitle?: string;
  items: Array<{ title: string; description: string }>;
  dark?: boolean;
}
```

**HTML structure**
```
<section class="ps-section ps-numlist-section">
  <div class="ps-numlist-header">
    <div class="ps-numlist-section-num">num</div>
    <h2>heading</h2>
  </div>
  <p class="ps-numlist-subtitle">subtitle</p>
  <ol class="ps-numlist">
    <li class="ps-numlist-item">
      <div class="ps-numlist-num">01</div>
      <div class="ps-numlist-content">
        <h3>title</h3>
        <p>description</p>
      </div>
    </li>
  </ol>
</section>
```

**CSS — section:** padding `96px max(28px, calc((100% - var(--maxw)) / 2))`; background `var(--surface)`.

**CSS — typography:** h2 `clamp(32px, 4vw, 56px)` color `var(--brand-primary)`; section-num `clamp(28px, 3.2vw, 44px)` weight 900; subtitle 17px color `--text-muted`; item-num font-display weight 800 32px color `--brand-accent` width 48px; item h3 20px color `--brand-primary`; item p 15px color `--text-muted`.

**CSS — layout / children:**
- `.ps-numlist`: list-style none, max-width 860px
- `.ps-numlist-item`: flex, gap 24px, align-items flex-start, padding `28px 0`, border-bottom `1px solid var(--line)`
- `.ps-numlist-item:first-child`: border-top 1px
- `.ps-numlist-num`: flex-shrink 0, padding-top 4px

**CSS — dark (`.ps-numlist-dark`):** gradient bg; h2/subtitle inverted; section-num `--brand-accent-secondary`; borders `--line-dark`; item-num `--brand-accent-secondary`.

**CSS — mobile (600px):** section padding 64px 18px; h2 32px; item gap 16px padding `20px 0`; item-num 24px width 36px; item h3 17px.

**Reveal:** items get `.ps-reveal-child` stagger.

---

### PieChart — `.ps-piechart-section`

**Props (TS)**
```ts
interface Slice { label: string; value: number; color?: string; }
interface Props {
  sectionNumber?: string;
  heading: string;
  subtitle?: string;
  description?: string;
  slices: Slice[];
  dark?: boolean;
}
```

**HTML structure**
```
<section class="ps-section ps-piechart-section">
  <div class="ps-piechart-outer">
    <div class="ps-piechart-text">
      <div class="ps-piechart-header">
        <div class="ps-piechart-section-num">num</div>
        <h2>heading</h2>
      </div>
      <p class="ps-piechart-subtitle">subtitle</p>
      <div class="ps-piechart-description">description</div>
    </div>
    <div class="ps-piechart-right">
      <div class="ps-piechart-layout">
        <div class="ps-piechart-chart"><svg>paths + optional circle</svg></div>
        <div class="ps-piechart-legend">
          <div class="ps-piechart-legend-item">
            <div class="ps-piechart-legend-swatch"></div>
            <div class="ps-piechart-legend-text">
              <span class="ps-piechart-legend-label">label</span>
              <span class="ps-piechart-legend-value">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

**CSS — section:** padding `96px max(28px, calc((100% - var(--maxw)) / 2))`; background `var(--surface)`.

**CSS — typography:** h2 `clamp(32px, 4vw, 56px)` color `--brand-primary`; section-num `clamp(28px, 3.2vw, 44px)` weight 900; subtitle 17px color `--text-muted`; description 16px line-height 1.65 color `--text`; legend-label 15px weight 600 color `--brand-primary`; legend-value 18px weight 800.

**CSS — layout / children:**
- `.ps-piechart-outer`: grid `1fr 1.4fr`, gap 64px, align-items start
- `.ps-piechart-layout`: grid `240px 1fr`, gap 32px, align-items center
- `.ps-piechart-chart svg`: width 100%, height auto
- `.ps-piechart-legend`: flex-column, gap 14px
- `.ps-piechart-legend-item`: flex, gap 12px, align-items center
- `.ps-piechart-legend-swatch`: 16px × 16px, border-radius 4px
- `.ps-piechart-legend-text`: flex, justify-content space-between, gap 12px

**CSS — animations:**
- Path reveal (JS): opacity 0 → 1, scale 0.85 → 1, transform-origin `100px 100px`, staggered `i * 0.1s`, `opacity 0.4s ease` + `transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)`
- Inner circle (if present): scales 0 → 1 after last path

**CSS — dark (`.ps-piechart-dark`):** gradient bg; h2/subtitle/description inverted; section-num `--brand-accent-secondary`; legend-label `--text-on-dark`; legend-value `--text-on-dark-muted`.

**CSS — mobile (600px):** section padding 64px 18px; outer 1 col gap 32px; h2 32px; layout 1 col, gap 28px, max-width 400px.

---

### QuoteBlock — `.ps-qblock-section`

**Props (TS)**
```ts
interface Props {
  sectionNumber?: string;
  eyebrow?: string;
  heading?: string;
  quote: string;
  title?: string;
  subtitle?: string;
  dark?: boolean;
}
```

**HTML structure**
```
<section class="ps-section ps-qblock-section">
  <div class="ps-qblock-inner">
    <div class="ps-qblock-header">
      <div class="ps-qblock-section-num">num</div>
      <h2>heading</h2>
    </div>
    <figure class="ps-qblock-figure">
      <div class="ps-qblock-eyebrow">eyebrow</div>
      <blockquote class="ps-qblock-quote">
        <span class="ps-qblock-mark ps-qblock-mark-open">"</span>
        <span class="ps-qblock-text">quote</span>
        <span class="ps-qblock-mark ps-qblock-mark-close">"</span>
      </blockquote>
      <figcaption class="ps-qblock-attribution">
        <span class="ps-qblock-title">title</span>
        <span class="ps-qblock-subtitle">subtitle</span>
      </figcaption>
    </figure>
  </div>
</section>
```

**CSS — section:** relative, overflow hidden; background `var(--surface)` with `linear-gradient(180deg, color-mix(in srgb, var(--brand-primary) 4%, var(--surface)) 0%, var(--surface) 100%)`; min-height 320px; padding-top 56px; padding-bottom 56px; flex, align-items center.

**CSS — inner wrap:** relative z-index 2; max-width 880px; margin 0 auto; text-align center.

**CSS — typography:**
- section-num: font-display weight 900 `clamp(22px, 2.6vw, 34px)` color `--text-on-dark` padding `8px 12px 6px` border-radius 8px
- h2: `clamp(26px, 3.2vw, 42px)` color `--brand-primary`
- eyebrow: 11px weight 700 uppercase letter-spacing 0.14em color `--brand-primary`, `border: 2px solid var(--brand-primary)` border-radius 100px padding `5px 12px`
- quote: font-display weight 700 `clamp(22px, 2.6vw, 32px)` line-height 1.3 color `--text` max-width 28ch
- mark: font-display weight 900 color `--brand-accent`, 1.4em font-size, vertical-align `-0.08em`
- title: font-display weight 800 16px color `--brand-primary`
- subtitle: 14px color `--text-muted`

**CSS — layout / children:**
- `.ps-qblock-header`: inline-flex, align-items center, gap 14px, margin-bottom 32px
- `.ps-qblock-attribution`: margin-top 18px, flex-column align-items center, gap 2px

**CSS — dark (`.ps-qblock-dark`):** gradient background; h2 `--text-on-dark`; section-num `--brand-accent-secondary`; eyebrow `--text-on-dark` + border `--text-on-dark`; quote `--text-on-dark`; mark `--brand-accent-secondary`; title `--text-on-dark`; subtitle `--text-on-dark-muted`.

**CSS — mobile (720px):** min-height 280px, padding-top/bottom 48px; quote `clamp(22px, 6vw, 28px)` max-width 22ch.

---

### QuoteCarousel — `.ps-qcarousel-section`

**Props (TS)**
```ts
interface Quote { quote: string; title: string; subtitle?: string; }
interface Props {
  sectionNumber?: string;
  heading?: string;
  quotes: Quote[];
  dark?: boolean;
}
```

**HTML structure**
```
<section class="ps-section ps-qcarousel-section" data-qcarousel-id>
  <div class="ps-qcarousel-wave" aria-hidden>
    <div class="ps-qcarousel-wave-bar" style="--i; --bars"></div>
    ... (80 bars)
  </div>
  <div class="ps-qcarousel-inner">
    <div class="ps-qcarousel-header">
      <div class="ps-qcarousel-section-num">num</div>
      <h2>heading</h2>
    </div>
    <div class="ps-qcarousel-stage" id>
      <div class="ps-qcarousel-slide ps-qcarousel-slide-active" data-slide>
        <blockquote class="ps-qcarousel-quote">quote</blockquote>
        <div class="ps-qcarousel-attribution">
          <div class="ps-qcarousel-avatar">initial</div>
          <div class="ps-qcarousel-meta">
            <div class="ps-qcarousel-title">title</div>
            <div class="ps-qcarousel-subtitle">subtitle</div>
          </div>
        </div>
      </div>
    </div>
    <div class="ps-qcarousel-controls">
      <button class="ps-qcarousel-btn ps-qcarousel-prev">svg</button>
      <div class="ps-qcarousel-dots">
        <button class="ps-qcarousel-dot active" data-dot></button>
      </div>
      <button class="ps-qcarousel-btn ps-qcarousel-next">svg</button>
    </div>
  </div>
</section>
```

**CSS — section:** padding `0 max(28px, calc((100% - var(--maxw)) / 2))`; background `var(--surface)`; relative; overflow hidden; min-height 400px; flex, align-items center.

**CSS — typography:** h2 `clamp(32px, 4vw, 56px)` color `--brand-primary`; section-num `clamp(28px, 3.2vw, 44px)` weight 900; quote `clamp(20px, 2.4vw, 30px)` weight 500 line-height 1.55 italic color `--text`; avatar 48px circle background `--brand-accent-secondary` color `--brand-primary` weight 800 20px; title 17px weight 800 color `--brand-primary`; subtitle 14px color `--text-muted`.

**CSS — layout / children:**
- `.ps-qcarousel-wave`: absolute inset 0, flex end, justify space-evenly, opacity 0.06, pointer-events none, z-index 0
- `.ps-qcarousel-wave-bar`: flex 1, max-width 6px, border-radius 2px, background `--brand-primary`, height `calc(10% + 80% * sin(...))`, `animation: qwave 5s ease-in-out infinite`, `animation-delay: calc(var(--i) * 0.06s)`
- `.ps-qcarousel-inner`: relative z-index 1, padding `48px 0`
- `.ps-qcarousel-stage`: relative, min-height 200px
- `.ps-qcarousel-slide`: absolute inset 0, opacity 0, `transform: translateY(12px)`, transitions `opacity 0.45s ease, transform 0.45s ease`, pointer-events none
- `.ps-qcarousel-slide-active`: relative, opacity 1, translateY(0), z-index 2
- `.ps-qcarousel-slide-out`: opacity 0, translateY(-12px)
- `.ps-qcarousel-attribution`: flex, gap 16px, align-items center
- `.ps-qcarousel-controls`: flex, gap 12px, margin-top 20px

**CSS — interactions:**
- `.ps-qcarousel-btn`: 36px circle, border `2px var(--brand-primary)`, transitions `background 0.2s, color 0.2s, transform 0.15s`; hover: scale(1.05) + background swap; disabled opacity 0.25
- `.ps-qcarousel-dot`: 10px circle, opacity 0.2, transitions `opacity 0.3s, transform 0.3s, width 0.3s`; `.active`: opacity 1, width 28px, border-radius 5px, background `--brand-accent-secondary`; hover opacity 0.5
- Touch swipe on stage: paginates

**CSS — animations:**
- `@keyframes qwave`: `0%, 100% { scaleY(0.3); } 50% { scaleY(1); }`, duration 5s ease-in-out infinite
- `@keyframes qwave-burst`: `0% { scaleY(1.8); } 100% { scaleY(0.3); }`, 0.5s ease-out, applied via `.ps-qcarousel-wave-burst` class during slide transitions

**CSS — dark (`.ps-qcarousel-dark`):** gradient bg; wave-bar `--brand-accent-secondary`; quote `--text-on-dark`; avatar `--brand-accent-secondary` bg + `--brand-primary-deep` color; title `--text-on-dark`; subtitle `--text-on-dark-muted`; buttons/dots inverted.

**CSS — mobile (600px):** section min-height 360px; h2 32px; stage min-height 180px; quote 18px; avatar 40px font 17px; btn 32px.

---

### TextBlock — `.ps-textblock-section`

**Props (TS)**
```ts
interface Props {
  sectionNumber?: string;
  heading: string;
  leadText?: string;
  columnOne: string;
  columnTwo: string;
  dark?: boolean;
}
```

**HTML structure**
```
<section class="ps-section ps-textblock-section">
  <div class="ps-textblock-header">
    <div class="ps-textblock-num">num</div>
    <h2>heading</h2>
  </div>
  <p class="ps-textblock-lead">lead text</p>
  <div class="ps-textblock-columns">
    <div class="ps-textblock-col">html</div>
    <div class="ps-textblock-col">html</div>
  </div>
</section>
```

**CSS — section:** padding `96px max(28px, calc((100% - var(--maxw)) / 2))`; background `var(--surface)`.

**CSS — typography:** h2 `clamp(32px, 4vw, 56px)` color `--brand-primary`; section-num font-display weight 900 `clamp(28px, 3.2vw, 44px)` color `--text-on-dark` on `--brand-primary` padding `10px 14px 8px` border-radius 10px; lead 22px weight 500 color `--brand-primary` max-width 80ch; col p 16px line-height 1.6 color `--text`.

**CSS — layout / children:**
- `.ps-textblock-header`: flex, align-items center, gap 18px, margin-bottom 12px
- `.ps-textblock-columns`: grid `1fr 1fr`, gap 48px

**CSS — dark (`.ps-textblock-dark`):** gradient bg; h2/lead `--text-on-dark`; section-num `--brand-accent-secondary`; col text `--text-on-dark-muted`.

**CSS — mobile (600px):** section padding 64px 18px; h2 32px; lead 18px; columns 1 col gap 24px.

---

### VoiceGrid — `.ps-voice-section`

**Props (TS)**
```ts
interface Voice {
  percent: number;
  title: string;
  meta: string;
  description: string;
  color?: string;       // per-card accent; applied via `--voice`
}
interface Props {
  sectionNumber?: string;
  heading?: string;
  subtitle?: string;
  voices: Voice[];
  dark?: boolean;
}
```

**HTML structure**
```
<section class="ps-section ps-voice-section">
  <div class="ps-voice-header">
    <div class="ps-voice-section-num">num</div>
    <h2>heading</h2>
  </div>
  <p class="ps-voice-subtitle">subtitle</p>
  <div class="ps-voice-grid">
    <article class="ps-voice-card" style="--voice: color">
      <div class="ps-voice-share">percent<span>%</span></div>
      <h3>title</h3>
      <div class="ps-voice-meta">meta</div>
      <p>description</p>
    </article>
  </div>
</section>
```

**CSS — section:** padding `96px max(28px, calc((100% - var(--maxw)) / 2))`; background `var(--surface)`.

**CSS — typography:** h2 `clamp(32px, 4vw, 56px)` color `--brand-primary`; section-num `clamp(28px, 3.2vw, 44px)` weight 900; subtitle 17px color `--text-muted`; share 64px weight 900 color `var(--voice)`; share span 28px opacity 0.8; card h3 22px color `--text-on-dark`; meta 12px letter-spacing 0.08em uppercase color `--text-on-dark-muted`; card p 14px color `rgba(255,255,255,0.82)`.

**CSS — layout / children:**
- `.ps-voice-grid`: grid `auto-fit minmax(220px, 1fr)`, gap 18px
- `.ps-voice-card`: background `rgba(255,255,255,0.04)`, border `1px solid var(--line-dark)`, border-radius `var(--radius)`, padding 24px, relative
- `.ps-voice-card::before`: left 4px accent bar, background `var(--voice)`

**CSS — interactions:**
- `.ps-voice-card:hover`: `transform: translateY(-3px); border-color: var(--voice); transition: transform 0.25s ease, border-color 0.25s ease`

**CSS — dark (`.ps-voice-dark`):** gradient bg + `--text-on-dark`.

**CSS — light (`.ps-voice-section:not(.ps-voice-dark)`):** card background `--surface-card` + `1px var(--line)` + `var(--shadow)`; card h3 `--brand-primary`; meta/p/subtitle all switched to light-theme colours.

**CSS — mobile (900px):** grid `repeat(2, 1fr)`.
**CSS — mobile (600px):** section padding 64px 18px.
**CSS — mobile (520px):** grid `1fr`.

**Reveal:** cards get `.ps-reveal-child` stagger.

---

## 5. Floating nav

`src/components/FloatingNav.astro` + `floating-nav.css`. Visible only on viewports `>= 1200px`.

- Position: `fixed; top: 104px; right: 24px; max-width: 260px`.
- `max-height: calc(100vh - 128px); overflow: auto` — scrolls internally when long.
- Background: `color-mix(--surface-card 92%, transparent)` with `backdrop-filter: saturate(1.2) blur(10px)`.
- Border `1px solid var(--line)`, radius `14px`, shadow `0 12px 32px rgba(0,0,0,0.08)`.
- Link styles: `padding 7px 10px`, radius `8px`, transitions `background 0.15s, color 0.15s`.
- Active link: brand-primary bg, `--brand-accent-secondary` number.
- IntersectionObserver highlights the current section (`rootMargin: -40% 0 -55% 0`).
- Labels fall back in this order: `menuLabel → heading → eyebrow → type`. Header + Footer are excluded from the nav entirely.

---

## 6. Dev editor (non-prod only)

`src/components/editor.ts` + `editor.css`. Guarded by `import.meta.env.DEV`; the API routes in `src/pages/api/` are excluded from the production build.

- Hover a section to reveal controls: drag, edit, delete.
- Footer has only the Edit button — it can't be dragged or deleted and is always pinned as the last section.
- New sections are inserted just before the footer; file prefixes are renumbered so filesystem ordering matches render order.
- "Brand colours" opens a live editor for the 6 brand variables; changes write to `src/themes/theme.css`.
- All editor CSS is stripped from production output.

---

## 7. Background alternation

In `src/pages/index.astro`:

- Header, Hero, HeroSimple, Footer are **self-styled** (`altIndex: -1`) — they never participate in alternation.
- All other sections receive a zero-based `altIndex`; odd indices render dark (`.ps-section-dark-wrap`), even render light.
- JSON `variant: "dark" | "light"` overrides the automatic choice. `variant: "auto"` (default) uses alternation.

---

## 8. File map

```
src/
├─ content/sections/          ← Ordered JSON; one file per rendered section
├─ themes/theme.css           ← The 6 brand CSS variables
├─ kit/
│  ├─ styles/
│  │  ├─ tokens.css           ← All design tokens
│  │  ├─ base.css             ← Reset, `.ps-section`, buttons, reveal
│  │  └─ components/*.css     ← One file per component
│  ├─ components/*.astro      ← 20 components
│  └─ lib/
│     ├─ animations.ts        ← Reveal + chart animations + scroll-top replay
│     └─ counter.ts           ← Hero stat counter
├─ components/
│  ├─ DevEditor.astro         ← Dev-only wrapper
│  ├─ editor.ts / editor.css  ← Dev-mode editor UI
│  └─ FloatingNav.astro       ← The TOC
├─ layouts/SectionRenderer.astro  ← JSON type → component
└─ pages/
   ├─ index.astro             ← Reads sections, renders all
   └─ api/sections.ts, theme.ts  ← Dev-only CRUD
```
