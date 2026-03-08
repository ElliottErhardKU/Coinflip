import OpenAI from 'openai';
import { env } from '@/lib/env';
import { betResearchSchema } from '@/lib/llm/schemas';
import type { LlmClient, LlmStructuredRequest } from '@/lib/llm/types';

function ensureKey() {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required when LLM_PROVIDER=openai');
  }
}

export function createOpenAiClient(): LlmClient {
  ensureKey();
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  return {
    provider: 'openai',
    model: env.OPENAI_MODEL,
    async summarizeBetResearch(request: LlmStructuredRequest) {
      const response = await client.responses.create({
        model: env.OPENAI_MODEL,
        input: [
          {
            role: 'system',
            content:
              'You are a sports market analyst. Return concise, practical outputs and avoid certainty claims.',
          },
          {
            role: 'user',
            content: `${request.task}\n\n${request.input}`,
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'bet_research',
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                matchup: { type: 'string' },
                marketType: {
                  type: 'string',
                  enum: ['moneyline', 'spread', 'total', 'prop', 'other'],
                },
                recommendation: { type: 'string' },
                rationale: { type: 'string' },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
                riskFlags: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
              required: ['matchup', 'marketType', 'recommendation', 'rationale', 'confidence', 'riskFlags'],
            },
            strict: true,
          },
        },
      });

      const raw = response.output_text;
      const parsed = betResearchSchema.parse(JSON.parse(raw));
      return parsed;
    },
  };
}
