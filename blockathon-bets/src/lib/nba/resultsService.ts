export type NbaFinalResult = {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'final' | 'not_final' | 'not_found';
};

type EspnScoreboard = {
  events?: Array<{
    competitions?: Array<{
      competitors?: Array<{
        homeAway: 'home' | 'away';
        team: { displayName: string };
        score: string;
      }>;
      status?: { type?: { completed?: boolean } };
    }>;
  }>;
};

async function fetchEspnScoreboard(date: string) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${date}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.json()) as EspnScoreboard;
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function getNbaFinalResult(homeTeam: string, awayTeam: string): Promise<NbaFinalResult> {
  const dates = [0, -1, 1].map((d) => {
    const dt = new Date(Date.now() + d * 24 * 60 * 60 * 1000);
    const yyyy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  });

  for (const date of dates) {
    const data = await fetchEspnScoreboard(date);
    if (!data?.events?.length) continue;

    for (const ev of data.events) {
      const comp = ev.competitions?.[0];
      if (!comp?.competitors?.length) continue;

      const home = comp.competitors.find((c) => c.homeAway === 'home');
      const away = comp.competitors.find((c) => c.homeAway === 'away');
      if (!home || !away) continue;

      const homeName = home.team.displayName;
      const awayName = away.team.displayName;

      if (norm(homeName) !== norm(homeTeam) || norm(awayName) !== norm(awayTeam)) continue;

      const completed = !!comp.status?.type?.completed;
      return {
        homeTeam: homeName,
        awayTeam: awayName,
        homeScore: Number(home.score ?? 0),
        awayScore: Number(away.score ?? 0),
        status: completed ? 'final' : 'not_final',
      };
    }
  }

  return {
    homeTeam,
    awayTeam,
    homeScore: 0,
    awayScore: 0,
    status: 'not_found',
  };
}
