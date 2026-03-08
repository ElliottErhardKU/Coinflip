import type { GameOdds } from '@/lib/nba/types';

type BestLine = {
  bookmaker: string;
  outcome: string;
  price: number;
  point?: number;
};

export function compareMarkets(odds: GameOdds) {
  const bestByMarket = new Map<string, BestLine[]>();

  for (const market of odds.markets) {
    const key = market.marketKey;
    const existing = bestByMarket.get(key) ?? [];

    for (const outcome of market.outcomes) {
      const idx = existing.findIndex((x) => x.outcome === outcome.name && x.point === outcome.point);
      if (idx === -1) {
        existing.push({
          bookmaker: market.bookmaker,
          outcome: outcome.name,
          price: outcome.price,
          point: outcome.point,
        });
      } else {
        const prev = existing[idx];
        if (outcome.price > prev.price) {
          existing[idx] = {
            bookmaker: market.bookmaker,
            outcome: outcome.name,
            price: outcome.price,
            point: outcome.point,
          };
        }
      }
    }

    bestByMarket.set(key, existing);
  }

  return {
    gameId: odds.gameId,
    homeTeam: odds.homeTeam,
    awayTeam: odds.awayTeam,
    commenceTime: odds.commenceTime,
    bestByMarket: Object.fromEntries(bestByMarket),
  };
}
