import { z } from 'zod';

export const FlipCardSchema = z.object({
  title: z.string().describe('Card title shown on both front and back'),
  description: z.string().describe('Card description shown on the back (HTML allowed)'),
  image: z.string().describe('Image path or URL for the card front'),
  imageAlt: z.string().optional().describe('Alt text for the image'),
});

export const FlipCardsSchema = z.object({
  sectionNumber: z.string().optional(),
  heading: z.string(),
  subtitle: z.string().optional(),
  cardsPerPage: z.number().int().min(1).max(8).optional().default(3).describe('How many cards per page'),
  cards: z.array(FlipCardSchema).min(1).max(40),
});

export type FlipCardsProps = z.infer<typeof FlipCardsSchema>;
export type FlipCard = z.infer<typeof FlipCardSchema>;
