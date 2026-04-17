import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const SECTIONS_DIR = join(process.cwd(), 'src/content/sections');

// Read knownTypes directly from SectionRenderer so this test stays in sync
function loadKnownTypes(): string[] {
  const renderer = readFileSync(join(process.cwd(), 'src/layouts/SectionRenderer.astro'), 'utf-8');
  const match = renderer.match(/knownTypes\s*=\s*\[([^\]]+)\]/);
  if (!match) throw new Error('Could not find knownTypes in SectionRenderer.astro');
  return match[1].match(/'([^']+)'/g)!.map(s => s.replace(/'/g, ''));
}

const KNOWN_TYPES = loadKnownTypes();
const HERO_TYPES = ['hero', 'hero-simple', 'header'];

function getSectionFiles() {
  return readdirSync(SECTIONS_DIR).filter(f => f.endsWith('.json')).sort();
}

function readSection(file: string) {
  return JSON.parse(readFileSync(join(SECTIONS_DIR, file), 'utf-8'));
}

describe('Section JSON files', () => {
  const files = getSectionFiles();

  it('has at least one section file', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s is valid JSON', (file) => {
    expect(() => readSection(file)).not.toThrow();
  });

  it.each(files)('%s has a type field', (file) => {
    const data = readSection(file);
    expect(data).toHaveProperty('type');
    expect(typeof data.type).toBe('string');
  });

  it.each(files)('%s has a known section type', (file) => {
    const data = readSection(file);
    expect(KNOWN_TYPES).toContain(data.type);
  });

  it('all files have numeric prefixes', () => {
    for (const file of files) {
      // Allow 2+ digit prefixes (00- through 9999-) so projects with many
      // sections, or appended files like 100-flip-cards.json, still pass.
      expect(file).toMatch(/^\d{2,}-/);
    }
  });

  it('has no duplicate filenames', () => {
    const unique = new Set(files);
    expect(unique.size).toBe(files.length);
  });

  it('first section is a header or hero type', () => {
    const first = files[0];
    const data = readSection(first);
    expect(HERO_TYPES).toContain(data.type);
  });
});
