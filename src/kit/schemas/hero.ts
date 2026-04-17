import { z } from 'zod';

export const HeroStatSchema = z.object({
  value: z.number().describe('The number to animate to (e.g. 85, 140)'),
  unit: z.string().optional().describe('Unit suffix shown after number (e.g. "%")'),
  label: z.string().describe('Description shown below the stat'),
});

export const HeroCtaSchema = z.object({
  label: z.string(),
  href: z.string(),
  variant: z.enum(['primary', 'ghost']).default('primary'),
});

export const HeroSchema = z.object({
  eyebrow: z.string().describe('Pill badge text (e.g. "Consultation summary · April 2026")'),
  headline: z.string().describe('Main heading. Wrap text in **double asterisks** for accent colour.'),
  lede: z.string().describe('Subheading paragraph below the headline'),
  stats: z.array(HeroStatSchema).min(1).max(5).describe('Animated stat counters'),
  ctas: z.array(HeroCtaSchema).optional().describe('Call-to-action buttons'),
});

export type HeroProps = z.infer<typeof HeroSchema>;
export type HeroStat = z.infer<typeof HeroStatSchema>;
export type HeroCta = z.infer<typeof HeroCtaSchema>;
