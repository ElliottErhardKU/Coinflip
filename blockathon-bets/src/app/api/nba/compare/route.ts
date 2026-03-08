import { NextRequest, NextResponse } from 'next/server';
import { getNbaOddsForGame } from '@/lib/nba/oddsService';
import { compareMarkets } from '@/lib/nba/marketCompare';

export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get('gameId');
  if (!gameId) return NextResponse.json({ error: 'gameId required' }, { status: 400 });

  const odds = await getNbaOddsForGame(gameId);
  const comparison = compareMarkets(odds);
  return NextResponse.json({ comparison });
}
