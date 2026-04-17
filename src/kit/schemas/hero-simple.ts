import { z } from 'zod';

export const HeroSimpleSchema = z.object({
  eyebrow: z.string().describe('Pill badge text (e.g. "Project title · April 2026")'),
  headline: z.string().describe('Main heading. Wrap text in **double asterisks** for accent colour.'),
  lede: z.string().describe('Subheading paragraph below the headline'),
});

export type HeroSimpleProps = z.infer<typeof HeroSimpleSchema>;
