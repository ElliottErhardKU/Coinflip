# Handoff Checklist (Blockathon Bets)

## Must-pass checks

1. Start app

```powershell
pnpm dev
```

2. Run smoke test

```powershell
pnpm smoke
```

Expected: `SMOKE PASS`

3. Verify key endpoints

- `GET /api/nba/games`
- `GET /api/nba/compare?gameId=<id>`
- `GET /api/bets/offers`
- `GET /api/bets/settlements`

## Demo-ready checks

- UI can create group and offer
- Offer can be accepted from table
- Settlements panel shows payout hash + receipt CID
- Compare Market returns best-line summary text

## Environment notes

- Odds: `ODDS_API_KEY`
- XRPL: `XRPL_TREASURY_SEED`
- Pinata: `PINATA_JWT`
- LLM disabled by default for cost safety: `LLM_PROVIDER=none`

## Known constraints

- Result-based settlement depends on public score feed timing/finality.
- Some payout test paths may produce `mock_...` hash for self-payment guard cases.
