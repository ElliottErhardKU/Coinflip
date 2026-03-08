import { readState, writeState } from '@/lib/storage/state';

export type UserProfile = {
  id: string;
  displayName: string;
  xrplAddress?: string;
  createdAt: string;
};

export function listUsers() {
  return readState().users.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function upsertUser(input: { id: string; displayName?: string; xrplAddress?: string }) {
  const state = readState();
  const idx = state.users.findIndex((u) => u.id === input.id);

  if (idx === -1) {
    const next: UserProfile = {
      id: input.id,
      displayName: input.displayName ?? input.id,
      xrplAddress: input.xrplAddress,
      createdAt: new Date().toISOString(),
    };
    state.users.push(next);
    writeState(state);
    return next;
  }

  const prev = state.users[idx];
  const next: UserProfile = {
    ...prev,
    displayName: input.displayName ?? prev.displayName,
    xrplAddress: input.xrplAddress ?? prev.xrplAddress,
  };

  state.users[idx] = next;
  writeState(state);
  return next;
}

export function getUser(userId: string) {
  return readState().users.find((u) => u.id === userId) ?? null;
}
