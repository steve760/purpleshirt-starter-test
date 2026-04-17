import { z } from 'zod';

export const BarChartBarSchema = z.object({
  label: z.string(),
  value: z.number(),
  color: z.string().optional(),
});

export const BarChartSchema = z.object({
  sectionNumber: z.string().optional(),
  heading: z.string(),
  description: z.string().optional().describe('HTML description shown beside the chart'),
  bars: z.array(BarChartBarSchema).min(1).max(12),
  unit: z.string().optional().default('%').describe('Unit suffix for values (e.g. "%", "k", "pts")'),
});

export type BarChartProps = z.infer<typeof BarChartSchema>;
export type BarChartBar = z.infer<typeof BarChartBarSchema>;
