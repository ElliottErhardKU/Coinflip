import { NextResponse } from 'next/server';
import { listSettlements } from '@/lib/bets/store';

export async function GET() {
  return NextResponse.json({ settlements: listSettlements() });
}
