/**
 * Dev-mode section editor — client-side script.
 * Handles drag-and-drop reordering, edit modals, delete, add, and theme editing.
 *
 * SAFETY: This module is only meaningful during `astro dev`. In production
 * builds the top-level side effects (Vite event listener, initEditor call)
 * are guarded so even if the bundle is somehow loaded, it does nothing.
 */

import './editor.css';

const IS_DEV = import.meta.env.DEV;

// ─── API helpers ───────────────────────────────────────────

async function api(method: string, body?: any) {
  const res = await fetch('/api/sections', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${method} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ─── Reload block after save ─────────────────────────────
// Prevent Astro/Vite auto-reload after save via vite:beforeFullReload.
// Not bulletproof (Astro sometimes bypasses it), but better than nothing.

let blockNextReload = false;
let blockClearTimer: number | null = null;

function setBlockReload() {
  blockNextReload = true;
  if (blockClearTimer) clearTimeout(blockClearTimer);
  blockClearTimer = window.setTimeout(() => {
    blockNextReload = false;
    blockClearTimer = null;
  }, 2000);
}

if (IS_DEV) {
  document.addEventListener('vite:beforeFullReload', (e) => {
    if (blockNextReload) {
      e.preventDefault();
      blockNextReload = false;
      if (blockClearTimer) { clearTimeout(blockClearTimer); blockClearTimer = null; }
    }
  });
}

// ─── Reload helper ───────────────────────────────────────

function forceReload() {
  blockNextReload = false;
  if (blockClearTimer) { clearTimeout(blockClearTimer); blockClearTimer = null; }
  location.reload();
}


// ─── Side panel helpers ──────────────────────────────────

function openModal(overlay: HTMLElement) {
  document.body.appendChild(overlay);
}

function closeModal(overlay: HTMLElement) {
  const scrollY = window.scrollY;
  overlay.classList.add('ps-panel-closing');
  overlay.addEventListener('transitionend', () => {
    overlay.remove();
    // Force scroll back in case browser shifted
    window.scrollTo(0, scrollY);
  }, { once: true });
  // Safety fallback if transitionend doesn't fire
  setTimeout(() => {
    if (overlay.parentNode) overlay.remove();
    window.scrollTo(0, scrollY);
  }, 300);
}

// ─── Form definitions per section type ─────────────────────

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'color';
  options?: string[];
}

interface GroupDef {
  key: string;
  label: string;
  fields: FormField[];
}

interface FormDef {
  fields: FormField[];
  groups: GroupDef[];
}

const FORM_DEFS: Record<string, FormDef> = {
  'header': {
    fields: [
      { key: 'logo', label: 'Logo path or URL (e.g. /assets/logo.svg)', type: 'text' },
      { key: 'logoAlt', label: 'Logo alt text', type: 'text' },
      { key: 'title', label: 'Project title', type: 'text' },
    ],
    groups: [],
  },
  'hero-simple': {
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { key: 'headline', label: 'Headline (use **text** for accent, \\n for line break)', type: 'textarea' },
      { key: 'lede', label: 'Lede', type: 'textarea' },
    ],
    groups: [],
  },
  hero: {
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { key: 'headline', label: 'Headline (use **text** for accent, \\n for line break)', type: 'textarea' },
      { key: 'lede', label: 'Lede', type: 'textarea' },
    ],
    groups: [
      {
        key: 'stats',
        label: 'Stats',
        fields: [
          { key: 'value', label: 'Value', type: 'number' },
          { key: 'unit', label: 'Unit', type: 'text' },
          { key: 'label', label: 'Label', type: 'text' },
        ],
      },
      {
        key: 'ctas',
        label: 'CTAs',
        fields: [
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'href', label: 'Link', type: 'text' },
          { key: 'variant', label: 'Variant', type: 'select', options: ['primary', 'ghost'] },
        ],
      },
    ],
  },
  'bar-chart': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'sectionNumber', label: 'Badge number (e.g. 01 — shows beside heading)', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'description', label: 'Description (HTML allowed)', type: 'textarea' },
      { key: 'unit', label: 'Unit suffix (e.g. %, k, pts)', type: 'text' },
    ],
    groups: [
      {
        key: 'bars',
        label: 'Bars',
        fields: [
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'value', label: 'Value', type: 'number' },
          { key: 'color', label: 'Colour', type: 'color' },
        ],
      },
    ],
  },
  'quote-carousel': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'sectionNumber', label: 'Badge number (e.g. 01 — shows beside heading)', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
    ],
    groups: [
      {
        key: 'quotes',
        label: 'Quotes',
        fields: [
          { key: 'quote', label: 'Quote', type: 'textarea' },
          { key: 'title', label: 'Name / source', type: 'text' },
          { key: 'subtitle', label: 'Role / context', type: 'text' },
        ],
      },
    ],
  },
  'flip-cards': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'sectionNumber', label: 'Badge number (e.g. 01 — shows beside heading)', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'cardsPerPage', label: 'Cards per page (1–8)', type: 'number' },
    ],
    groups: [
      {
        key: 'cards',
        label: 'Cards',
        fields: [
          { key: 'title', label: 'Card title', type: 'text' },
          { key: 'description', label: 'Back description (HTML allowed)', type: 'textarea' },
          { key: 'image', label: 'Image path or URL (e.g. /assets/photo.jpg)', type: 'text' },
          { key: 'imageAlt', label: 'Image alt text', type: 'text' },
        ],
      },
    ],
  },
  'quote-block': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'sectionNumber', label: 'Badge number (e.g. 01 — shows beside heading)', type: 'text' },
      { key: 'heading', label: 'Heading (optional — shown above the quote)', type: 'text' },
      { key: 'eyebrow', label: 'Eyebrow pill (optional)', type: 'text' },
      { key: 'quote', label: 'Quote', type: 'textarea' },
      { key: 'title', label: 'Name / source', type: 'text' },
      { key: 'subtitle', label: 'Role / context', type: 'text' },
    ],
    groups: [],
  },
  'customer-journey': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'sectionNumber', label: 'Badge number (e.g. 01 — shows beside heading)', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
    ],
    groups: [
      {
        key: 'phases',
        label: 'Phases (max 6)',
        fields: [
          { key: 'title', label: 'Phase title', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
        ],
      },
    ],
  },
  'customer-type': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'sectionNumber', label: 'Badge number (e.g. 01 — shows beside heading)', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
    ],
    groups: [
      {
        key: 'personas',
        label: 'Personas (max 4)',
        fields: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'description', label: 'Description (front of card)', type: 'textarea' },
          { key: 'image', label: 'Image path or URL (front background)', type: 'text' },
          { key: 'imageAlt', label: 'Image alt text', type: 'text' },
        ],
      },
    ],
  },
  'footer': {
    fields: [
      { key: 'text', label: 'Primary text (HTML allowed)', type: 'textarea' },
      { key: 'note', label: 'Secondary note (optional, HTML allowed)', type: 'textarea' },
    ],
    groups: [],
  },
  'voice-grid': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'sectionNumber', label: 'Badge number (e.g. 01 — shows beside heading)', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
    ],
    groups: [
      {
        key: 'voices',
        label: 'Voices',
        fields: [
          { key: 'percent', label: 'Percent', type: 'number' },
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'meta', label: 'Meta', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'color', label: 'Colour', type: 'color' },
        ],
      },
    ],
  },
  'key-insights': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'sectionNumber', label: 'Badge number (e.g. 01 — shows beside heading)', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
    ],
    groups: [
      {
        key: 'insights',
        label: 'Insights',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'text', label: 'Text', type: 'textarea' },
        ],
      },
    ],
  },
  'text-block': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'sectionNumber', label: 'Badge number (e.g. 01 — shows beside heading)', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'leadText', label: 'Lead text (optional intro paragraph)', type: 'textarea' },
      { key: 'columnOne', label: 'Column one (HTML allowed)', type: 'textarea' },
      { key: 'columnTwo', label: 'Column two (HTML allowed)', type: 'textarea' },
    ],
    groups: [],
  },
  'numbered-list': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'sectionNumber', label: 'Badge number (e.g. 01 — shows beside heading)', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
    ],
    groups: [
      {
        key: 'items',
        label: 'Items',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
        ],
      },
    ],
  },
  'faq': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'sectionNumber', label: 'Badge number (e.g. 01 — shows beside heading)', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
    ],
    groups: [
      {
        key: 'items',
        label: 'Questions',
        fields: [
          { key: 'question', label: 'Question', type: 'text' },
          { key: 'answer', label: 'Answer (HTML allowed)', type: 'textarea' },
        ],
      },
    ],
  },
  'pie-chart': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'sectionNumber', label: 'Badge number (e.g. 01 — shows beside heading)', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'description', label: 'Description (HTML allowed)', type: 'textarea' },
    ],
    groups: [
      {
        key: 'slices',
        label: 'Slices',
        fields: [
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'value', label: 'Value', type: 'number' },
          { key: 'color', label: 'Colour', type: 'color' },
        ],
      },
    ],
  },
  'data-table': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'sectionNumber', label: 'Badge number (e.g. 01 — shows beside heading)', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: '_headersText', label: 'Column headers (comma separated)', type: 'text' },
      { key: '_rowsText', label: 'Table rows (one per line, columns separated by |)', type: 'textarea' },
    ],
    groups: [],
  },
  'image-carousel': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'sectionNumber', label: 'Badge number (e.g. 01 — shows beside heading)', type: 'text' },
      { key: 'heading', label: 'Section heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
    ],
    groups: [
      {
        key: 'slides',
        label: 'Slides',
        fields: [
          { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
          { key: 'heading', label: 'Heading', type: 'text' },
          { key: 'description', label: 'Description (HTML)', type: 'textarea' },
          { key: 'image', label: 'Image URL', type: 'text' },
          { key: 'imageAlt', label: 'Image alt text', type: 'text' },
        ],
      },
    ],
  },
  'carousel': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'sectionNumber', label: 'Badge number (e.g. 01 — shows beside heading)', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
    ],
    groups: [
      {
        key: 'items',
        label: 'Cards',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'description', label: 'Description (HTML allowed)', type: 'textarea' },
        ],
      },
    ],
  },
  'feature-image': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'eyebrow', label: 'Eyebrow (small text above heading)', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'description', label: 'Description (HTML allowed)', type: 'textarea' },
      { key: 'image', label: 'Image URL or path (e.g. /images/photo.jpg)', type: 'text' },
      { key: 'imageAlt', label: 'Image alt text', type: 'text' },
    ],
    groups: [],
  },
};

const SECTION_TYPES = [
  { type: 'header', label: 'Header', description: 'Client logo + project title bar' },
  { type: 'hero', label: 'Hero', description: 'Full-width hero with stat counters and CTAs' },
  { type: 'hero-simple', label: 'Hero (Simple)', description: 'Clean hero with headline only — no stats or CTAs' },
  { type: 'voice-grid', label: 'Voice Grid', description: 'Respondent cohort cards on dark background' },
  { type: 'key-insights', label: 'Key Insights', description: 'Numbered card grid with titles and text' },
  { type: 'text-block', label: 'Text Block', description: 'Title with two-column text layout' },
  { type: 'numbered-list', label: 'Numbered List', description: 'Vertical numbered items with title and description' },
  { type: 'faq', label: 'FAQ', description: 'Accordion of questions and answers' },
  { type: 'pie-chart', label: 'Pie Chart', description: 'Donut chart with legend' },
  { type: 'bar-chart', label: 'Bar Chart', description: 'Horizontal bar graph with hover tooltips' },
  { type: 'data-table', label: 'Table', description: '3-column table with header row' },
  { type: 'feature-image', label: 'Feature Image', description: 'Split layout: text left, image right' },
  { type: 'carousel', label: 'Carousel', description: 'Paginated cards with left/right navigation' },
  { type: 'image-carousel', label: 'Image Carousel', description: 'Feature image cards with pagination' },
  { type: 'quote-carousel', label: 'Quote Carousel', description: 'Paginated quote cards with attribution' },
  { type: 'flip-cards', label: 'Flip Cards', description: 'Click-to-flip cards that gently float, with pagination' },
  { type: 'quote-block', label: 'Quote Block', description: 'Single pull-quote with animated line-art doodles' },
  { type: 'customer-journey', label: 'Customer Journey', description: 'Ascending staircase of up to 6 phases' },
  { type: 'customer-type', label: 'Customer Type', description: 'Up to 4 flip cards: image + name on front, struggles + opportunities on back' },
  { type: 'footer', label: 'Footer', description: 'Brand-coloured page footer with editable text' },
];

const DEFAULTS: Record<string, any> = {
  header: {
    type: 'header',
    logo: '/assets/logo.svg',
    logoAlt: 'Client logo',
    title: 'Project Title',
  },
  hero: {
    type: 'hero',
    eyebrow: 'Project title \u00b7 Month 2026',
    headline: 'Your headline here.\n**Accent text.**',
    lede: 'Subheading paragraph.',
    stats: [{ value: 0, unit: '%', label: 'metric' }],
    ctas: [{ label: 'Button', href: '#', variant: 'primary' }],
  },
  'hero-simple': {
    type: 'hero-simple',
    eyebrow: 'Project title \u00b7 Month 2026',
    headline: 'Your headline here.\n**Accent text.**',
    lede: 'Subheading paragraph.',
  },
  'voice-grid': {
    type: 'voice-grid',
    variant: 'auto',
    voices: [
      { percent: 50, title: 'Group A', meta: '100 respondents', description: 'Description.', color: '#e63946' },
    ],
  },
  'key-insights': {
    type: 'key-insights',
    variant: 'auto',
    heading: 'Key insights',
    subtitle: 'Summary of findings.',
    insights: [
      { title: 'First insight', text: 'Description of the first key finding.' },
      { title: 'Second insight', text: 'Description of the second key finding.' },
      { title: 'Third insight', text: 'Description of the third key finding.' },
    ],
  },
  'numbered-list': {
    type: 'numbered-list',
    variant: 'auto',
    heading: 'Steps',
    subtitle: 'How this works.',
    items: [
      { title: 'First step', description: 'Description of the first step.' },
      { title: 'Second step', description: 'Description of the second step.' },
      { title: 'Third step', description: 'Description of the third step.' },
    ],
  },
  'faq': {
    type: 'faq',
    variant: 'auto',
    heading: 'Frequently asked questions',
    items: [
      { question: 'What is this about?', answer: '<p>Answer to the first question.</p>' },
      { question: 'How does it work?', answer: '<p>Answer to the second question.</p>' },
      { question: 'What happens next?', answer: '<p>Answer to the third question.</p>' },
    ],
  },
  'pie-chart': {
    type: 'pie-chart',
    variant: 'auto',
    heading: 'Breakdown',
    subtitle: 'Distribution across categories.',
    slices: [
      { label: 'Category A', value: 45, color: '#e63946' },
      { label: 'Category B', value: 30, color: '#f4a261' },
      { label: 'Category C', value: 15, color: '#2a9d8f' },
      { label: 'Category D', value: 10, color: '#457b9d' },
    ],
  },
  'bar-chart': {
    type: 'bar-chart',
    variant: 'auto',
    heading: 'Response breakdown',
    description: '<p>How responses were distributed across categories.</p>',
    unit: '%',
    bars: [
      { label: 'Category A', value: 85, color: '#e63946' },
      { label: 'Category B', value: 72, color: '#f4a261' },
      { label: 'Category C', value: 58, color: '#2a9d8f' },
      { label: 'Category D', value: 41, color: '#457b9d' },
    ],
  },
  'data-table': {
    type: 'data-table',
    variant: 'auto',
    heading: 'Comparison',
    headers: ['Feature', 'Option A', 'Option B'],
    rows: [
      ['First item', 'Yes', 'No'],
      ['Second item', 'Partial', 'Yes'],
      ['Third item', 'No', 'Yes'],
    ],
  },
  'image-carousel': {
    type: 'image-carousel',
    variant: 'auto',
    heading: 'Featured stories',
    slides: [
      { eyebrow: 'Story one', heading: 'First feature', description: '<p>Description of the first featured item.</p>', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop', imageAlt: 'First image' },
      { eyebrow: 'Story two', heading: 'Second feature', description: '<p>Description of the second featured item.</p>', image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop', imageAlt: 'Second image' },
    ],
  },
  'carousel': {
    type: 'carousel',
    variant: 'auto',
    heading: 'Here are the jobs',
    items: [
      { title: 'Job 1', description: '<p>Description of the first role and its responsibilities.</p>' },
      { title: 'Job 2', description: '<p>Description of the second role and what it involves.</p>' },
      { title: 'Job 3', description: '<p>Description of the third role and its key outcomes.</p>' },
    ],
  },
  'quote-carousel': {
    type: 'quote-carousel',
    variant: 'auto',
    heading: 'What people said',
    quotes: [
      { quote: 'This is an example quote that captures a key sentiment from a respondent or stakeholder.', title: 'Jane Smith', subtitle: 'Club President' },
      { quote: 'Another perspective that adds depth and context to the findings presented.', title: 'John Doe', subtitle: 'Regional Manager' },
      { quote: 'A third voice rounding out the picture with a different angle on the topic.', title: 'Sarah Lee', subtitle: 'Committee Member' },
    ],
  },
  'flip-cards': {
    type: 'flip-cards',
    variant: 'auto',
    heading: 'Featured cards',
    subtitle: 'Click a card to learn more.',
    cardsPerPage: 3,
    cards: [
      { title: 'First concept', description: '<p>Short explanation revealed on flip. Keep it focused — two or three sentences works well.</p>', image: '/assets/IMG_1960.JPG', imageAlt: 'Card one' },
      { title: 'Second concept', description: '<p>Another idea worth unpacking. The back of the card has room for a paragraph of context.</p>', image: '/assets/IMG_1960.JPG', imageAlt: 'Card two' },
      { title: 'Third concept', description: '<p>A third point to round out the set. You can use HTML for <strong>emphasis</strong> and structure.</p>', image: '/assets/IMG_1960.JPG', imageAlt: 'Card three' },
    ],
  },
  'quote-block': {
    type: 'quote-block',
    variant: 'auto',
    eyebrow: 'In their words',
    quote: 'A single standout quote that anchors the page with plenty of space around it.',
    title: 'Jane Smith',
    subtitle: 'Club President',
  },
  'customer-journey': {
    type: 'customer-journey',
    variant: 'auto',
    heading: 'Customer journey',
    subtitle: 'Six phases from first contact to advocacy.',
    phases: [
      { title: 'Awareness', description: 'The moment someone first hears about us — from a friend, an ad, or a search.' },
      { title: 'Consideration', description: 'They compare options and weigh up whether this is right for them.' },
      { title: 'Sign-up', description: 'The account is created and the first action is taken.' },
      { title: 'Onboarding', description: 'They find their footing and complete the first valuable task.' },
      { title: 'Habit', description: 'Regular use becomes part of their routine.' },
      { title: 'Advocacy', description: 'They recommend us to others and help the community grow.' },
    ],
  },
  'footer': {
    type: 'footer',
    text: 'Prepared by Purple Shirt',
    note: '',
  },
  'customer-type': {
    type: 'customer-type',
    variant: 'auto',
    heading: 'Customer types',
    subtitle: 'Who we are designing for. Click a card to see struggles and opportunities.',
    personas: [
      {
        name: 'The Newcomer',
        description: 'Just signed up this week. Exploring to see if this is worth their time.',
        image: '/assets/IMG_1960.JPG',
        imageAlt: 'Newcomer persona',
        struggles: [
          { text: 'Unsure where to start or what the first step should be.' },
          { text: 'Intimidated by unfamiliar terminology.' },
        ],
        opportunities: [
          { text: 'Clear guided onboarding tailored to their goal.' },
          { text: 'Early wins within the first session.' },
        ],
      },
      {
        name: 'The Regular',
        description: 'Uses the product weekly. Has built habits and preferences.',
        image: '/assets/IMG_1960.JPG',
        imageAlt: 'Regular persona',
        struggles: [
          { text: 'Repetitive tasks they wish were faster.' },
          { text: 'Feature discoverability — misses new capabilities.' },
        ],
        opportunities: [
          { text: 'Shortcuts and automation for repeated flows.' },
          { text: 'Contextual prompts about new features.' },
        ],
      },
    ],
  },
  'feature-image': {
    type: 'feature-image',
    eyebrow: 'Featured',
    heading: 'Section title',
    description: '<p>A paragraph describing this feature or highlight. Supports HTML for emphasis and links.</p>',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
    imageAlt: 'Feature image',
  },
  'text-block': {
    type: 'text-block',
    variant: 'auto',
    heading: 'Section title',
    leadText: 'An introductory sentence that sets up the two columns below.',
    columnOne: '<p>First column of body text. This supports HTML so you can use paragraphs, emphasis, and links.</p>',
    columnTwo: '<p>Second column of body text. Use this for supporting detail, context, or complementary information.</p>',
  },
};

// ─── Theme variables ──────────────────────────────────────

const THEME_VARS = [
  { key: '--brand-primary', label: 'Primary', description: 'Hero bg, headings, badges' },
  { key: '--brand-primary-deep', label: 'Primary deep', description: 'Gradient dark end' },
  { key: '--brand-primary-mid', label: 'Primary mid', description: 'Gradient light end' },
  { key: '--brand-accent', label: 'Accent', description: 'CTAs, highlights' },
  { key: '--brand-accent-deep', label: 'Accent deep', description: 'Hover states' },
  { key: '--brand-accent-secondary', label: 'Secondary', description: 'Stat borders, accent text' },
];

// ─── DOM helpers ───────────────────────────────────────────

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  ...children: (string | Node)[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  children.forEach(c => e.append(typeof c === 'string' ? document.createTextNode(c) : c));
  return e;
}

// ─── Drag and drop ────────────────────────────────────────

let dragSourceFile: string | null = null;

function initDragDrop() {
  const sections = document.querySelectorAll<HTMLElement>('.ps-editor-section');

  sections.forEach((section) => {
    const handle = section.querySelector<HTMLElement>('.ps-editor-btn-drag');
    if (!handle) return;

    // Make the whole section draggable when handle is grabbed
    handle.addEventListener('mousedown', () => section.setAttribute('draggable', 'true'));
    handle.addEventListener('mouseup', () => section.removeAttribute('draggable'));

    section.addEventListener('dragstart', (e) => {
      dragSourceFile = section.dataset.sectionFile || null;
      section.classList.add('dragging');
      e.dataTransfer!.effectAllowed = 'move';
      e.dataTransfer!.setData('text/plain', dragSourceFile || '');
    });

    section.addEventListener('dragend', () => {
      section.classList.remove('dragging');
      section.removeAttribute('draggable');
      dragSourceFile = null;
      clearDropIndicators();
    });

    section.addEventListener('dragover', (e) => {
      if (!dragSourceFile || dragSourceFile === section.dataset.sectionFile) return;
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'move';
      clearDropIndicators();
      const indicator = section.previousElementSibling;
      if (indicator?.classList.contains('ps-editor-drop-indicator')) {
        indicator.classList.add('active');
      }
    });

    section.addEventListener('dragleave', () => {
      const indicator = section.previousElementSibling;
      if (indicator?.classList.contains('ps-editor-drop-indicator')) {
        indicator.classList.remove('active');
      }
    });

    section.addEventListener('drop', async (e) => {
      e.preventDefault();
      clearDropIndicators();

      const targetFile = section.dataset.sectionFile;
      if (!dragSourceFile || !targetFile || dragSourceFile === targetFile) return;

      const allSections = [...document.querySelectorAll<HTMLElement>('.ps-editor-section')];
      const files = allSections.map(s => s.dataset.sectionFile!);

      const sourceIdx = files.indexOf(dragSourceFile);
      files.splice(sourceIdx, 1);
      const targetIdx = files.indexOf(targetFile);
      files.splice(targetIdx, 0, dragSourceFile);

      try {
        await api('PATCH', { order: files });
        forceReload();
      } catch (err) {
        console.error('Reorder failed:', err);
        alert('Failed to reorder sections');
      }
    });
  });
}

function clearDropIndicators() {
  document.querySelectorAll('.ps-editor-drop-indicator').forEach(ind => ind.classList.remove('active'));
}

// ─── Form builders ────────────────────────────────────────

function buildFormFields(
  container: HTMLElement,
  fields: FormField[],
  data: Record<string, any>,
  groupKey: string,
  itemIdx: number
) {
  fields.forEach((f) => {
    const label = el('label', {}, f.label);
    container.append(label);

    // Unique name scoped by group + item index + field key
    const name = `${groupKey}__${itemIdx}__${f.key}`;

    if (f.type === 'textarea') {
      const ta = el('textarea', { 'data-field': f.key, 'data-group': groupKey, name });
      ta.value = data[f.key] ?? '';
      container.append(ta);
    } else if (f.type === 'select' && f.options) {
      const select = el('select', { 'data-field': f.key, 'data-group': groupKey, name });
      f.options.forEach(opt => {
        const option = el('option', { value: opt }, opt);
        if (data[f.key] === opt) option.selected = true;
        select.append(option);
      });
      container.append(select);
    } else if (f.type === 'color') {
      const input = el('input', { type: 'color', 'data-field': f.key, 'data-group': groupKey, name, value: data[f.key] || '#e63946' });
      container.append(input);
    } else if (f.type === 'number') {
      const input = el('input', { type: 'number', 'data-field': f.key, 'data-group': groupKey, name, value: String(data[f.key] ?? '') });
      container.append(input);
    } else {
      const input = el('input', { type: 'text', 'data-field': f.key, 'data-group': groupKey, name, value: data[f.key] ?? '' });
      container.append(input);
    }
  });
}

function buildTopLevelFields(
  container: HTMLElement,
  fields: FormField[],
  data: Record<string, any>
) {
  fields.forEach((f) => {
    const label = el('label', {}, f.label);
    container.append(label);

    const name = `__top__${f.key}`;
    const attrs = { 'data-field': f.key, 'data-group': '__top', name };

    if (f.type === 'textarea') {
      const ta = el('textarea', attrs);
      ta.value = data[f.key] ?? '';
      container.append(ta);
    } else if (f.type === 'select' && f.options) {
      const select = el('select', attrs);
      f.options.forEach(opt => {
        const option = el('option', { value: opt }, opt);
        if (data[f.key] === opt) option.selected = true;
        select.append(option);
      });
      container.append(select);
    } else if (f.type === 'color') {
      const input = el('input', { ...attrs, type: 'color', value: data[f.key] || '#e63946' });
      container.append(input);
    } else if (f.type === 'number') {
      const input = el('input', { ...attrs, type: 'number', value: String(data[f.key] ?? '') });
      container.append(input);
    } else {
      const input = el('input', { ...attrs, type: 'text', value: data[f.key] ?? '' });
      container.append(input);
    }
  });
}

function buildGroupEditor(container: HTMLElement, group: GroupDef, items: any[]) {
  const groupEl = el('div', { class: 'ps-editor-group', 'data-group-key': group.key });
  const header = el('div', { class: 'ps-editor-group-header' });
  header.append(el('span', {}, group.label));

  const addBtn = el('button', { class: 'ps-editor-add-item-btn', type: 'button' }, '+ Add');
  header.append(addBtn);
  groupEl.append(header);

  const itemsContainer = el('div', { class: 'ps-editor-group-items', 'data-group': group.key });
  groupEl.append(itemsContainer);

  let nextIdx = 0;

  function addItem(data: Record<string, any> = {}) {
    const idx = nextIdx++;
    const itemEl = el('div', { class: 'ps-editor-group-item' });
    const removeBtn = el('button', { class: 'ps-editor-remove-item', type: 'button' }, '\u00d7');
    removeBtn.addEventListener('click', () => itemEl.remove());
    itemEl.append(removeBtn);
    buildFormFields(itemEl, group.fields, data, group.key, idx);
    itemsContainer.append(itemEl);
  }

  (items || []).forEach(item => addItem(item));
  addBtn.addEventListener('click', () => addItem({}));

  container.append(groupEl);
}

function collectFormData(modal: HTMLElement, formDef: FormDef, sectionType: string): Record<string, any> {
  const result: Record<string, any> = { type: sectionType };

  // Collect top-level fields
  formDef.fields.forEach(f => {
    const input = modal.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[data-group="__top"][data-field="${f.key}"]`
    );
    if (input) {
      result[f.key] = f.type === 'number' ? Number(input.value) : input.value;
    }
  });

  // Collect groups — iterate each group-item DOM element
  formDef.groups.forEach(g => {
    const itemsContainer = modal.querySelector(`[data-group="${g.key}"]`);
    if (!itemsContainer) {
      result[g.key] = [];
      return;
    }
    const items: any[] = [];
    itemsContainer.querySelectorAll('.ps-editor-group-item').forEach((itemEl) => {
      const item: Record<string, any> = {};
      g.fields.forEach(f => {
        const input = itemEl.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
          `[data-field="${f.key}"]`
        );
        if (input) {
          item[f.key] = f.type === 'number' ? Number(input.value) : input.value;
        }
      });
      items.push(item);
    });
    result[g.key] = items;
  });

  return result;
}

// ─── Edit modal ───────────────────────────────────────────

function openEditModal(file: string, sectionType: string, data: Record<string, any>) {
  const formDef = FORM_DEFS[sectionType];
  if (!formDef) {
    openJsonModal(file, data);
    return;
  }

  // Pre-process: convert structured data to form-friendly fields
  const formData = { ...data };
  if (sectionType === 'data-table') {
    formData._headersText = (data.headers || []).join(', ');
    formData._rowsText = (data.rows || []).map((r: string[]) => r.join(' | ')).join('\n');
  }

  const overlay = el('div', { class: 'ps-editor-modal-overlay' });
  const modal = el('div', { class: 'ps-editor-modal' });
  modal.append(el('h2', {}, `Edit ${sectionType}`));

  const form = el('div', {});
  buildTopLevelFields(form, formDef.fields, formData);
  formDef.groups.forEach(g => buildGroupEditor(form, g, formData[g.key] || []));
  modal.append(form);

  const actions = el('div', { class: 'ps-editor-modal-actions' });
  const cancelBtn = el('button', { class: 'ps-editor-modal-cancel', type: 'button' }, 'Cancel');
  const saveBtn = el('button', { class: 'ps-editor-modal-save', type: 'button' }, 'Save');

  cancelBtn.addEventListener('click', () => closeModal(overlay));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });

  saveBtn.addEventListener('click', async () => {
    try {
      const content = collectFormData(modal, formDef, sectionType);

      // Post-process: convert form fields back to structured data
      if (sectionType === 'data-table') {
        content.headers = (content._headersText || '').split(',').map((s: string) => s.trim()).filter(Boolean);
        content.rows = (content._rowsText || '').split('\n').filter((l: string) => l.trim()).map((line: string) => line.split('|').map((c: string) => c.trim()));
        delete content._headersText;
        delete content._rowsText;
      }

      setBlockReload();
      await api('PUT', { file, content });
      closeModal(overlay);
    } catch (err) {
      blockNextReload = false;
      console.error('Save failed:', err);
      alert('Failed to save: ' + (err as Error).message);
    }
  });

  actions.append(cancelBtn, saveBtn);
  modal.append(actions);
  overlay.append(modal);
  openModal(overlay);
}

function openJsonModal(file: string, data: Record<string, any>) {
  const overlay = el('div', { class: 'ps-editor-modal-overlay' });
  const modal = el('div', { class: 'ps-editor-modal' });
  modal.append(el('h2', {}, 'Edit (JSON)'));

  const ta = el('textarea', { style: 'min-height: 300px; font-family: monospace; font-size: 13px;' });
  ta.value = JSON.stringify(data, null, 2);
  modal.append(ta);

  const actions = el('div', { class: 'ps-editor-modal-actions' });
  const cancelBtn = el('button', { class: 'ps-editor-modal-cancel', type: 'button' }, 'Cancel');
  const saveBtn = el('button', { class: 'ps-editor-modal-save', type: 'button' }, 'Save');

  cancelBtn.addEventListener('click', () => closeModal(overlay));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });

  saveBtn.addEventListener('click', async () => {
    try {
      const content = JSON.parse(ta.value);
      setBlockReload();
      await api('PUT', { file, content });
      closeModal(overlay);
    } catch (err) {
      blockNextReload = false;
      alert('Invalid JSON or save failed');
    }
  });

  actions.append(cancelBtn, saveBtn);
  modal.append(actions);
  overlay.append(modal);
  openModal(overlay);
}

// ─── Delete ───────────────────────────────────────────────

async function deleteSection(file: string) {
  if (!confirm(`Delete section "${file}"?`)) return;
  try {
    await api('DELETE', { file });
    forceReload();
  } catch (err) {
    alert('Failed to delete: ' + (err as Error).message);
  }
}

// ─── Add section ──────────────────────────────────────────

function openAddModal() {
  const overlay = el('div', { class: 'ps-editor-modal-overlay' });
  const modal = el('div', { class: 'ps-editor-modal' });
  modal.append(el('h2', {}, 'Add section'));

  const picker = el('div', { class: 'ps-editor-type-picker' });
  SECTION_TYPES.forEach(({ type: sectionType, label, description }) => {
    const btn = el('button', { class: 'ps-editor-type-option', type: 'button' });
    btn.append(el('strong', {}, label));
    btn.append(el('span', {}, description));
    btn.addEventListener('click', async () => {
      closeModal(overlay);
      try {
        const defaults = DEFAULTS[sectionType] || { type: sectionType };
        await api('POST', defaults);
        forceReload();
      } catch (err) {
        console.error('Add section failed:', err);
        alert('Failed to add section: ' + (err as Error).message);
      }
    });
    picker.append(btn);
  });

  modal.append(picker);

  const actions = el('div', { class: 'ps-editor-modal-actions' });
  const cancelBtn = el('button', { class: 'ps-editor-modal-cancel', type: 'button' }, 'Cancel');
  cancelBtn.addEventListener('click', () => closeModal(overlay));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });
  actions.append(cancelBtn);
  modal.append(actions);
  overlay.append(modal);
  openModal(overlay);
}

// ─── Theme editor ─────────────────────────────────────────

function getCurrentThemeValues(): Record<string, string> {
  const style = getComputedStyle(document.documentElement);
  const values: Record<string, string> = {};
  THEME_VARS.forEach(v => {
    const raw = style.getPropertyValue(v.key).trim();
    values[v.key] = raw || '#000000';
  });
  return values;
}

function rgbToHex(rgb: string): string {
  // Handle rgb(r, g, b) format from getComputedStyle
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (match) {
    const [, r, g, b] = match;
    return '#' + [r, g, b].map(c => parseInt(c).toString(16).padStart(2, '0')).join('');
  }
  return rgb;
}

function openThemeModal() {
  const values = getCurrentThemeValues();

  const overlay = el('div', { class: 'ps-editor-modal-overlay' });
  const modal = el('div', { class: 'ps-editor-modal' });
  modal.append(el('h2', {}, 'Edit brand colours'));

  const form = el('div', {});

  THEME_VARS.forEach(v => {
    const row = el('div', { style: 'display: flex; align-items: center; gap: 12px; margin-bottom: 14px;' });
    const colorInput = el('input', {
      type: 'color',
      'data-var': v.key,
      value: rgbToHex(values[v.key]),
      style: 'width: 48px; height: 36px; border: 2px solid rgba(0,0,0,0.1); border-radius: 8px; cursor: pointer; padding: 2px;',
    });
    const hexInput = el('input', {
      type: 'text',
      'data-var-hex': v.key,
      value: rgbToHex(values[v.key]),
      style: 'width: 90px; font-family: monospace; font-size: 13px; padding: 8px; border: 2px solid rgba(0,0,0,0.1); border-radius: 8px;',
    });
    const labelDiv = el('div', { style: 'flex: 1;' });
    labelDiv.append(el('div', { style: 'font-weight: 600; font-size: 13px; color: #1a2236;' }, v.label));
    labelDiv.append(el('div', { style: 'font-size: 11px; color: #556077;' }, v.description));

    // Sync colour picker ↔ hex input
    colorInput.addEventListener('input', () => {
      hexInput.value = colorInput.value;
      document.documentElement.style.setProperty(v.key, colorInput.value);
    });
    hexInput.addEventListener('input', () => {
      if (/^#[0-9a-fA-F]{6}$/.test(hexInput.value)) {
        colorInput.value = hexInput.value;
        document.documentElement.style.setProperty(v.key, hexInput.value);
      }
    });

    row.append(colorInput, hexInput, labelDiv);
    form.append(row);
  });

  modal.append(form);

  const actions = el('div', { class: 'ps-editor-modal-actions' });
  const cancelBtn = el('button', { class: 'ps-editor-modal-cancel', type: 'button' }, 'Cancel');
  const saveBtn = el('button', { class: 'ps-editor-modal-save', type: 'button' }, 'Save to theme.css');

  cancelBtn.addEventListener('click', () => {
    // Reset live preview
    THEME_VARS.forEach(v => document.documentElement.style.removeProperty(v.key));
    closeModal(overlay);
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      THEME_VARS.forEach(v => document.documentElement.style.removeProperty(v.key));
      closeModal(overlay);
    }
  });

  saveBtn.addEventListener('click', async () => {
    // Collect values from hex inputs
    const newValues: Record<string, string> = {};
    modal.querySelectorAll<HTMLInputElement>('[data-var-hex]').forEach(input => {
      const varKey = input.getAttribute('data-var-hex')!;
      newValues[varKey] = input.value;
    });

    try {
      const res = await fetch('/api/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newValues),
      });
      if (!res.ok) throw new Error('Failed to save theme');
      setBlockReload();
      closeModal(overlay);
    } catch (err) {
      alert('Failed to save theme: ' + (err as Error).message);
    }
  });

  actions.append(cancelBtn, saveBtn);
  modal.append(actions);
  overlay.append(modal);
  openModal(overlay);
}

// ─── Init ─────────────────────────────────────────────────

// Restore scroll ASAP — before DOMContentLoaded fires animations

function initEditor() {
  // Edit buttons
  document.querySelectorAll<HTMLElement>('.ps-editor-btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.closest<HTMLElement>('.ps-editor-section');
      if (!section) return;
      const file = section.dataset.sectionFile!;
      const sectionType = section.dataset.sectionType!;
      const data = JSON.parse(section.dataset.sectionData!);
      openEditModal(file, sectionType, data);
    });
  });

  // Delete buttons
  document.querySelectorAll<HTMLElement>('.ps-editor-btn-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.closest<HTMLElement>('.ps-editor-section');
      if (!section) return;
      deleteSection(section.dataset.sectionFile!);
    });
  });

  // Add section button
  document.querySelector('.ps-editor-add-btn')?.addEventListener('click', openAddModal);

  // Theme button
  document.querySelector('.ps-editor-theme-btn')?.addEventListener('click', openThemeModal);

  // Drag and drop
  initDragDrop();
}

// Defense-in-depth: bail entirely in production. The editor UI also isn't
// rendered (DevEditor.astro is gated by isDev) so initEditor would no-op,
// but this prevents any side effects from running.
if (IS_DEV) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEditor);
  } else {
    initEditor();
  }
}
