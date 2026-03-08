import { randomUUID } from 'crypto';
import { readState, writeState } from '@/lib/storage/state';
import { upsertUser } from '@/lib/users/store';

export type BetGroup = {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
  createdAt: string;
};

export function listGroups() {
  return readState().groups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createGroup(name: string, createdBy: string) {
  upsertUser({ id: createdBy });
  const state = readState();
  const g: BetGroup = {
    id: randomUUID(),
    name,
    createdBy,
    members: [createdBy],
    createdAt: new Date().toISOString(),
  };
  state.groups.push(g);
  writeState(state);
  return g;
}

export function joinGroup(groupId: string, userId: string) {
  upsertUser({ id: userId });
  const state = readState();
  const idx = state.groups.findIndex((g) => g.id === groupId);
  if (idx === -1) return null;

  const g = state.groups[idx];
  if (g.members.includes(userId)) return g;

  const next = { ...g, members: [...g.members, userId] };
  state.groups[idx] = next;
  writeState(state);
  return next;
}

export function userInGroup(groupId: string, userId: string) {
  const g = readState().groups.find((x) => x.id === groupId);
  return !!g?.members.includes(userId);
}
