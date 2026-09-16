/**
 * API key issue / hash / revoke skeleton.
 * Production: persist via UsageLedgerStore / DB; use a real KDF + pepper from API_KEY_PEPPER.
 */

import { createHash, randomBytes } from 'node:crypto';
import type { ApiKeyRecord, Capability } from '../lib/types.js';

const memoryKeys = new Map<string, ApiKeyRecord>();

function pepper(): string {
  return process.env.API_KEY_PEPPER ?? 'PLACEHOLDER_pepper_not_for_production';
}

function prefix(): string {
  return process.env.API_KEY_PREFIX ?? 'cc_sk';
}

export function hashApiKey(secret: string): string {
  return createHash('sha256')
    .update(`${pepper()}:${secret}`)
    .digest('hex');
}

export function issueApiKey(input: {
  accountId: string;
  scopes: Capability[];
  environment: 'sandbox' | 'production';
}): { record: ApiKeyRecord; secret: string } {
  const secret = `${prefix()}_${randomBytes(24).toString('base64url')}`;
  const record: ApiKeyRecord = {
    id: `key_${randomBytes(8).toString('hex')}`,
    accountId: input.accountId,
    keyHash: hashApiKey(secret),
    prefix: secret.slice(0, 10),
    scopes: input.scopes,
    environment: input.environment,
    revokedAt: null,
    createdAt: new Date().toISOString(),
  };
  memoryKeys.set(record.id, record);
  return { record, secret };
}

export function revokeApiKey(keyId: string): ApiKeyRecord | null {
  const existing = memoryKeys.get(keyId);
  if (!existing) return null;
  const updated: ApiKeyRecord = {
    ...existing,
    revokedAt: new Date().toISOString(),
  };
  memoryKeys.set(keyId, updated);
  return updated;
}

export function findKeyBySecret(secret: string): ApiKeyRecord | null {
  const hash = hashApiKey(secret);
  for (const rec of memoryKeys.values()) {
    if (rec.keyHash === hash && !rec.revokedAt) return rec;
  }
  return null;
}

/** Test helper — clear in-memory store. */
export function _resetKeyStoreForTests(): void {
  memoryKeys.clear();
}
