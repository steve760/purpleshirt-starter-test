import { describe, it, expect } from 'vitest';
import { HeroSchema } from '../src/kit/schemas/hero';
import { HeroSimpleSchema } from '../src/kit/schemas/hero-simple';
import { VoiceGridSchema } from '../src/kit/schemas/voice-grid';
import { BarChartSchema } from '../src/kit/schemas/bar-chart';
import { QuoteCarouselSchema } from '../src/kit/schemas/quote-carousel';

describe('HeroSchema', () => {
  it('parses valid hero data', () => {
    const data = {
      eyebrow: 'Test',
      headline: 'Hello **world**',
      lede: 'A subheading.',
      stats: [{ value: 85, unit: '%', label: 'metric' }],
      ctas: [{ label: 'Click', href: '#', variant: 'primary' as const }],
    };
    expect(() => HeroSchema.parse(data)).not.toThrow();
  });

  it('requires at least 1 stat', () => {
    const data = {
      eyebrow: 'Test',
      headline: 'Hello',
      lede: 'Sub',
      stats: [],
    };
    expect(() => HeroSchema.parse(data)).toThrow();
  });

  it('rejects more than 5 stats', () => {
    const stats = Array.from({ length: 6 }, (_, i) => ({ value: i, label: `s${i}` }));
    const data = { eyebrow: 'Test', headline: 'Hello', lede: 'Sub', stats };
    expect(() => HeroSchema.parse(data)).toThrow();
  });

  it('allows missing ctas', () => {
    const data = {
      eyebrow: 'Test',
      headline: 'Hello',
      lede: 'Sub',
      stats: [{ value: 1, label: 'x' }],
    };
    expect(() => HeroSchema.parse(data)).not.toThrow();
  });

  it('rejects missing headline', () => {
    const data = { eyebrow: 'Test', lede: 'Sub', stats: [{ value: 1, label: 'x' }] };
    expect(() => HeroSchema.parse(data)).toThrow();
  });

  it('rejects invalid cta variant', () => {
    const data = {
      eyebrow: 'Test',
      headline: 'Hello',
      lede: 'Sub',
      stats: [{ value: 1, label: 'x' }],
      ctas: [{ label: 'Click', href: '#', variant: 'invalid' }],
    };
    expect(() => HeroSchema.parse(data)).toThrow();
  });
});

describe('HeroSimpleSchema', () => {
  it('parses valid data', () => {
    const data = { eyebrow: 'Badge', headline: 'Title\n**accent**', lede: 'Subtitle.' };
    expect(() => HeroSimpleSchema.parse(data)).not.toThrow();
  });

  it('rejects missing eyebrow', () => {
    expect(() => HeroSimpleSchema.parse({ headline: 'H', lede: 'L' })).toThrow();
  });
});

describe('VoiceGridSchema', () => {
  const voice = { percent: 50, title: 'Group', meta: '100 people', description: 'Desc' };

  it('parses valid data with 2 voices', () => {
    expect(() => VoiceGridSchema.parse({ voices: [voice, voice] })).not.toThrow();
  });

  it('rejects fewer than 2 voices', () => {
    expect(() => VoiceGridSchema.parse({ voices: [voice] })).toThrow();
  });

  it('rejects more than 6 voices', () => {
    expect(() => VoiceGridSchema.parse({ voices: Array(7).fill(voice) })).toThrow();
  });

  it('rejects percent > 100', () => {
    expect(() => VoiceGridSchema.parse({ voices: [{ ...voice, percent: 101 }, voice] })).toThrow();
  });

  it('allows optional color', () => {
    const withColor = { ...voice, color: '#e63946' };
    expect(() => VoiceGridSchema.parse({ voices: [withColor, voice] })).not.toThrow();
  });
});

describe('BarChartSchema', () => {
  const bar = { label: 'A', value: 85 };

  it('parses valid data', () => {
    const data = { heading: 'Chart', bars: [bar], unit: '%' };
    expect(() => BarChartSchema.parse(data)).not.toThrow();
  });

  it('requires at least 1 bar', () => {
    expect(() => BarChartSchema.parse({ heading: 'Chart', bars: [] })).toThrow();
  });

  it('rejects more than 12 bars', () => {
    const bars = Array.from({ length: 13 }, (_, i) => ({ label: `B${i}`, value: i }));
    expect(() => BarChartSchema.parse({ heading: 'Chart', bars })).toThrow();
  });

  it('allows optional description and color', () => {
    const data = {
      heading: 'Chart',
      description: '<p>Text</p>',
      bars: [{ label: 'A', value: 50, color: '#e63946' }],
    };
    expect(() => BarChartSchema.parse(data)).not.toThrow();
  });

  it('rejects missing heading', () => {
    expect(() => BarChartSchema.parse({ bars: [bar] })).toThrow();
  });
});

describe('QuoteCarouselSchema', () => {
  const quote = { quote: 'Great stuff.', title: 'Jane', subtitle: 'CEO' };

  it('parses valid data', () => {
    const data = { heading: 'Quotes', quotes: [quote] };
    expect(() => QuoteCarouselSchema.parse(data)).not.toThrow();
  });

  it('requires at least 1 quote', () => {
    expect(() => QuoteCarouselSchema.parse({ heading: 'Q', quotes: [] })).toThrow();
  });

  it('rejects more than 20 quotes', () => {
    const quotes = Array(21).fill(quote);
    expect(() => QuoteCarouselSchema.parse({ heading: 'Q', quotes })).toThrow();
  });

  it('allows optional subtitle', () => {
    const data = { quotes: [{ quote: 'Text', title: 'Name' }] };
    expect(() => QuoteCarouselSchema.parse(data)).not.toThrow();
  });

  it('allows optional heading', () => {
    const data = { quotes: [quote] };
    expect(() => QuoteCarouselSchema.parse(data)).not.toThrow();
  });
});
