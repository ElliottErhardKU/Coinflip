import crypto from 'crypto';
import { config } from '@/lib/config';

type JsonRecord = Record<string, unknown>;

function fakeCid(payload: JsonRecord) {
  return `bafy-${crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 32)}`;
}

export async function uploadReceiptJson(payload: JsonRecord, fileName: string): Promise<{ cid: string; mode: 'pinata' | 'mock' }> {
  if (!config.PINATA_JWT) {
    return { cid: fakeCid({ fileName, payload }), mode: 'mock' };
  }

  const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.PINATA_JWT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pinataMetadata: { name: fileName },
      pinataContent: payload,
    }),
  });

  if (!res.ok) {
    return { cid: fakeCid({ fileName, payload }), mode: 'mock' };
  }

  const data = (await res.json()) as { IpfsHash?: string };
  return { cid: data.IpfsHash ?? fakeCid({ fileName, payload }), mode: 'pinata' };
}
