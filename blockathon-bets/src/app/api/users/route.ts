import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { listUsers, upsertUser } from '@/lib/users/store';

const schema = z.object({
  id: z.string().min(2),
  displayName: z.string().optional(),
  xrplAddress: z.string().optional(),
});

export async function GET() {
  return NextResponse.json({ users: listUsers() });
}

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const user = upsertUser(body);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
