/**
 * Dev-mode API for reading/writing login config (logo, welcome text, password).
 * Writes to src/content/login.json.
 *
 * SAFETY: Excluded from production builds via scripts/build-prod.mjs.
 */
import type { APIRoute } from 'astro';
import { readFile, writeFile } from 'node:fs/promises';

export const prerender = false;

const LOGIN_FILE = new URL('../../content/login.json', import.meta.url).pathname;

const devOnly = (handler: APIRoute): APIRoute => (ctx) => {
  if (import.meta.env.PROD) return new Response('Not found', { status: 404 });
  return handler(ctx);
};

export const GET: APIRoute = devOnly(async () => {
  const raw = await readFile(LOGIN_FILE, 'utf-8');
  return new Response(raw, { headers: { 'Content-Type': 'application/json' } });
});

export const PUT: APIRoute = devOnly(async ({ request }) => {
  const body = await request.json() as Record<string, string>;
  const clean = {
    logo: String(body.logo ?? ''),
    logoAlt: String(body.logoAlt ?? ''),
    welcomeText: String(body.welcomeText ?? ''),
    password: String(body.password ?? ''),
  };
  await writeFile(LOGIN_FILE, JSON.stringify(clean, null, 2) + '\n');
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
