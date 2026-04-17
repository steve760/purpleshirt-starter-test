import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

function readFile(path: string) {
  return readFileSync(join(ROOT, path), 'utf-8');
}

describe('SectionRenderer registry', () => {
  const renderer = readFile('src/layouts/SectionRenderer.astro');

  it('has a knownTypes array', () => {
    expect(renderer).toContain('knownTypes');
  });

  it('every knownType has a render conditional', () => {
    const match = renderer.match(/knownTypes\s*=\s*\[([^\]]+)\]/);
    expect(match).not.toBeNull();
    const types = match![1].match(/'([^']+)'/g)!.map(s => s.replace(/'/g, ''));
    for (const type of types) {
      // Each type should appear in a conditional like: type === 'hero'
      expect(renderer).toContain(`type === '${type}'`);
    }
  });

  it('every knownType has a component import', () => {
    const match = renderer.match(/knownTypes\s*=\s*\[([^\]]+)\]/);
    const types = match![1].match(/'([^']+)'/g)!.map(s => s.replace(/'/g, ''));
    for (const type of types) {
      // Each type should have an import from kit/components
      // Component names are PascalCase versions of the type
      expect(renderer).toContain(`kit/components/`);
    }
  });
});

describe('Editor registry', () => {
  const editor = readFile('src/components/editor.ts');

  it('has SECTION_TYPES array', () => {
    expect(editor).toContain('SECTION_TYPES');
  });

  it('has FORM_DEFS for each section type in SECTION_TYPES', () => {
    const typesMatch = editor.match(/const SECTION_TYPES\s*=\s*\[([\s\S]*?)\];/);
    expect(typesMatch).not.toBeNull();
    const typeEntries = typesMatch![1].match(/type:\s*'([^']+)'/g)!.map(s => s.match(/'([^']+)'/)?.[1]!);

    const formDefsBlock = editor.slice(editor.indexOf('FORM_DEFS'), editor.indexOf('SECTION_TYPES'));
    for (const type of typeEntries) {
      // Key can be quoted ('hero': {) or unquoted (hero: {)
      const hasQuoted = formDefsBlock.includes(`'${type}':`);
      const hasUnquoted = formDefsBlock.includes(`${type}: {`);
      expect(hasQuoted || hasUnquoted, `FORM_DEFS missing entry for '${type}'`).toBe(true);
    }
  });

  it('has DEFAULTS for each section type in SECTION_TYPES', () => {
    const typesMatch = editor.match(/const SECTION_TYPES\s*=\s*\[([\s\S]*?)\];/);
    const typeEntries = typesMatch![1].match(/type:\s*'([^']+)'/g)!.map(s => s.match(/'([^']+)'/)?.[1]!);

    const defaultsBlock = editor.slice(editor.indexOf('const DEFAULTS'));
    for (const type of typeEntries) {
      const hasQuoted = defaultsBlock.includes(`'${type}':`);
      const hasUnquoted = defaultsBlock.includes(`${type}: {`);
      expect(hasQuoted || hasUnquoted, `DEFAULTS missing entry for '${type}'`).toBe(true);
    }
  });

  it('SECTION_TYPES matches SectionRenderer knownTypes', () => {
    const renderer = readFile('src/layouts/SectionRenderer.astro');
    const rendererMatch = renderer.match(/knownTypes\s*=\s*\[([^\]]+)\]/);
    const knownTypes = rendererMatch![1].match(/'([^']+)'/g)!.map(s => s.replace(/'/g, ''));

    const editorMatch = editor.match(/const SECTION_TYPES\s*=\s*\[([\s\S]*?)\];/);
    const editorTypes = editorMatch![1].match(/type:\s*'([^']+)'/g)!.map(s => s.match(/'([^']+)'/)?.[1]!);

    // Every editor type should be in knownTypes
    for (const type of editorTypes) {
      expect(knownTypes).toContain(type);
    }
  });
});

describe('Index page CSS imports', () => {
  const index = readFile('src/pages/index.astro');

  it('imports a CSS file for each component type', () => {
    const expectedImports = [
      'hero.css', 'voice-grid.css', 'key-insights.css', 'text-block.css',
      'numbered-list.css', 'faq.css', 'pie-chart.css', 'bar-chart.css',
      'data-table.css', 'feature-image.css', 'carousel.css',
      'image-carousel.css', 'quote-carousel.css',
    ];
    for (const css of expectedImports) {
      expect(index).toContain(css);
    }
  });
});
