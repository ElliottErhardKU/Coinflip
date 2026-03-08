import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { joinGroup } from '@/lib/groups/store';

const schema = z.object({
  groupId: z.string().min(2),
  userId: z.string().min(2),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const group = joinGroup(body.groupId, body.userId);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    return NextResponse.json({ group });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
