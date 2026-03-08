import { env } from '@/lib/env';
import { createOpenAiClient } from '@/lib/llm/openaiClient';
import { createGeminiClient } from '@/lib/llm/geminiClient';
import { createFallbackClient } from '@/lib/llm/fallbackClient';

export function getLlmClient() {
  if (env.LLM_PROVIDER === 'none') return createFallbackClient();
  if (env.LLM_PROVIDER === 'gemini') return createGeminiClient();
  return createOpenAiClient();
}
