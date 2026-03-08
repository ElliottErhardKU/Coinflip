import { NextResponse } from 'next/server';
import { getNbaGames } from '@/lib/nba/oddsService';

export async function GET() {
  const games = await getNbaGames();
  return NextResponse.json({ games });
}
