import { z } from 'zod';

export const HeaderSchema = z.object({
  logo: z.string().describe('Path or URL to the client logo (e.g. /assets/logo.svg)'),
  logoAlt: z.string().optional().describe('Alt text for the logo'),
  title: z.string().describe('Project title shown beside the logo'),
});

export type HeaderProps = z.infer<typeof HeaderSchema>;
