/**
 * Dev-mode API for updating the theme.css file.
 * Writes brand colour variables to src/themes/theme.css.
 *
 * SAFETY: Excluded from production builds via scripts/build-prod.mjs.
 * The runtime guard is defense-in-depth.
 */
import type { APIRoute } from 'astro';
import { writeFile } from 'node:fs/promises';

export const prerender = false;

const THEME_FILE = new URL('../../themes/theme.css', import.meta.url).pathname;

const devOnly = (handler: APIRoute): APIRoute => (ctx) => {
  if (import.meta.env.PROD) return new Response('Not found', { status: 404 });
  return handler(ctx);
};

export const PUT: APIRoute = devOnly(async ({ request }) => {
  const vars = await request.json() as Record<string, string>;

  // Build the CSS content
  const lines = Object.entries(vars).map(([key, value]) => `  ${key}: ${value};`);
  const css = `/* Client brand theme — updated via editor */

:root {
${lines.join('\n')}
}
`;

  await writeFile(THEME_FILE, css);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
