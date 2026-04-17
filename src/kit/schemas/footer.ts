import { z } from 'zod';

export const FooterSchema = z.object({
  text: z.string().optional().describe('Primary footer text (HTML allowed)'),
  note: z.string().optional().describe('Smaller secondary line (HTML allowed)'),
});

export type FooterProps = z.infer<typeof FooterSchema>;
