# Blockathon Bets

Gemini-first setup for a sports peer-betting hackathon app, with OpenAI and no-key fallback modes.

## Setup

1. Copy env file:

```bash
cp .env.example .env.local
```

2. Set at minimum:

- `LLM_PROVIDER=openai`
- `OPENAI_API_KEY=...`

3. Run:

```bash
pnpm dev
```

## LLM Mode

- Default: `LLM_PROVIDER=gemini`
- OpenAI mode: `LLM_PROVIDER=openai`
- No-key mode: `LLM_PROVIDER=none` (deterministic fallback analysis)

No application code changes needed for provider switching.

## API Test

`POST /api/llm/research`

Body:

```json
{
  "task": "Compare current NBA market pricing for this bet",
  "input": "Lakers vs Suns, spread Lakers -2.5 at -110"
}
```

Returns provider/model metadata + structured bet research JSON.

## Current backend scope

- NBA games + odds endpoints
- Group creation/join
- Bet offer create/list/accept
- Settlement endpoint with XRPL payment hooks (mock fallback when seed missing)
- Pinata receipt uploads (mock CID fallback when JWT missing)

## Scripts

- `pnpm dev` - run app
- `pnpm smoke` - run end-to-end smoke test

## Useful endpoints

- `GET /api/nba/games`
- `GET /api/nba/odds?gameId=...`
- `GET /api/nba/compare?gameId=...`
- `GET|POST /api/users`
- `GET|POST /api/groups`
- `POST /api/groups/join`
- `GET|POST /api/bets/offers`
- `POST /api/bets/offers/accept`
- `POST /api/bets/settle`
- `POST /api/bets/settle-from-result`
- `GET /api/bets/settlements`
