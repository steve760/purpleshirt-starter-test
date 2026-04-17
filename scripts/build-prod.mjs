/**
 * Production build wrapper.
 *
 * The editor's API routes (src/pages/api/*) mutate files on disk — they exist
 * only to power the in-browser editor during `astro dev`. They MUST NOT ship
 * to production where they'd let anyone modify the live site.
 *
 * This script moves the api/ folder aside, runs `astro build` (which produces
 * a static dist/), then puts api/ back. The try/finally guarantees restoration
 * even if the build errors.
 */
import { execSync } from 'node:child_process';
import { renameSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = join(root, 'src/pages/api');
const apiAside = join(root, 'src/pages/.api-build-aside');

// Clear caches that can carry over `import.meta.env.DEV = true` from a prior
// `astro dev` run, which would cause the editor wrapper to render in prod.
for (const cache of ['.astro', 'dist', 'node_modules/.vite']) {
  const path = join(root, cache);
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
    console.log(`[build-prod] Cleared ${cache}`);
  }
}

let moved = false;
try {
  if (existsSync(apiDir)) {
    renameSync(apiDir, apiAside);
    moved = true;
    console.log('[build-prod] Hid src/pages/api/ from build');
  }
  // Force NODE_ENV=production so Vite/Astro evaluate import.meta.env.DEV = false
  // even when this script is invoked from environments that set NODE_ENV=test
  // (e.g. vitest) or NODE_ENV=development.
  // Build with a minimal env so vitest's NODE_ENV=test / MODE=test / VITE_*
  // vars can't leak into the child and falsely set import.meta.env.DEV=true.
  // Keep only what Node + npm need to find binaries.
  const cleanEnv = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    USER: process.env.USER,
    SHELL: process.env.SHELL,
    NODE_ENV: 'production',
  };

  execSync('astro build', {
    stdio: 'inherit',
    cwd: root,
    env: cleanEnv,
  });
} finally {
  if (moved) {
    renameSync(apiAside, apiDir);
    console.log('[build-prod] Restored src/pages/api/');
  }
}
