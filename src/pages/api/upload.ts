/**
 * Dev-mode file upload API.
 * Accepts a multipart POST with a single `file` field and saves it to public/assets/.
 * Returns { path: '/assets/filename.ext' } on success.
 *
 * SAFETY: Excluded from production builds by scripts/build-prod.mjs.
 */
import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, basename } from 'node:path';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (import.meta.env.PROD) return new Response('Not found', { status: 404 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file || typeof file === 'string') {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
  }

  const assetsDir = new URL('../../../public/assets/', import.meta.url).pathname;
  await mkdir(assetsDir, { recursive: true });

  const safeName = basename(file.name).replace(/[^a-zA-Z0-9._-]/g, '_');
  const dest = join(assetsDir, safeName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(dest, buffer);

  return new Response(JSON.stringify({ path: `/assets/${safeName}` }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
