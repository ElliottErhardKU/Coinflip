import { z } from 'zod';

const ConfigSchema = z.object({
  ODDS_API_KEY: z.string().optional(),
  ODDS_API_BASE_URL: z.string().default('https://api.the-odds-api.com/v4'),
  PINATA_JWT: z.string().optional(),
  XRPL_RPC: z.string().default('wss://s.altnet.rippletest.net:51233'),
  XRPL_TREASURY_SEED: z.string().optional(),
});

export const config = ConfigSchema.parse({
  ODDS_API_KEY: process.env.ODDS_API_KEY,
  ODDS_API_BASE_URL: process.env.ODDS_API_BASE_URL,
  PINATA_JWT: process.env.PINATA_JWT,
  XRPL_RPC: process.env.XRPL_RPC,
  XRPL_TREASURY_SEED: process.env.XRPL_TREASURY_SEED,
});
