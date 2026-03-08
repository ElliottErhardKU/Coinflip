import fs from 'fs';
import path from 'path';
import type { BetOffer, BetSettlement } from '@/lib/nba/types';
import type { BetGroup } from '@/lib/groups/store';
import type { UserProfile } from '@/lib/users/store';
import type { Friendship } from '@/lib/friends/store';

type AppState = {
  users: UserProfile[];
  friendships: Friendship[];
  groups: BetGroup[];
  offers: BetOffer[];
  settlements: BetSettlement[];
};

const DATA_DIR = path.join(process.cwd(), '.data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

const EMPTY: AppState = { users: [], friendships: [], groups: [], offers: [], settlements: [] };

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STATE_FILE)) fs.writeFileSync(STATE_FILE, JSON.stringify(EMPTY, null, 2), 'utf8');
}

export function readState(): AppState {
  ensureFile();
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as AppState;
    return {
      users: parsed.users ?? [],
      friendships: parsed.friendships ?? [],
      groups: parsed.groups ?? [],
      offers: parsed.offers ?? [],
      settlements: parsed.settlements ?? [],
    };
  } catch {
    return { ...EMPTY };
  }
}

export function writeState(next: AppState) {
  ensureFile();
  fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2), 'utf8');
}
