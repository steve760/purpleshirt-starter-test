import { z } from 'zod';

export const JourneyPhaseSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
});

export const CustomerJourneySchema = z.object({
  sectionNumber: z.string().optional(),
  heading: z.string().optional(),
  subtitle: z.string().optional(),
  phases: z.array(JourneyPhaseSchema).min(1).max(6),
});

export type CustomerJourneyProps = z.infer<typeof CustomerJourneySchema>;
export type JourneyPhase = z.infer<typeof JourneyPhaseSchema>;
