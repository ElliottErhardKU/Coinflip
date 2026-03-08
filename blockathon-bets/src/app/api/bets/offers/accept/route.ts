import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { acceptOffer } from '@/lib/bets/store';

const schema = z.object({
  offerId: z.string().min(2),
  acceptedBy: z.string().min(2),
});

export async function POST(req: NextRequest) {
  try {
    const { offerId, acceptedBy } = schema.parse(await req.json());
    const offer = await acceptOffer(offerId, acceptedBy);
    if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    return NextResponse.json({ offer });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
