import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

describe('Production build', () => {
  it('builds without errors', () => {
    const result = execSync('npm run build', { cwd: ROOT, encoding: 'utf-8', timeout: 60000 });
    expect(result).toContain('Complete!');
  });

  it('produces dist/index.html', () => {
    expect(existsSync(join(ROOT, 'dist/index.html'))).toBe(true);
  });

  it('built HTML contains section classes', () => {
    const html = readFileSync(join(ROOT, 'dist/index.html'), 'utf-8');
    // Should contain at least the hero section
    expect(html).toContain('ps-hero');
  });

  it('built HTML contains no unknown section warnings', () => {
    const html = readFileSync(join(ROOT, 'dist/index.html'), 'utf-8');
    expect(html).not.toContain('Unknown section type');
  });

  it('production build excludes the editor (no API routes, no editor markup)', () => {
    // No api/ folder in dist (build-prod.mjs hides src/pages/api/ before build)
    expect(existsSync(join(ROOT, 'dist/api'))).toBe(false);
    const html = readFileSync(join(ROOT, 'dist/index.html'), 'utf-8');
    // No rendered editor controls/buttons/modals
    expect(html).not.toMatch(/class="[^"]*\bps-editor-(btn|controls|badge|toolbar|modal|add-bar)\b/);
    // No fetch calls to the editor API
    expect(html).not.toContain('/api/sections');
    expect(html).not.toContain('/api/theme');
    // No editor function names in any inlined script
    expect(html).not.toContain('openEditModal');
    expect(html).not.toContain('FORM_DEFS');
  });
});
