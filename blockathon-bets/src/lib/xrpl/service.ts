import crypto from 'crypto';
import xrpl from 'xrpl';
import { config } from '@/lib/config';

function fakeHash(prefix: string) {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
}

export async function createEscrowMemo(args: {
  destination: string;
  amountDrops: string;
  memoText: string;
}) {
  if (!config.XRPL_TREASURY_SEED) {
    return { txHash: fakeHash('mock_escrow'), mode: 'mock' as const };
  }

  const client = new xrpl.Client(config.XRPL_RPC);
  await client.connect();
  try {
    const wallet = xrpl.Wallet.fromSeed(config.XRPL_TREASURY_SEED);
    // For offer creation, destination can be creator-owned (sometimes equal to treasury).
    // Avoid redundant self-payment failure by emitting a mock digest in that case.
    if (args.destination === wallet.address) {
      return { txHash: fakeHash('mock_escrow_self'), mode: 'mock' as const };
    }

    const tx: xrpl.Payment = {
      TransactionType: 'Payment',
      Account: wallet.address,
      Destination: args.destination,
      Amount: args.amountDrops,
      Memos: [{ Memo: { MemoData: xrpl.convertStringToHex(args.memoText) } }],
    };

    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);
    const txResult = (result.result.meta as any)?.TransactionResult;
    const ok = txResult === 'tesSUCCESS';
    if (!ok) throw new Error(`XRPL tx failed: ${txResult ?? 'unknown'}`);

    return { txHash: signed.hash, mode: 'xrpl' as const };
  } finally {
    await client.disconnect();
  }
}

export async function settlePayout(args: {
  winnerAddress: string;
  amountDrops: string;
  memoText: string;
}) {
  return createEscrowMemo({
    destination: args.winnerAddress,
    amountDrops: args.amountDrops,
    memoText: args.memoText,
  });
}
