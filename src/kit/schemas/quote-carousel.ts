import { z } from 'zod';

export const QuoteSchema = z.object({
  quote: z.string().describe('The quote text'),
  title: z.string().describe('Attribution name or source'),
  subtitle: z.string().optional().describe('Role, organisation, or context'),
});

export const QuoteCarouselSchema = z.object({
  sectionNumber: z.string().optional(),
  heading: z.string().optional(),
  quotes: z.array(QuoteSchema).min(1).max(20),
});

export type QuoteCarouselProps = z.infer<typeof QuoteCarouselSchema>;
export type Quote = z.infer<typeof QuoteSchema>;
