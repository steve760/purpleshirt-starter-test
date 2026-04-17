import { z } from 'zod';

export const VoiceSchema = z.object({
  percent: z.number().min(0).max(100).describe('Share percentage (e.g. 53)'),
  title: z.string().describe('Group name (e.g. "Club members")'),
  meta: z.string().describe('Context line (e.g. "72 of 74 clubs · 74 respondents")'),
  description: z.string().describe('Short description of this group\'s engagement'),
  color: z.string().optional().describe('CSS colour for accent strip. Falls back to --brand-accent.'),
});

export const VoiceGridSchema = z.object({
  voices: z.array(VoiceSchema).min(2).max(6).describe('Respondent cohort cards'),
});

export type VoiceGridProps = z.infer<typeof VoiceGridSchema>;
export type Voice = z.infer<typeof VoiceSchema>;
