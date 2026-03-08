import { z } from 'zod';

const EnvSchema = z.object({
  LLM_PROVIDER: z.enum(['openai', 'gemini', 'none']).default('gemini'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
});

const parsed = EnvSchema.safeParse({
  LLM_PROVIDER: process.env.LLM_PROVIDER,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL,
});

if (!parsed.success) {
  console.error('Invalid env configuration', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration. Check .env.local');
}

export const env = parsed.data;
