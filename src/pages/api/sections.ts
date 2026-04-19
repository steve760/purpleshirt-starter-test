/**
 * Dev-mode API for managing section JSON files on disk.
 *
 * SAFETY: This file is excluded from production builds by scripts/build-prod.mjs
 * which moves src/pages/api/ aside before `astro build`. The runtime guard
 * below is defense-in-depth in case the file is somehow served outside dev.
 */
import type { APIRoute } from 'astro';
import { readdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';

export const prerender = false;

const devOnly = (handler: APIRoute): APIRoute => (ctx) => {
  if (import.meta.env.PROD) return new Response('Not found', { status: 404 });
  return handler(ctx);
};

const SECTIONS_DIR = new URL('../../content/sections/', import.meta.url).pathname;

async function listSections() {
  const files = (await readdir(SECTIONS_DIR)).filter(f => f.endsWith('.json')).sort();
  const sections = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(join(SECTIONS_DIR, file), 'utf-8');
      return { file, content: JSON.parse(raw) };
    })
  );
  return sections;
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function stripPrefix(filename: string): string {
  return filename.replace(/^\d+-/, '');
}

function isFooter(filename: string): boolean {
  return /(^|-)footer\.json$/.test(filename);
}

function pinFooterLast(files: string[]): string[] {
  const footer = files.find(isFooter);
  if (!footer) return files.slice();
  return [...files.filter(f => f !== footer), footer];
}

/**
 * Rename a list of files to have sequential 2-digit prefixes in the given order.
 * Uses a two-pass rename (temp names first) to avoid collisions.
 * Each entry is `{ file, suffix }` — `suffix` is the part after the prefix in the final name.
 */
async function renumber(order: { file: string; suffix: string }[]): Promise<string[]> {
  for (let i = 0; i < order.length; i++) {
    await rename(join(SECTIONS_DIR, order[i].file), join(SECTIONS_DIR, `__tmp_${i}.json`));
  }
  const finalNames: string[] = [];
  for (let i = 0; i < order.length; i++) {
    const prefix = String(i + 1).padStart(2, '0');
    const finalName = `${prefix}-${order[i].suffix}`;
    await rename(join(SECTIONS_DIR, `__tmp_${i}.json`), join(SECTIONS_DIR, finalName));
    finalNames.push(finalName);
  }
  return finalNames;
}

/** GET — list all sections */
export const GET: APIRoute = devOnly(async () => {
  const sections = await listSections();
  return new Response(JSON.stringify(sections), {
    headers: { 'Content-Type': 'application/json' },
  });
});

/** POST — create a new section (inserted before the footer, if one exists) */
export const POST: APIRoute = devOnly(async ({ request }) => {
  const body = await request.json();
  const { type } = body;
  const files = (await readdir(SECTIONS_DIR)).filter(f => f.endsWith('.json')).sort();
  const slug = slugify(type);

  // Write the new file under a non-colliding temp name, then renumber everything
  // so the footer (if any) ends up last and prefixes are contiguous.
  const tempName = `__new_${Date.now()}-${slug}.json`;
  await writeFile(join(SECTIONS_DIR, tempName), JSON.stringify(body, null, 2) + '\n');

  const footer = files.find(isFooter);
  const nonFooter = files.filter(f => f !== footer);
  const isNewFooter = type === 'footer';

  const order: { file: string; suffix: string }[] = [
    ...nonFooter.map(f => ({ file: f, suffix: stripPrefix(f) })),
  ];
  if (isNewFooter && footer) {
    // Replacing/adding a second footer — keep the new one as the footer, drop the old one's footer role
    order.push({ file: footer, suffix: stripPrefix(footer) });
    order.push({ file: tempName, suffix: `${slug}.json` });
  } else {
    order.push({ file: tempName, suffix: `${slug}.json` });
    if (footer) order.push({ file: footer, suffix: stripPrefix(footer) });
  }

  const newIdx = order.findIndex(o => o.file === tempName);
  const finalNames = await renumber(order);
  const filename = finalNames[newIdx];

  return new Response(JSON.stringify({ file: filename }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
});

/** PUT — update a section's content */
export const PUT: APIRoute = devOnly(async ({ request }) => {
  const { file, content } = await request.json();
  if (!file || !content) {
    return new Response('Missing file or content', { status: 400 });
  }
  await writeFile(join(SECTIONS_DIR, file), JSON.stringify(content, null, 2) + '\n');
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

/** PATCH — reorder sections by renaming file prefixes. Footer is always pinned last. */
export const PATCH: APIRoute = devOnly(async ({ request }) => {
  const { order } = await request.json() as { order: string[] };
  if (!Array.isArray(order)) {
    return new Response('order must be an array of filenames', { status: 400 });
  }

  const pinned = pinFooterLast(order);
  await renumber(pinned.map(f => ({ file: f, suffix: stripPrefix(f) })));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

/** DELETE — remove a section file */
export const DELETE: APIRoute = devOnly(async ({ request }) => {
  const { file } = await request.json();
  if (!file) {
    return new Response('Missing file', { status: 400 });
  }
  await unlink(join(SECTIONS_DIR, file));
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
