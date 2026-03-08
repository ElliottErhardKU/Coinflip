import { config } from '@/lib/config';
import type { GameOdds, NbaGame } from '@/lib/nba/types';

const SPORT = 'basketball_nba';
const CACHE_TTL_MS = 90_000;

type CacheEntry<T> = { at: number; value: T };

let gamesCache: CacheEntry<NbaGame[]> | null = null;
const oddsCache = new Map<string, CacheEntry<GameOdds>>();

type OddsApiGame = {
  id: string;
  sport_key: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers?: Array<{
    title: string;
    markets: Array<{
      key: 'h2h' | 'spreads' | 'totals';
      outcomes: Array<{ name: string; price: number; point?: number }>;
    }>;
  }>;
};

function fallbackGames(): NbaGame[] {
  const now = Date.now();
  return [
    {
      id: 'mock-lal-phx',
      homeTeam: 'Phoenix Suns',
      awayTeam: 'Los Angeles Lakers',
      commenceTime: new Date(now + 60 * 60 * 1000).toISOString(),
      sportKey: SPORT,
    },
    {
      id: 'mock-bos-mia',
      homeTeam: 'Miami Heat',
      awayTeam: 'Boston Celtics',
      commenceTime: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
      sportKey: SPORT,
    },
  ];
}

function fallbackOdds(gameId = 'mock-lal-phx'): GameOdds {
  return {
    gameId,
    homeTeam: 'Phoenix Suns',
    awayTeam: 'Los Angeles Lakers',
    commenceTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    markets: [
      {
        bookmaker: 'MockBook',
        marketKey: 'h2h',
        outcomes: [
          { name: 'Los Angeles Lakers', price: -110 },
          { name: 'Phoenix Suns', price: -110 },
        ],
      },
      {
        bookmaker: 'MockBook',
        marketKey: 'spreads',
        outcomes: [
          { name: 'Los Angeles Lakers', price: -110, point: -2.5 },
          { name: 'Phoenix Suns', price: -110, point: 2.5 },
        ],
      },
    ],
  };
}

export async function getNbaGames(): Promise<NbaGame[]> {
  if (gamesCache && Date.now() - gamesCache.at < CACHE_TTL_MS) {
    return gamesCache.value;
  }

  if (!config.ODDS_API_KEY) {
    const fb = fallbackGames();
    gamesCache = { at: Date.now(), value: fb };
    return fb;
  }

  const url = `${config.ODDS_API_BASE_URL}/sports/${SPORT}/events/?apiKey=${config.ODDS_API_KEY}`;
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    const fb = fallbackGames();
    gamesCache = { at: Date.now(), value: fb };
    return fb;
  }

  const data = (await res.json()) as OddsApiGame[];
  const mapped = data.map((g) => ({
    id: g.id,
    homeTeam: g.home_team,
    awayTeam: g.away_team,
    commenceTime: g.commence_time,
    sportKey: g.sport_key,
  }));

  gamesCache = { at: Date.now(), value: mapped };
  return mapped;
}

export async function getNbaOddsForGame(gameId: string): Promise<GameOdds> {
  const cached = oddsCache.get(gameId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }

  if (!config.ODDS_API_KEY) {
    const fb = fallbackOdds(gameId);
    oddsCache.set(gameId, { at: Date.now(), value: fb });
    return fb;
  }

  const markets = 'h2h,spreads,totals';
  const url = `${config.ODDS_API_BASE_URL}/sports/${SPORT}/events/${gameId}/odds/?apiKey=${config.ODDS_API_KEY}&regions=us&markets=${markets}&oddsFormat=american`;
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) {
    const fb = fallbackOdds(gameId);
    oddsCache.set(gameId, { at: Date.now(), value: fb });
    return fb;
  }

  const data = (await res.json()) as OddsApiGame;

  const mapped: GameOdds = {
    gameId: data.id,
    homeTeam: data.home_team,
    awayTeam: data.away_team,
    commenceTime: data.commence_time,
    markets:
      data.bookmakers?.flatMap((b) =>
        b.markets.map((m) => ({
          bookmaker: b.title,
          marketKey: m.key,
          outcomes: m.outcomes.map((o) => ({ name: o.name, price: o.price, point: o.point })),
        })),
      ) ?? [],
  };

  oddsCache.set(gameId, { at: Date.now(), value: mapped });
  return mapped;
}
