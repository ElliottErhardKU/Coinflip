import { GoogleGenAI } from '@google/genai';
import { env } from '@/lib/env';
import { betResearchSchema } from '@/lib/llm/schemas';
import type { LlmClient, LlmStructuredRequest } from '@/lib/llm/types';

function ensureKey() {
  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required when LLM_PROVIDER=gemini');
  }
}

export function createGeminiClient(): LlmClient {
  ensureKey();
  const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

  return {
    provider: 'gemini',
    model: env.GEMINI_MODEL,
    async summarizeBetResearch(request: LlmStructuredRequest) {
      const prompt = [
        'Return only valid JSON with fields: matchup, marketType, recommendation, rationale, confidence, riskFlags.',
        'marketType must be one of: moneyline, spread, total, prop, other.',
        `Task: ${request.task}`,
        `Input: ${request.input}`,
      ].join('\n');

      const response = await client.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: prompt,
      });

      const text = response.text ?? '{}';
      return betResearchSchema.parse(JSON.parse(text));
    },
  };
}
