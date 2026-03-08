import type { LlmClient, LlmStructuredRequest } from '@/lib/llm/types';

function parseOdds(input: string): number | null {
  const m = input.match(/([+-]\d{3,4}|[+-]\d{2,3})/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function impliedProb(american: number): number {
  if (american > 0) return 100 / (american + 100);
  return Math.abs(american) / (Math.abs(american) + 100);
}

export function createFallbackClient(): LlmClient {
  return {
    provider: 'none',
    model: 'deterministic-fallback-v1',
    async summarizeBetResearch(request: LlmStructuredRequest) {
      const odds = parseOdds(request.input);
      const p = odds ? impliedProb(odds) : null;

      const recommendation =
        odds == null
          ? 'Insufficient odds data; compare at least 2 books before placing a bet.'
          : Math.abs(odds) <= 110
            ? 'Market appears close to efficient; prioritize line shopping and limits.'
            : odds > 0
              ? 'Underdog side can be viable if your true win probability beats implied probability.'
              : 'Favorite is priced aggressively; verify edge before taking chalk.';

      const riskFlags = [
        'No guaranteed edge; avoid over-sizing positions.',
        'Use only funds you can afford to lose.',
      ];
      if (p !== null) riskFlags.push(`Implied probability ≈ ${(p * 100).toFixed(1)}%`);

      return {
        matchup: request.input.split(',')[0]?.trim() || 'Unknown matchup',
        marketType: /spread/i.test(request.input)
          ? 'spread'
          : /moneyline/i.test(request.input)
            ? 'moneyline'
            : /total/i.test(request.input)
              ? 'total'
              : 'other',
        recommendation,
        rationale:
          'Fallback analysis mode uses deterministic odds heuristics so app functionality continues without API-key dependencies.',
        confidence: 0.42,
        riskFlags,
      };
    },
  };
}
