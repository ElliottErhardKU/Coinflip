# Submission Notes (Blockathon Bets)

## One-liner
Friends-only, no-house-edge NBA peer betting app that keeps funds between participants and settles transparently via XRPL transaction rails.

## What is live in this build
- NBA game/odds ingestion (`/api/nba/games`, `/api/nba/odds`, `/api/nba/compare`)
- Group + user setup
- Offer create/accept/settle
- Result-based settlement endpoint
- Settlement artifacts + receipt CID tracking

## Trust model
- No house rake in flow logic.
- Offer/settlement receipts are persisted and can be pinned to IPFS via Pinata.
- XRPL payout hashes are persisted in settlement records.

## Cost-safe operation
- LLM disabled by default (`LLM_PROVIDER=none`).
- Odds requests cached to reduce credit burn.

## Demo checkpoints
1. `pnpm dev`
2. `pnpm smoke`
3. Dashboard walk-through: create group -> create offer -> accept -> settle -> verify settlement panel.
