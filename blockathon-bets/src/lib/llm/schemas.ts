import { z } from 'zod';

export const betResearchSchema = z.object({
  matchup: z.string(),
  marketType: z.enum(['moneyline', 'spread', 'total', 'prop', 'other']),
  recommendation: z.string(),
  rationale: z.string(),
  confidence: z.number().min(0).max(1),
  riskFlags: z.array(z.string()),
});

export type BetResearchSchema = z.infer<typeof betResearchSchema>;
