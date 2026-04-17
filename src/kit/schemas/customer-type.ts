import { z } from 'zod';

export const PersonaItemSchema = z.object({
  text: z.string(),
});

export const PersonaSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  image: z.string().describe('Background image for the front of the card (e.g. /assets/photo.jpg)'),
  imageAlt: z.string().optional(),
  struggles: z.array(PersonaItemSchema).optional(),
  opportunities: z.array(PersonaItemSchema).optional(),
});

export const CustomerTypeSchema = z.object({
  sectionNumber: z.string().optional(),
  heading: z.string().optional(),
  subtitle: z.string().optional(),
  personas: z.array(PersonaSchema).min(1).max(4),
});

export type CustomerTypeProps = z.infer<typeof CustomerTypeSchema>;
export type Persona = z.infer<typeof PersonaSchema>;
