import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getLlmClient } from '@/lib/llm';

const bodySchema = z.object({
  task: z.string().min(5),
  input: z.string().min(5),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const body = bodySchema.parse(json);

    const llm = getLlmClient();
    const result = await llm.summarizeBetResearch(body);

    return NextResponse.json({ provider: llm.provider, model: llm.model, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
