import { defineConfig } from 'astro/config';

// Static output — produces pure HTML/CSS/JS in dist/.
// Vercel (or any static host) auto-detects and serves it.
// No server, no API routes in production. The editor only works during
// `astro dev` where the dev server hosts the API endpoints.
export default defineConfig({
  output: 'static',
});
