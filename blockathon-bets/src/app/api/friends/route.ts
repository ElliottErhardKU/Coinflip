import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addFriend, listFriendships } from '@/lib/friends/store';

const schema = z.object({ a: z.string().min(2), b: z.string().min(2) });

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') ?? undefined;
  return NextResponse.json({ friendships: listFriendships(userId) });
}

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const friendship = addFriend(body.a, body.b);
    return NextResponse.json({ friendship }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
