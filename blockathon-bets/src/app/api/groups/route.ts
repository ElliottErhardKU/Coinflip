import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createGroup, listGroups } from '@/lib/groups/store';

const schema = z.object({
  name: z.string().min(2),
  createdBy: z.string().min(2),
});

export async function GET() {
  return NextResponse.json({ groups: listGroups() });
}

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const group = createGroup(body.name, body.createdBy);
    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
