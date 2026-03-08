import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cancelExpired, createOffer, listOffers } from '@/lib/bets/store';

const createSchema = z.object({
  gameId: z.string().min(2),
  createdBy: z.string().min(2),
  offeredToGroupId: z.string().min(2),
  side: z.enum(['home', 'away']),
  stakeAmount: z.string().min(1),
  oddsAmerican: z.number(),
  expiresAt: z.string(),
  stakeToken: z.literal('LUSD').default('LUSD'),
});

export async function GET() {
  cancelExpired();
  return NextResponse.json({ offers: listOffers() });
}

export async function POST(req: NextRequest) {
  try {
    const parsed = createSchema.parse(await req.json());
    const created = await createOffer(parsed);
    return NextResponse.json({ offer: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
