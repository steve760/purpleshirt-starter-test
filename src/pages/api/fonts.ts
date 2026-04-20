/**
 * Dev-mode API for reading/writing custom font config.
 *
 * Stores config as JSON in src/themes/fonts.json (source of truth),
 * and regenerates src/themes/fonts.css with @font-face + variable
 * overrides that the page imports.
 *
 * SAFETY: Excluded from production builds via scripts/build-prod.mjs.
 */
import type { APIRoute } from 'astro';
import { readFile, writeFile } from 'node:fs/promises';
import { extname } from 'node:path';

export const prerender = false;

const FONTS_JSON = new URL('../../themes/fonts.json', import.meta.url).pathname;
const FONTS_CSS = new URL('../../themes/fonts.css', import.meta.url).pathname;

const devOnly = (handler: APIRoute): APIRoute => (ctx) => {
  if (import.meta.env.PROD) return new Response('Not found', { status: 404 });
  return handler(ctx);
};

type RoleKey = 'display' | 'body' | 'accent' | 'mono';
const ROLES: RoleKey[] = ['display', 'body', 'accent', 'mono'];

interface FontEntry {
  name: string;
  file: string;
}

type FontConfig = Record<RoleKey, FontEntry>;

const FALLBACKS: Record<RoleKey, string> = {
  display: `-apple-system, BlinkMacSystemFont, sans-serif`,
  body: `-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif`,
  accent: `-apple-system, BlinkMacSystemFont, sans-serif`,
  mono: `ui-monospace, 'SF Mono', Menlo, Consolas, monospace`,
};

function formatFor(path: string): string {
  const ext = extname(path).toLowerCase().replace('.', '');
  switch (ext) {
    case 'woff2': return 'woff2';
    case 'woff': return 'woff';
    case 'ttf': return 'truetype';
    case 'otf': return 'opentype';
    default: return ext || 'woff2';
  }
}

function buildCss(cfg: FontConfig): string {
  const out: string[] = ['/* Custom fonts — generated from fonts.json via the editor. */', ''];
  const seen = new Set<string>();

  for (const role of ROLES) {
    const entry = cfg[role];
    if (!entry?.name || !entry?.file) continue;
    const key = `${entry.name}|${entry.file}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push('@font-face {');
    out.push(`  font-family: '${entry.name}';`);
    out.push(`  src: url('${entry.file}') format('${formatFor(entry.file)}');`);
    out.push('  font-display: swap;');
    out.push('}');
    out.push('');
  }

  const overrides: string[] = [];
  for (const role of ROLES) {
    const name = cfg[role]?.name;
    if (!name) continue;
    overrides.push(`  --font-${role}: '${name}', ${FALLBACKS[role]};`);
  }

  if (overrides.length) {
    out.push(':root {');
    out.push(...overrides);
    out.push('}');
    out.push('');
  }

  return out.join('\n');
}

function normalize(body: any): FontConfig {
  const cfg = {} as FontConfig;
  for (const role of ROLES) {
    cfg[role] = {
      name: String(body?.[role]?.name ?? ''),
      file: String(body?.[role]?.file ?? ''),
    };
  }
  return cfg;
}

export const GET: APIRoute = devOnly(async () => {
  const raw = await readFile(FONTS_JSON, 'utf-8');
  return new Response(raw, { headers: { 'Content-Type': 'application/json' } });
});

export const PUT: APIRoute = devOnly(async ({ request }) => {
  const cfg = normalize(await request.json());
  await writeFile(FONTS_JSON, JSON.stringify(cfg, null, 2) + '\n');
  await writeFile(FONTS_CSS, buildCss(cfg));
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
