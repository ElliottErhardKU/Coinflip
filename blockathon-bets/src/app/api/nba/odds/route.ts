import { NextRequest, NextResponse } from 'next/server';
import { getNbaOddsForGame } from '@/lib/nba/oddsService';

export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get('gameId');
  if (!gameId) return NextResponse.json({ error: 'gameId required' }, { status: 400 });

  const odds = await getNbaOddsForGame(gameId);
  return NextResponse.json({ odds });
}
