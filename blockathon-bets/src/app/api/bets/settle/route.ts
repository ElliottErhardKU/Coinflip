import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { settleOffer, getOfferById } from '@/lib/bets/store';
import { getUser } from '@/lib/users/store';

const schema = z.object({
  offerId: z.string().min(2),
  winnerUserId: z.string().min(2).optional(),
  winnerSide: z.enum(['home', 'away']).optional(),
  winnerAddress: z.string().min(5).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());

    const offer = getOfferById(body.offerId);
    if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });

    const winnerUserId =
      body.winnerUserId ??
      (body.winnerSide
        ? body.winnerSide === offer.side
          ? offer.createdBy
          : (offer.acceptedBy ?? '')
        : '');

    if (!winnerUserId) {
      return NextResponse.json({ error: 'Unable to infer winner; provide winnerUserId.' }, { status: 400 });
    }

    const winnerAddress = body.winnerAddress ?? getUser(winnerUserId)?.xrplAddress;
    if (!winnerAddress) {
      return NextResponse.json({ error: 'winnerAddress missing and no user profile xrplAddress found.' }, { status: 400 });
    }

    const result = await settleOffer(body.offerId, winnerUserId, winnerAddress);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid payload';

    if (typeof message === 'string') {
      if (message.includes('Offer not found')) return NextResponse.json({ error: message }, { status: 404 });
      if (message.includes('Only matched offers can be settled')) return NextResponse.json({ error: message }, { status: 409 });
      if (message.includes('cannot settle safely')) return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
