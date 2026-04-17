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

function nextPrefix(files: string[]): string {
  const nums = files.map(f => parseInt(f.split('-')[0], 10)).filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return String(next).padStart(2, '0');
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** GET — list all sections */
export const GET: APIRoute = devOnly(async () => {
  const sections = await listSections();
  return new Response(JSON.stringify(sections), {
    headers: { 'Content-Type': 'application/json' },
  });
});

/** POST — create a new section */
export const POST: APIRoute = devOnly(async ({ request }) => {
  const body = await request.json();
  const { type, ...content } = body;
  const files = (await readdir(SECTIONS_DIR)).filter(f => f.endsWith('.json')).sort();
  const prefix = nextPrefix(files);
  const filename = `${prefix}-${slugify(type)}.json`;
  await writeFile(join(SECTIONS_DIR, filename), JSON.stringify(body, null, 2) + '\n');
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

/** PATCH — reorder sections by renaming file prefixes */
export const PATCH: APIRoute = devOnly(async ({ request }) => {
  const { order } = await request.json() as { order: string[] };
  if (!Array.isArray(order)) {
    return new Response('order must be an array of filenames', { status: 400 });
  }

  // Rename to temp names first to avoid collisions
  const tempNames: [string, string][] = [];
  for (let i = 0; i < order.length; i++) {
    const oldName = order[i];
    const tempName = `__tmp_${i}_${oldName}`;
    await rename(join(SECTIONS_DIR, oldName), join(SECTIONS_DIR, tempName));
    tempNames.push([tempName, oldName]);
  }

  // Now rename to final names with correct prefixes
  for (let i = 0; i < tempNames.length; i++) {
    const [tempName, oldName] = tempNames[i];
    const prefix = String(i + 1).padStart(2, '0');
    const suffix = oldName.replace(/^\d+-/, '');
    const newName = `${prefix}-${suffix}`;
    await rename(join(SECTIONS_DIR, tempName), join(SECTIONS_DIR, newName));
  }

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
