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
  type: 'text' | 'textarea' | 'number' | 'select' | 'color' | 'asset';
  options?: string[];
  accept?: string;
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
      { key: 'logo', label: 'Logo', type: 'asset', accept: 'image/*' },
      { key: 'logoAlt', label: 'Logo alt text', type: 'text' },
      { key: 'downloadFile', label: 'Download file (optional)', type: 'asset', accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip' },
      { key: 'downloadLabel', label: 'Download button label', type: 'text' },
      { key: 'title', label: 'Project title', type: 'text' },
    ],
    groups: [],
  },
  'hero-simple': {
    fields: [
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
      { key: 'eyebrow', label: 'Eyebrow', type: 'text' },
      { key: 'headline', label: 'Headline (use **text** for accent, \\n for line break)', type: 'textarea' },
      { key: 'lede', label: 'Lede', type: 'textarea' },
    ],
    groups: [],
  },
  hero: {
    fields: [
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
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
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
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
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
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
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
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
          { key: 'image', label: 'Image', type: 'asset', accept: 'image/*' },
          { key: 'imageAlt', label: 'Image alt text', type: 'text' },
        ],
      },
    ],
  },
  'quote-block': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'sectionNumber', label: 'Badge number (e.g. 01 — shows beside heading)', type: 'text' },
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
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
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
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
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
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
          { key: 'image', label: 'Image', type: 'asset', accept: 'image/*' },
          { key: 'imageAlt', label: 'Image alt text', type: 'text' },
        ],
      },
    ],
  },
  'skyline': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'backdrop', label: 'Backdrop animation', type: 'select', options: ['city', 'waves', 'train'] },
      { key: 'sectionNumber', label: 'Badge number (e.g. 01 — shows beside heading)', type: 'text' },
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
    ],
    groups: [
      {
        key: 'cards',
        label: 'Cards (2 recommended)',
        fields: [
          { key: 'title', label: 'Card title', type: 'text' },
          { key: 'description', label: 'Description (HTML allowed)', type: 'textarea' },
        ],
      },
    ],
  },
  'download': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'description', label: 'Description (HTML allowed)', type: 'textarea' },
      { key: 'image', label: 'Image (optional)', type: 'asset', accept: 'image/*' },
      { key: 'imageAlt', label: 'Image alt text', type: 'text' },
      { key: 'file', label: 'File to download', type: 'asset', accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip' },
      { key: 'fileNote', label: 'File note (optional — e.g. PDF · 2.4 MB)', type: 'text' },
      { key: 'buttonLabel', label: 'Button label', type: 'text' },
    ],
    groups: [],
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
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
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
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
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
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
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
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
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
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
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
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
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
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
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
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
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
          { key: 'image', label: 'Image', type: 'asset', accept: 'image/*' },
          { key: 'imageAlt', label: 'Image alt text', type: 'text' },
        ],
      },
    ],
  },
  'carousel': {
    fields: [
      { key: 'variant', label: 'Background (auto, light, dark)', type: 'select', options: ['auto', 'light', 'dark'] },
      { key: 'sectionNumber', label: 'Badge number (e.g. 01 — shows beside heading)', type: 'text' },
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
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
      { key: 'menuLabel', label: 'Menu label (optional — appears in floating nav)', type: 'text' },
      { key: 'eyebrow', label: 'Eyebrow (small text above heading)', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'description', label: 'Description (HTML allowed)', type: 'textarea' },
      { key: 'image', label: 'Image', type: 'asset', accept: 'image/*' },
      { key: 'imageAlt', label: 'Image alt text', type: 'text' },
    ],
    groups: [],
  },
};

// ─── Component picker thumbnails ─────────────────────────

const THUMBNAILS: Record<string, string> = {
  'header': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#f0f2f5"/>
    <rect width="200" height="36" fill="#2a3a52"/>
    <rect x="12" y="10" width="16" height="16" rx="3" fill="#7ab8d9"/>
    <rect x="36" y="13" width="44" height="5" rx="2" fill="#fff" opacity=".8"/>
    <rect x="36" y="22" width="30" height="3.5" rx="1.5" fill="#fff" opacity=".4"/>
    <rect x="142" y="13" width="20" height="10" rx="5" fill="#e85c6a" opacity=".9"/>
    <rect x="166" y="13" width="20" height="10" rx="5" fill="#fff" opacity=".15"/>
  </svg>`,

  'hero': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#2a3a52"/>
    <rect x="60" y="10" width="80" height="6" rx="3" fill="#7ab8d9" opacity=".7"/>
    <rect x="30" y="24" width="140" height="9" rx="3" fill="#fff" opacity=".9"/>
    <rect x="45" y="37" width="110" height="7" rx="3" fill="#fff" opacity=".5"/>
    <rect x="20" y="56" width="44" height="18" rx="3" fill="#fff" opacity=".08"/>
    <rect x="78" y="56" width="44" height="18" rx="3" fill="#fff" opacity=".08"/>
    <rect x="136" y="56" width="44" height="18" rx="3" fill="#fff" opacity=".08"/>
    <rect x="60" y="84" width="38" height="14" rx="7" fill="#e85c6a"/>
    <rect x="104" y="84" width="38" height="14" rx="7" fill="#fff" opacity=".15"/>
  </svg>`,

  'hero-simple': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#2a3a52"/>
    <rect x="74" y="18" width="52" height="8" rx="4" fill="#7ab8d9" opacity=".7"/>
    <rect x="28" y="34" width="144" height="10" rx="3" fill="#fff" opacity=".9"/>
    <rect x="44" y="50" width="112" height="8" rx="3" fill="#fff" opacity=".55"/>
    <rect x="60" y="64" width="80" height="7" rx="3" fill="#fff" opacity=".35"/>
    <rect x="76" y="82" width="48" height="14" rx="7" fill="#e85c6a"/>
  </svg>`,

  'voice-grid': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#2a3a52"/>
    <rect x="12" y="10" width="54" height="6" rx="2" fill="#fff" opacity=".7"/>
    <rect x="12" y="20" width="38" height="4" rx="2" fill="#fff" opacity=".3"/>
    <rect x="10" y="34" width="54" height="66" rx="6" fill="#fff" opacity=".07"/>
    <circle cx="37" cy="57" r="14" fill="none" stroke="#e85c6a" stroke-width="4"/>
    <rect x="26" y="76" width="22" height="4" rx="2" fill="#fff" opacity=".5"/>
    <rect x="78" y="34" width="54" height="66" rx="6" fill="#fff" opacity=".07"/>
    <circle cx="105" cy="57" r="14" fill="none" stroke="#7ab8d9" stroke-width="4"/>
    <rect x="94" y="76" width="22" height="4" rx="2" fill="#fff" opacity=".5"/>
    <rect x="136" y="34" width="54" height="66" rx="6" fill="#fff" opacity=".07"/>
    <circle cx="163" cy="57" r="14" fill="none" stroke="#a8d8a8" stroke-width="4"/>
    <rect x="152" y="76" width="22" height="4" rx="2" fill="#fff" opacity=".5"/>
  </svg>`,

  'key-insights': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#f0f2f5"/>
    <rect x="12" y="10" width="60" height="8" rx="3" fill="#2a3a52" opacity=".8"/>
    <rect x="12" y="22" width="100" height="4" rx="2" fill="#8898aa" opacity=".6"/>
    <rect x="10" y="36" width="84" height="62" rx="6" fill="#fff" stroke="#dde1e8" stroke-width="1"/>
    <rect x="18" y="44" width="14" height="14" rx="3" fill="#e85c6a" opacity=".15"/>
    <rect x="22" y="47" width="6" height="8" rx="1" fill="#e85c6a"/>
    <rect x="18" y="64" width="50" height="4" rx="2" fill="#2a3a52" opacity=".7"/>
    <rect x="18" y="72" width="64" height="3" rx="1.5" fill="#8898aa" opacity=".5"/>
    <rect x="18" y="78" width="54" height="3" rx="1.5" fill="#8898aa" opacity=".4"/>
    <rect x="106" y="36" width="84" height="62" rx="6" fill="#fff" stroke="#dde1e8" stroke-width="1"/>
    <rect x="114" y="44" width="14" height="14" rx="3" fill="#7ab8d9" opacity=".2"/>
    <rect x="118" y="47" width="6" height="8" rx="1" fill="#7ab8d9"/>
    <rect x="114" y="64" width="50" height="4" rx="2" fill="#2a3a52" opacity=".7"/>
    <rect x="114" y="72" width="64" height="3" rx="1.5" fill="#8898aa" opacity=".5"/>
    <rect x="114" y="78" width="54" height="3" rx="1.5" fill="#8898aa" opacity=".4"/>
  </svg>`,

  'text-block': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#f0f2f5"/>
    <rect x="12" y="12" width="70" height="8" rx="3" fill="#2a3a52" opacity=".8"/>
    <rect x="12" y="25" width="176" height="4" rx="2" fill="#8898aa" opacity=".5"/>
    <rect x="12" y="33" width="150" height="3.5" rx="1.5" fill="#8898aa" opacity=".35"/>
    <rect width="200" height="1" y="48" fill="#dde1e8"/>
    <rect x="12" y="58" width="82" height="3.5" rx="1.5" fill="#8898aa" opacity=".5"/>
    <rect x="12" y="66" width="82" height="3.5" rx="1.5" fill="#8898aa" opacity=".4"/>
    <rect x="12" y="74" width="70" height="3.5" rx="1.5" fill="#8898aa" opacity=".35"/>
    <rect x="12" y="82" width="82" height="3.5" rx="1.5" fill="#8898aa" opacity=".3"/>
    <rect x="106" y="58" width="82" height="3.5" rx="1.5" fill="#8898aa" opacity=".5"/>
    <rect x="106" y="66" width="82" height="3.5" rx="1.5" fill="#8898aa" opacity=".4"/>
    <rect x="106" y="74" width="65" height="3.5" rx="1.5" fill="#8898aa" opacity=".35"/>
    <rect x="106" y="82" width="75" height="3.5" rx="1.5" fill="#8898aa" opacity=".3"/>
  </svg>`,

  'numbered-list': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#f0f2f5"/>
    <rect x="12" y="10" width="70" height="8" rx="3" fill="#2a3a52" opacity=".8"/>
    <rect x="12" y="35" width="22" height="22" rx="4" fill="#e85c6a" opacity=".12"/>
    <rect x="17" y="39" width="12" height="14" rx="2" fill="#e85c6a" opacity=".8"/>
    <rect x="42" y="40" width="70" height="5" rx="2" fill="#2a3a52" opacity=".7"/>
    <rect x="42" y="49" width="100" height="3.5" rx="1.5" fill="#8898aa" opacity=".5"/>
    <rect x="12" y="65" width="22" height="22" rx="4" fill="#7ab8d9" opacity=".15"/>
    <rect x="17" y="69" width="12" height="14" rx="2" fill="#7ab8d9" opacity=".8"/>
    <rect x="42" y="70" width="60" height="5" rx="2" fill="#2a3a52" opacity=".7"/>
    <rect x="42" y="79" width="110" height="3.5" rx="1.5" fill="#8898aa" opacity=".5"/>
  </svg>`,

  'faq': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#f0f2f5"/>
    <rect x="12" y="10" width="70" height="8" rx="3" fill="#2a3a52" opacity=".8"/>
    <rect x="12" y="28" width="176" height="1" fill="#dde1e8"/>
    <rect x="12" y="36" width="130" height="5" rx="2" fill="#2a3a52" opacity=".65"/>
    <rect x="180" y="34" width="8" height="2" rx="1" fill="#8898aa"/>
    <rect x="183" y="31" width="2" height="8" rx="1" fill="#8898aa"/>
    <rect x="12" y="49" width="176" height="1" fill="#dde1e8"/>
    <rect x="12" y="57" width="110" height="5" rx="2" fill="#2a3a52" opacity=".65"/>
    <rect x="180" y="55" width="8" height="2" rx="1" fill="#8898aa"/>
    <rect x="183" y="52" width="2" height="8" rx="1" fill="#8898aa"/>
    <rect x="12" y="70" width="176" height="1" fill="#dde1e8"/>
    <rect x="12" y="78" width="140" height="5" rx="2" fill="#2a3a52" opacity=".65"/>
    <rect x="180" y="76" width="8" height="2" rx="1" fill="#8898aa"/>
    <rect x="183" y="73" width="2" height="8" rx="1" fill="#8898aa"/>
    <rect x="12" y="91" width="176" height="1" fill="#dde1e8"/>
  </svg>`,

  'pie-chart': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#f0f2f5"/>
    <rect x="12" y="12" width="60" height="8" rx="3" fill="#2a3a52" opacity=".8"/>
    <rect x="12" y="26" width="80" height="4" rx="2" fill="#8898aa" opacity=".5"/>
    <rect x="12" y="34" width="80" height="3.5" rx="1.5" fill="#8898aa" opacity=".4"/>
    <rect x="12" y="42" width="64" height="3.5" rx="1.5" fill="#8898aa" opacity=".35"/>
    <rect x="14" y="60" width="10" height="10" rx="2" fill="#e85c6a"/>
    <rect x="28" y="63" width="44" height="3.5" rx="1.5" fill="#8898aa" opacity=".5"/>
    <rect x="14" y="76" width="10" height="10" rx="2" fill="#7ab8d9"/>
    <rect x="28" y="79" width="36" height="3.5" rx="1.5" fill="#8898aa" opacity=".5"/>
    <circle cx="148" cy="58" r="32" fill="none" stroke="#dde1e8" stroke-width="2"/>
    <path d="M148 58 L148 26 A32 32 0 0 1 175 74 Z" fill="#e85c6a" opacity=".85"/>
    <path d="M148 58 L175 74 A32 32 0 0 1 121 74 Z" fill="#7ab8d9" opacity=".85"/>
    <path d="M148 58 L121 74 A32 32 0 0 1 148 26 Z" fill="#a8d8a8" opacity=".85"/>
    <circle cx="148" cy="58" r="16" fill="#f0f2f5"/>
  </svg>`,

  'bar-chart': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#f0f2f5"/>
    <rect x="12" y="12" width="60" height="8" rx="3" fill="#2a3a52" opacity=".8"/>
    <rect x="12" y="26" width="72" height="4" rx="2" fill="#8898aa" opacity=".5"/>
    <rect x="12" y="34" width="60" height="3.5" rx="1.5" fill="#8898aa" opacity=".4"/>
    <rect x="100" y="20" width="88" height="1" fill="#dde1e8"/>
    <rect x="100" y="35" width="76" height="8" rx="2" fill="#e85c6a" opacity=".8"/>
    <rect x="100" y="49" width="55" height="8" rx="2" fill="#7ab8d9" opacity=".8"/>
    <rect x="100" y="63" width="84" height="8" rx="2" fill="#a8d8a8" opacity=".8"/>
    <rect x="100" y="77" width="42" height="8" rx="2" fill="#f4a460" opacity=".8"/>
    <rect x="100" y="91" width="68" height="8" rx="2" fill="#c0aae0" opacity=".8"/>
  </svg>`,

  'data-table': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#f0f2f5"/>
    <rect x="12" y="10" width="60" height="8" rx="3" fill="#2a3a52" opacity=".8"/>
    <rect x="10" y="28" width="180" height="16" rx="3" fill="#2a3a52" opacity=".75"/>
    <rect x="18" y="33" width="30" height="4" rx="2" fill="#fff" opacity=".6"/>
    <rect x="80" y="33" width="30" height="4" rx="2" fill="#fff" opacity=".6"/>
    <rect x="152" y="33" width="30" height="4" rx="2" fill="#fff" opacity=".6"/>
    <rect x="10" y="46" width="180" height="14" rx="0" fill="#fff"/>
    <rect x="18" y="50" width="28" height="3.5" rx="1.5" fill="#8898aa" opacity=".5"/>
    <rect x="80" y="50" width="24" height="3.5" rx="1.5" fill="#8898aa" opacity=".5"/>
    <rect x="152" y="50" width="28" height="3.5" rx="1.5" fill="#8898aa" opacity=".5"/>
    <rect x="10" y="61" width="180" height="14" rx="0" fill="#f0f2f5"/>
    <rect x="18" y="65" width="32" height="3.5" rx="1.5" fill="#8898aa" opacity=".5"/>
    <rect x="80" y="65" width="20" height="3.5" rx="1.5" fill="#8898aa" opacity=".5"/>
    <rect x="152" y="65" width="24" height="3.5" rx="1.5" fill="#8898aa" opacity=".5"/>
    <rect x="10" y="76" width="180" height="14" rx="0" fill="#fff"/>
    <rect x="18" y="80" width="26" height="3.5" rx="1.5" fill="#8898aa" opacity=".5"/>
    <rect x="80" y="80" width="28" height="3.5" rx="1.5" fill="#8898aa" opacity=".5"/>
    <rect x="152" y="80" width="20" height="3.5" rx="1.5" fill="#8898aa" opacity=".5"/>
    <rect x="10" y="44" width="180" height="48" rx="3" fill="none" stroke="#dde1e8" stroke-width="1"/>
    <line x1="68" y1="44" x2="68" y2="92" stroke="#dde1e8" stroke-width="1"/>
    <line x1="136" y1="44" x2="136" y2="92" stroke="#dde1e8" stroke-width="1"/>
  </svg>`,

  'feature-image': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#f0f2f5"/>
    <rect x="12" y="16" width="10" height="6" rx="3" fill="#e85c6a" opacity=".7"/>
    <rect x="12" y="28" width="82" height="8" rx="3" fill="#2a3a52" opacity=".8"/>
    <rect x="12" y="41" width="82" height="4" rx="2" fill="#8898aa" opacity=".5"/>
    <rect x="12" y="49" width="70" height="4" rx="2" fill="#8898aa" opacity=".4"/>
    <rect x="12" y="57" width="76" height="4" rx="2" fill="#8898aa" opacity=".35"/>
    <rect x="12" y="70" width="48" height="14" rx="7" fill="#e85c6a"/>
    <rect x="108" y="12" width="80" height="86" rx="8" fill="#dde1e8"/>
    <rect x="122" y="32" width="52" height="36" rx="4" fill="#c0c8d4"/>
    <line x1="122" y1="32" x2="174" y2="68" stroke="#b0b8c4" stroke-width="1.5"/>
    <line x1="174" y1="32" x2="122" y2="68" stroke="#b0b8c4" stroke-width="1.5"/>
    <circle cx="148" cy="50" r="8" fill="#b0b8c4" opacity=".5"/>
  </svg>`,

  'carousel': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#f0f2f5"/>
    <rect x="12" y="10" width="60" height="8" rx="3" fill="#2a3a52" opacity=".8"/>
    <rect x="34" y="28" width="132" height="66" rx="8" fill="#fff" stroke="#dde1e8" stroke-width="1.5"/>
    <rect x="46" y="38" width="108" height="6" rx="3" fill="#2a3a52" opacity=".7"/>
    <rect x="46" y="49" width="108" height="4" rx="2" fill="#8898aa" opacity=".5"/>
    <rect x="46" y="57" width="88" height="4" rx="2" fill="#8898aa" opacity=".4"/>
    <rect x="46" y="65" width="98" height="4" rx="2" fill="#8898aa" opacity=".35"/>
    <circle cx="18" cy="61" r="10" fill="#dde1e8"/>
    <path d="M20 57 L16 61 L20 65" stroke="#8898aa" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <circle cx="182" cy="61" r="10" fill="#dde1e8"/>
    <path d="M180 57 L184 61 L180 65" stroke="#8898aa" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <circle cx="88" cy="100" r="3" fill="#e85c6a"/>
    <circle cx="100" cy="100" r="3" fill="#dde1e8"/>
    <circle cx="112" cy="100" r="3" fill="#dde1e8"/>
  </svg>`,

  'image-carousel': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#f0f2f5"/>
    <rect x="12" y="10" width="70" height="8" rx="3" fill="#2a3a52" opacity=".8"/>
    <rect x="30" y="26" width="140" height="72" rx="8" fill="#fff" stroke="#dde1e8" stroke-width="1.5"/>
    <rect x="30" y="26" width="140" height="40" rx="8" fill="#c0c8d4"/>
    <rect x="30" y="54" width="140" height="12" rx="0" fill="#c0c8d4"/>
    <circle cx="100" cy="46" r="12" fill="#b0b8c4" opacity=".6"/>
    <rect x="42" y="74" width="80" height="5" rx="2" fill="#2a3a52" opacity=".7"/>
    <rect x="42" y="83" width="60" height="4" rx="2" fill="#8898aa" opacity=".5"/>
    <circle cx="16" cy="62" r="10" fill="#dde1e8"/>
    <path d="M18 58 L14 62 L18 66" stroke="#8898aa" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <circle cx="184" cy="62" r="10" fill="#dde1e8"/>
    <path d="M182 58 L186 62 L182 66" stroke="#8898aa" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  </svg>`,

  'quote-carousel': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#f0f2f5"/>
    <rect x="12" y="10" width="70" height="8" rx="3" fill="#2a3a52" opacity=".8"/>
    <rect x="26" y="26" width="148" height="72" rx="8" fill="#2a3a52" opacity=".07" stroke="#dde1e8" stroke-width="1.5"/>
    <text x="38" y="54" font-size="36" fill="#e85c6a" opacity=".25" font-family="Georgia,serif">"</text>
    <rect x="38" y="54" width="124" height="4" rx="2" fill="#2a3a52" opacity=".55"/>
    <rect x="38" y="62" width="110" height="4" rx="2" fill="#2a3a52" opacity=".45"/>
    <rect x="38" y="70" width="90" height="4" rx="2" fill="#2a3a52" opacity=".35"/>
    <circle cx="38" cy="86" r="6" fill="#c0c8d4"/>
    <rect x="50" y="82" width="44" height="4" rx="2" fill="#8898aa" opacity=".6"/>
    <rect x="50" y="89" width="32" height="3" rx="1.5" fill="#8898aa" opacity=".4"/>
    <circle cx="88" cy="104" r="3" fill="#e85c6a"/>
    <circle cx="100" cy="104" r="3" fill="#dde1e8"/>
    <circle cx="112" cy="104" r="3" fill="#dde1e8"/>
  </svg>`,

  'flip-cards': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#f0f2f5"/>
    <rect x="12" y="10" width="60" height="8" rx="3" fill="#2a3a52" opacity=".8"/>
    <rect x="12" y="30" width="52" height="70" rx="6" fill="#c0c8d4" opacity=".6"/>
    <rect x="12" y="30" width="52" height="36" rx="6" fill="#a0b0c0" opacity=".7"/>
    <circle cx="38" cy="48" r="8" fill="#b0b8c4" opacity=".5"/>
    <rect x="18" y="72" width="24" height="4" rx="2" fill="#fff" opacity=".7"/>
    <rect x="18" y="80" width="36" height="3" rx="1.5" fill="#fff" opacity=".4"/>
    <rect x="74" y="24" width="52" height="70" rx="6" fill="#fff" stroke="#dde1e8" stroke-width="1.5"/>
    <rect x="74" y="24" width="52" height="36" rx="6" fill="#c0c8d4"/>
    <circle cx="100" cy="42" r="8" fill="#b0b8c4" opacity=".5"/>
    <rect x="80" y="66" width="28" height="4" rx="2" fill="#2a3a52" opacity=".7"/>
    <rect x="80" y="74" width="40" height="3" rx="1.5" fill="#8898aa" opacity=".5"/>
    <rect x="136" y="30" width="52" height="70" rx="6" fill="#c0c8d4" opacity=".6"/>
    <rect x="136" y="30" width="52" height="36" rx="6" fill="#a0b0c0" opacity=".7"/>
    <circle cx="162" cy="48" r="8" fill="#b0b8c4" opacity=".5"/>
    <rect x="142" y="72" width="24" height="4" rx="2" fill="#fff" opacity=".7"/>
    <rect x="142" y="80" width="36" height="3" rx="1.5" fill="#fff" opacity=".4"/>
  </svg>`,

  'quote-block': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#f0f2f5"/>
    <path d="M20 30 Q24 15 40 18 Q30 28 32 38 Z" fill="#e85c6a" opacity=".15"/>
    <path d="M50 30 Q54 15 70 18 Q60 28 62 38 Z" fill="#e85c6a" opacity=".15"/>
    <path d="M180 80 Q176 95 160 92 Q170 82 168 72 Z" fill="#e85c6a" opacity=".15"/>
    <rect x="30" y="38" width="140" height="6" rx="3" fill="#2a3a52" opacity=".7"/>
    <rect x="40" y="50" width="120" height="5" rx="2" fill="#2a3a52" opacity=".55"/>
    <rect x="50" y="61" width="100" height="5" rx="2" fill="#2a3a52" opacity=".4"/>
    <rect x="70" y="76" width="60" height="4" rx="2" fill="#8898aa" opacity=".5"/>
    <rect x="80" y="84" width="40" height="3" rx="1.5" fill="#8898aa" opacity=".35"/>
  </svg>`,

  'customer-journey': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#f0f2f5"/>
    <rect x="12" y="10" width="70" height="8" rx="3" fill="#2a3a52" opacity=".8"/>
    <rect x="12" y="88" width="32" height="12" rx="4" fill="#e85c6a" opacity=".2"/>
    <rect x="15" y="91" width="26" height="3" rx="1.5" fill="#e85c6a" opacity=".8"/>
    <rect x="50" y="76" width="32" height="24" rx="4" fill="#e85c6a" opacity=".2"/>
    <rect x="53" y="79" width="26" height="3" rx="1.5" fill="#e85c6a" opacity=".7"/>
    <rect x="88" y="62" width="32" height="38" rx="4" fill="#e85c6a" opacity=".2"/>
    <rect x="91" y="65" width="26" height="3" rx="1.5" fill="#e85c6a" opacity=".7"/>
    <rect x="126" y="48" width="32" height="52" rx="4" fill="#e85c6a" opacity=".2"/>
    <rect x="129" y="51" width="26" height="3" rx="1.5" fill="#e85c6a" opacity=".7"/>
    <rect x="164" y="34" width="24" height="66" rx="4" fill="#e85c6a" opacity=".2"/>
    <rect x="167" y="37" width="18" height="3" rx="1.5" fill="#e85c6a" opacity=".7"/>
    <polyline points="28,88 66,76 104,62 142,48 176,34" fill="none" stroke="#e85c6a" stroke-width="1.5" stroke-dasharray="3,3" opacity=".5"/>
  </svg>`,

  'customer-type': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#f0f2f5"/>
    <rect x="12" y="10" width="60" height="7" rx="3" fill="#2a3a52" opacity=".8"/>
    <rect x="8" y="28" width="42" height="72" rx="6" fill="#c0c8d4" opacity=".7"/>
    <rect x="8" y="28" width="42" height="42" rx="6" fill="#a0b0c0"/>
    <circle cx="29" cy="49" r="9" fill="#b0b8c4" opacity=".5"/>
    <rect x="13" y="76" width="18" height="3.5" rx="1.5" fill="#fff" opacity=".7"/>
    <rect x="58" y="28" width="42" height="72" rx="6" fill="#c0c8d4" opacity=".7"/>
    <rect x="58" y="28" width="42" height="42" rx="6" fill="#7ab8d9" opacity=".7"/>
    <circle cx="79" cy="49" r="9" fill="#6aa8c9" opacity=".5"/>
    <rect x="63" y="76" width="18" height="3.5" rx="1.5" fill="#fff" opacity=".7"/>
    <rect x="108" y="28" width="42" height="72" rx="6" fill="#c0c8d4" opacity=".7"/>
    <rect x="108" y="28" width="42" height="42" rx="6" fill="#a8d8a8" opacity=".7"/>
    <circle cx="129" cy="49" r="9" fill="#98c898" opacity=".5"/>
    <rect x="113" y="76" width="18" height="3.5" rx="1.5" fill="#fff" opacity=".7"/>
    <rect x="158" y="28" width="42" height="72" rx="6" fill="#c0c8d4" opacity=".7"/>
    <rect x="158" y="28" width="42" height="42" rx="6" fill="#f4a460" opacity=".7"/>
    <circle cx="179" cy="49" r="9" fill="#e49450" opacity=".5"/>
    <rect x="163" y="76" width="18" height="3.5" rx="1.5" fill="#fff" opacity=".7"/>
  </svg>`,

  'skyline': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#2a3a52"/>
    <polyline points="0,70 10,70 10,45 22,45 22,70 30,70 30,30 36,22 42,30 42,70 52,70 52,52 62,52 62,70 72,70 72,40 80,40 80,70 90,70 90,55 98,55 98,70 110,70 110,35 118,25 126,35 126,70 136,70 136,48 146,48 146,70 158,70 158,38 166,38 166,70 178,70 178,50 188,50 188,70 200,70" fill="none" stroke="#fff" stroke-width="1.2" opacity=".18"/>
    <rect x="10" y="74" width="82" height="28" rx="5" fill="#fff" opacity=".07"/>
    <rect x="108" y="74" width="82" height="28" rx="5" fill="#fff" opacity=".07"/>
    <rect x="18" y="80" width="40" height="4" rx="2" fill="#fff" opacity=".5"/>
    <rect x="18" y="88" width="60" height="3" rx="1.5" fill="#fff" opacity=".3"/>
    <rect x="116" y="80" width="40" height="4" rx="2" fill="#fff" opacity=".5"/>
    <rect x="116" y="88" width="60" height="3" rx="1.5" fill="#fff" opacity=".3"/>
  </svg>`,

  'download': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#f0f2f5"/>
    <rect x="12" y="14" width="60" height="82" rx="6" fill="#dde1e8"/>
    <rect x="20" y="28" width="44" height="32" rx="3" fill="#c0c8d4"/>
    <rect x="24" y="34" width="10" height="14" rx="2" fill="#8898aa" opacity=".7"/>
    <rect x="36" y="34" width="24" height="3" rx="1.5" fill="#8898aa" opacity=".5"/>
    <rect x="36" y="41" width="18" height="3" rx="1.5" fill="#8898aa" opacity=".4"/>
    <rect x="86" y="18" width="70" height="8" rx="3" fill="#2a3a52" opacity=".8"/>
    <rect x="86" y="32" width="100" height="4" rx="2" fill="#8898aa" opacity=".5"/>
    <rect x="86" y="40" width="84" height="4" rx="2" fill="#8898aa" opacity=".4"/>
    <rect x="86" y="72" width="70" height="18" rx="9" fill="#2a3a52"/>
    <rect x="98" y="77" width="12" height="8" rx="1" fill="none" stroke="#fff" stroke-width="1.5"/>
    <path d="M104 81 L104 87 M101 84 L104 87 L107 84" stroke="#fff" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <rect x="116" y="79" width="28" height="4" rx="2" fill="#fff" opacity=".7"/>
  </svg>`,

  'footer': `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="110" fill="#f0f2f5"/>
    <rect x="20" y="18" width="160" height="1" fill="#dde1e8"/>
    <rect x="20" y="30" width="100" height="6" rx="2" fill="#c0c8d4" opacity=".5"/>
    <rect x="20" y="42" width="80" height="4" rx="2" fill="#c0c8d4" opacity=".4"/>
    <rect width="200" height="40" y="70" fill="#2a3a52"/>
    <rect x="60" y="78" width="80" height="5" rx="2" fill="#fff" opacity=".5"/>
    <rect x="74" y="88" width="52" height="4" rx="2" fill="#fff" opacity=".3"/>
  </svg>`,
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
  { type: 'skyline', label: 'Skyline', description: 'Two cards over an animated city-line-drawing backdrop' },
  { type: 'download', label: 'Download', description: 'Heading + description with a file download button' },
  { type: 'footer', label: 'Footer', description: 'Brand-coloured page footer with editable text' },
];

const DEFAULTS: Record<string, any> = {
  header: {
    type: 'header',
    logo: '/assets/logo.svg',
    logoAlt: 'Client logo',
    downloadFile: '',
    downloadLabel: 'Download the report',
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
  'skyline': {
    type: 'skyline',
    variant: 'dark',
    backdrop: 'city',
    heading: 'Two principles, one city',
    subtitle: 'How we show up across every engagement.',
    cards: [
      { title: 'First principle', description: '<p>A short paragraph explaining the principle and why it matters to the work.</p>' },
      { title: 'Second principle', description: '<p>The second principle that guides how we operate and make decisions.</p>' },
    ],
  },
  'download': {
    type: 'download',
    variant: 'auto',
    heading: 'Download the report',
    description: '<p>Get the full findings as a PDF.</p>',
    image: '',
    imageAlt: '',
    file: '/report.pdf',
    fileNote: 'PDF',
    buttonLabel: 'Download PDF',
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

// ─── Asset picker ─────────────────────────────────────────

function buildAssetPicker(
  container: HTMLElement,
  f: FormField,
  currentValue: string,
  dataAttrs: Record<string, string>
) {
  const isImage = (p: string) => /\.(png|jpe?g|gif|svg|webp|avif)$/i.test(p);

  const wrapper = el('div', { class: 'ps-editor-asset-picker' });

  const preview = el('div', { class: 'ps-editor-asset-preview' });
  const updatePreview = (path: string) => {
    preview.innerHTML = '';
    if (path && isImage(path)) {
      const img = el('img', { src: path, alt: '' }) as HTMLImageElement;
      preview.append(img);
    } else if (path) {
      preview.textContent = path.split('/').pop() || path;
    } else {
      preview.textContent = 'No file chosen';
    }
  };
  updatePreview(currentValue);

  const hidden = el('input', { ...dataAttrs, type: 'hidden', value: currentValue }) as HTMLInputElement;

  const fileInput = el('input', {
    type: 'file',
    accept: f.accept || 'image/*,application/pdf',
    style: 'display:none',
  }) as HTMLInputElement;

  const browseBtn = el('button', { type: 'button', class: 'ps-editor-asset-btn' }, 'Choose file…');

  browseBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    browseBtn.textContent = 'Uploading…';
    browseBtn.setAttribute('disabled', '');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error(await res.text());
      const { path } = await res.json();
      hidden.value = path;
      updatePreview(path);
    } catch (err) {
      alert('Upload failed: ' + err);
    } finally {
      browseBtn.textContent = 'Choose file…';
      browseBtn.removeAttribute('disabled');
    }
  });

  wrapper.append(preview, browseBtn, fileInput, hidden);
  container.append(wrapper);
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

    const dataAttrs = { 'data-field': f.key, 'data-group': groupKey, name };
    if (f.type === 'textarea') {
      const ta = el('textarea', dataAttrs);
      ta.value = data[f.key] ?? '';
      container.append(ta);
    } else if (f.type === 'select' && f.options) {
      const select = el('select', dataAttrs);
      f.options.forEach(opt => {
        const option = el('option', { value: opt }, opt);
        if (data[f.key] === opt) option.selected = true;
        select.append(option);
      });
      container.append(select);
    } else if (f.type === 'color') {
      const input = el('input', { ...dataAttrs, type: 'color', value: data[f.key] || '#e63946' });
      container.append(input);
    } else if (f.type === 'number') {
      const input = el('input', { ...dataAttrs, type: 'number', value: String(data[f.key] ?? '') });
      container.append(input);
    } else if (f.type === 'asset') {
      buildAssetPicker(container, f, data[f.key] ?? '', dataAttrs);
      return;
    } else {
      const input = el('input', { ...dataAttrs, type: 'text', value: data[f.key] ?? '' });
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
    } else if (f.type === 'asset') {
      buildAssetPicker(container, f, data[f.key] ?? '', attrs);
      return;
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
    const thumb = el('div', { class: 'ps-editor-type-thumb' });
    thumb.innerHTML = THUMBNAILS[sectionType] ?? '';
    btn.append(thumb);
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

  // Login settings button
  document.querySelector('.ps-editor-login-btn')?.addEventListener('click', openLoginModal);

  // Drag and drop
  initDragDrop();
}

// ─── Login settings modal ─────────────────────────────────

async function openLoginModal() {
  let config: Record<string, string> = {};
  try {
    const res = await fetch('/api/login');
    if (res.ok) config = await res.json();
  } catch (err) {
    console.error('Failed to load login config:', err);
  }

  const overlay = el('div', { class: 'ps-editor-modal-overlay' });
  const modal = el('div', { class: 'ps-editor-modal' });
  modal.append(el('h2', {}, 'Login settings'));

  const form = el('div', {});
  const loginFields: FormField[] = [
    { key: 'logo', label: 'Logo', type: 'asset', accept: 'image/*' },
    { key: 'logoAlt', label: 'Logo alt text', type: 'text' },
    { key: 'welcomeText', label: 'Welcome text (HTML allowed)', type: 'textarea' },
    { key: 'password', label: 'Password', type: 'text' },
  ];
  buildTopLevelFields(form, loginFields, config);
  modal.append(form);

  const actions = el('div', { class: 'ps-editor-modal-actions' });
  const cancelBtn = el('button', { class: 'ps-editor-modal-cancel', type: 'button' }, 'Cancel');
  const saveBtn = el('button', { class: 'ps-editor-modal-save', type: 'button' }, 'Save');

  cancelBtn.addEventListener('click', () => closeModal(overlay));
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });

  saveBtn.addEventListener('click', async () => {
    const newConfig: Record<string, string> = {};
    loginFields.forEach((f) => {
      const input = modal.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `[data-group="__top"][data-field="${f.key}"]`
      );
      if (input) newConfig[f.key] = input.value;
    });
    try {
      setBlockReload();
      const res = await fetch('/api/login', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (!res.ok) throw new Error(await res.text());
      closeModal(overlay);
      forceReload();
    } catch (err) {
      console.error('Save login failed:', err);
      alert('Failed to save: ' + (err as Error).message);
    }
  });

  actions.append(cancelBtn, saveBtn);
  modal.append(actions);
  overlay.append(modal);
  openModal(overlay);
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
