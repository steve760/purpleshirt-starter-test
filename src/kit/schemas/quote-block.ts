import { z } from 'zod';

export const QuoteBlockSchema = z.object({
  sectionNumber: z.string().optional(),
  eyebrow: z.string().optional(),
  heading: z.string().optional(),
  quote: z.string().describe('The quote text'),
  title: z.string().optional().describe('Attribution name or source'),
  subtitle: z.string().optional().describe('Role, organisation, or context'),
});

export type QuoteBlockProps = z.infer<typeof QuoteBlockSchema>;
