# Blockathon Bets - Demo Runbook

## 0) Start

```powershell
cd C:\Users\eerha\.openclaw\workspace\blockathon-bets
pnpm dev
```

Open: `http://localhost:3000`

## 1) User + Group Setup

1. Set `userId` to `elliott`.
2. Paste XRPL address in setup section.
3. Click **Save User**.
4. Enter group name and click **Create Group**.

## 2) Create Offer

1. Pick group + NBA game.
2. Choose side (home/away).
3. Set stake + odds.
4. Click **Create Offer**.

## 3) Match Offer

1. In offers table, click **Accept**.
2. Enter `friend1` as accepter.
3. App auto-joins accepter to group and matches offer.

## 4) Compare Market (Judge wow)

1. Select game.
2. Click **Compare Market**.
3. Read best line summary by bookmaker.

## 5) Settlement

### Manual settlement path
Use API:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/api/bets/settle" `
  -ContentType "application/json" `
  -Body '{"offerId":"<offer-id>","winnerUserId":"elliott","winnerAddress":"<r-address>"}'
```

### Result-based path
1. Click **Settle by Result** in matched offer row.
2. If game is final and winner has XRPL address, settlement completes.

## 6) Verify artifacts

- Settlement panel shows:
  - winner
  - payout tx hash
  - settlement receipt CID

## 7) Backup API checks

```powershell
Invoke-RestMethod http://localhost:3000/api/nba/games
Invoke-RestMethod "http://localhost:3000/api/nba/compare?gameId=<game-id>"
Invoke-RestMethod http://localhost:3000/api/bets/offers
Invoke-RestMethod http://localhost:3000/api/bets/settlements
```
