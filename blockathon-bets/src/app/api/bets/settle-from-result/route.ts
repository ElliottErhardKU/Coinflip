import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOfferById, settleOffer } from '@/lib/bets/store';
import { getUser } from '@/lib/users/store';
import { getNbaFinalResult } from '@/lib/nba/resultsService';
import { getNbaOddsForGame } from '@/lib/nba/oddsService';

const schema = z.object({
  offerId: z.string().min(2),
});

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const offer = getOfferById(body.offerId);
    if (!offer) return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    if (offer.status !== 'matched') return NextResponse.json({ error: 'Offer must be matched' }, { status: 400 });

    const odds = await getNbaOddsForGame(offer.gameId);
    const result = await getNbaFinalResult(odds.homeTeam, odds.awayTeam);

    if (result.status !== 'final') {
      return NextResponse.json({ error: 'Game not final yet', resultStatus: result.status }, { status: 409 });
    }

    const winnerTeam = result.homeScore > result.awayScore ? result.homeTeam : result.awayTeam;
    const winnerIsHome = norm(winnerTeam) === norm(odds.homeTeam);
    const winnerUserId = winnerIsHome
      ? offer.side === 'home'
        ? offer.createdBy
        : (offer.acceptedBy ?? '')
      : offer.side === 'away'
        ? offer.createdBy
        : (offer.acceptedBy ?? '');

    if (!winnerUserId) return NextResponse.json({ error: 'Could not infer winner user' }, { status: 400 });

    const winnerAddress = getUser(winnerUserId)?.xrplAddress;
    if (!winnerAddress) {
      return NextResponse.json(
        { error: `Winner ${winnerUserId} has no xrplAddress in user profile. Use /api/users first.` },
        { status: 400 },
      );
    }

    const settled = await settleOffer(offer.id, winnerUserId, winnerAddress);

    return NextResponse.json({
      result,
      winnerTeam,
      winnerUserId,
      settled,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
