import { readState, writeState } from '@/lib/storage/state';

export type Friendship = { a: string; b: string; createdAt: string };

function normPair(x: string, y: string): [string, string] {
  return x < y ? [x, y] : [y, x];
}

export function addFriend(a: string, b: string) {
  if (!a || !b || a === b) throw new Error('Invalid friend pair');
  const [x, y] = normPair(a, b);
  const state = readState();
  const exists = state.friendships.find((f) => f.a === x && f.b === y);
  if (exists) return exists;
  const next: Friendship = { a: x, b: y, createdAt: new Date().toISOString() };
  state.friendships.push(next);
  writeState(state);
  return next;
}

export function areFriends(a: string, b: string) {
  const [x, y] = normPair(a, b);
  return !!readState().friendships.find((f) => f.a === x && f.b === y);
}

export function listFriendships(userId?: string) {
  const all = readState().friendships;
  if (!userId) return all;
  return all.filter((f) => f.a === userId || f.b === userId);
}
