# Coinflip — The 50/50 Market

Friends-only peer sports market where users post head-to-head offers inside private groups, with no-house-edge positioning and verifiable settlement artifacts.

## What this app does

- Private **user/friend/group** setup
- NBA game + market ingestion from The Odds API
- Head-to-head offer creation and acceptance
- Offer lifecycle: `open -> matched -> settled/cancelled`
- Settlement record trail with XRPL tx hash + Pinata receipt CID

## Quick start

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open: `http://localhost:3000`

## Environment

Minimum practical setup:

- `ODDS_API_KEY` (live NBA odds)
- `XRPL_TREASURY_SEED` (real testnet signing path)
- `PINATA_JWT` (real receipt CIDs)

LLM is optional and cost-safe by default:

- `LLM_PROVIDER=none`

## Scripts

- `pnpm dev` — run app
- `pnpm smoke` — run end-to-end smoke test

## API endpoints

- `GET /api/nba/games`
- `GET /api/nba/odds?gameId=...`
- `GET /api/nba/compare?gameId=...`
- `GET|POST /api/users`
- `GET|POST /api/friends`
- `GET|POST /api/groups`
- `POST /api/groups/join`
- `GET|POST /api/bets/offers`
- `POST /api/bets/offers/accept`
- `POST /api/bets/settle`
- `POST /api/bets/settle-from-result`
- `GET /api/bets/settlements`

## Notes

- This is a hackathon prototype; legal/compliance requirements apply for any real-money production launch.
- See `RUNBOOK.md` and `HANDOFF.md` for demo + operational flow.
