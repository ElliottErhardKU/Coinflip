export type LlmStructuredRequest = {
  task: string;
  input: string;
};

export type BetResearch = {
  matchup: string;
  marketType: 'moneyline' | 'spread' | 'total' | 'prop' | 'other';
  recommendation: string;
  rationale: string;
  confidence: number; // 0..1
  riskFlags: string[];
};

export type LlmClient = {
  provider: 'openai' | 'gemini' | 'none';
  model: string;
  summarizeBetResearch: (request: LlmStructuredRequest) => Promise<BetResearch>;
};
