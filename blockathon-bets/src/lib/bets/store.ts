import { randomUUID } from 'crypto';
import type { BetOffer, BetSettlement } from '@/lib/nba/types';
import { userInGroup } from '@/lib/groups/store';
import { uploadReceiptJson } from '@/lib/pinata/service';
import { createEscrowMemo, settlePayout } from '@/lib/xrpl/service';
import { readState, writeState } from '@/lib/storage/state';
import { getUser } from '@/lib/users/store';
import { areFriends } from '@/lib/friends/store';

export function listOffers() {
  return readState().offers.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listSettlements() {
  return readState().settlements.sort((a, b) => b.settledAt.localeCompare(a.settledAt));
}

export function getOfferById(offerId: string) {
  return readState().offers.find((o) => o.id === offerId) ?? null;
}

export async function createOffer(input: Omit<BetOffer, 'id' | 'status' | 'createdAt'>) {
  if (!userInGroup(input.offeredToGroupId, input.createdBy)) {
    throw new Error('Creator must be a member of the target group.');
  }

  const creatorAddress = getUser(input.createdBy)?.xrplAddress;
  if (!creatorAddress) {
    throw new Error(`User ${input.createdBy} missing xrplAddress. Create/update user profile first.`);
  }

  const escrow = await createEscrowMemo({
    destination: creatorAddress,
    amountDrops: String(Math.round(Number(input.stakeAmount) * 1_000_000)),
    memoText: `offer:${input.gameId}:${input.createdBy}`,
  });

  const receipt = await uploadReceiptJson(
    {
      type: 'offer_created',
      gameId: input.gameId,
      createdBy: input.createdBy,
      stakeAmount: input.stakeAmount,
      stakeToken: input.stakeToken,
      side: input.side,
      oddsAmerican: input.oddsAmerican,
      escrowTxHash: escrow.txHash,
      escrowMode: escrow.mode,
      createdAt: new Date().toISOString(),
    },
    `offer-${input.gameId}-${Date.now()}.json`,
  );

  const offer: BetOffer = {
    ...input,
    id: randomUUID(),
    status: 'open',
    createdAt: new Date().toISOString(),
    escrowTxHash: escrow.txHash,
    receiptCid: receipt.cid,
  };

  const state = readState();
  state.offers.push(offer);
  writeState(state);

  return offer;
}

export async function acceptOffer(id: string, acceptedBy: string) {
  const state = readState();
  const idx = state.offers.findIndex((o) => o.id === id);
  if (idx === -1) return null;

  const found = state.offers[idx];
  if (found.status !== 'open') return found;

  if (!userInGroup(found.offeredToGroupId, acceptedBy)) {
    throw new Error('Acceptor must be in the target group.');
  }
  if (!areFriends(found.createdBy, acceptedBy)) {
    throw new Error('Acceptor must be a friend of the offer creator.');
  }

  const receipt = await uploadReceiptJson(
    {
      type: 'offer_accepted',
      offerId: found.id,
      acceptedBy,
      acceptedAt: new Date().toISOString(),
    },
    `offer-accept-${found.id}.json`,
  );

  const next: BetOffer = {
    ...found,
    status: 'matched',
    acceptedBy,
    receiptCid: receipt.cid,
  };
  state.offers[idx] = next;
  writeState(state);

  return next;
}

export async function settleOffer(offerId: string, winnerUserId: string, winnerAddress: string) {
  const state = readState();
  const idx = state.offers.findIndex((o) => o.id === offerId);
  if (idx === -1) throw new Error('Offer not found');

  const found = state.offers[idx];
  if (found.status !== 'matched') throw new Error('Only matched offers can be settled');
  if (!found.acceptedBy) throw new Error('Matched offer missing acceptedBy; cannot settle safely.');

  const payoutDrops = Math.round(Number(found.stakeAmount) * 2 * 1_000_000);
  if (!Number.isFinite(payoutDrops) || payoutDrops <= 0) {
    throw new Error('Invalid payout amount derived from stakeAmount.');
  }

  const participants = new Set([found.createdBy, found.acceptedBy]);
  if (!participants.has(winnerUserId)) {
    throw new Error('winnerUserId must be one of the matched offer participants.');
  }

  const payout = await settlePayout({
    winnerAddress,
    amountDrops: String(payoutDrops),
    memoText: `settlement:${offerId}:${winnerUserId}`,
  });

  const settlementReceipt = await uploadReceiptJson(
    {
      type: 'offer_settled',
      offerId,
      winnerUserId,
      payoutTxHash: payout.txHash,
      payoutMode: payout.mode,
      settledAt: new Date().toISOString(),
    },
    `offer-settlement-${offerId}.json`,
  );

  const next: BetOffer = { ...found, status: 'settled' };
  state.offers[idx] = next;

  const settlement: BetSettlement = {
    offerId,
    winnerUserId,
    settledAt: new Date().toISOString(),
    payoutTxHash: payout.txHash,
    settlementReceiptCid: settlementReceipt.cid,
  };

  state.settlements = [...state.settlements.filter((s) => s.offerId !== offerId), settlement];
  writeState(state);

  return { offer: next, settlement };
}

export function cancelExpired(nowIso = new Date().toISOString()) {
  const state = readState();
  const now = new Date(nowIso).getTime();
  let changed = 0;

  state.offers = state.offers.map((offer) => {
    if (offer.status === 'open' && new Date(offer.expiresAt).getTime() <= now) {
      changed += 1;
      return { ...offer, status: 'cancelled' as const };
    }
    return offer;
  });

  if (changed > 0) writeState(state);
  return changed;
}
