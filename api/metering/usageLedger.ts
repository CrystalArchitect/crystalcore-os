/**
 * Usage ledger write path.
 * Interface ready for a real DB; default impl is in-memory (optional file dump under api/.data/).
 *
 * Records customer charge, provider cost, tax, fees, reserve, margin fields —
 * values remain null until Crystal supplies real cost tables / Stripe prices.
 *
 * Covers ALL categories: inference, creation, social, MCP, APIs, generic connectors,
 * developer tooling, and automation. Event kinds are defined on UsageLedgerEntry.
 */


import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { UsageLedgerEntry } from '../lib/types.js';

export interface UsageLedgerStore {
  append(entry: Omit<UsageLedgerEntry, 'id' | 'timestamp'> & {
    id?: string;
    timestamp?: string;
  }): Promise<UsageLedgerEntry>;
  listByAccount(accountId: string): Promise<UsageLedgerEntry[]>;
  clear?(): Promise<void>;
}

class InMemoryUsageLedger implements UsageLedgerStore {
  private entries: UsageLedgerEntry[] = [];

  async append(
    partial: Omit<UsageLedgerEntry, 'id' | 'timestamp'> & {
      id?: string;
      timestamp?: string;
    },
  ): Promise<UsageLedgerEntry> {
    const entry: UsageLedgerEntry = {
      id: partial.id ?? `evt_${randomBytes(8).toString('hex')}`,
      timestamp: partial.timestamp ?? new Date().toISOString(),
      accountId: partial.accountId,
      apiKeyId: partial.apiKeyId,
      requestId: partial.requestId,
      kind: partial.kind,
      provider: partial.provider,
      modelOrConnector: partial.modelOrConnector,
      billingMode: partial.billingMode,
      inputUnits: partial.inputUnits,
      outputUnits: partial.outputUnits,
      meterUnit: partial.meterUnit,
      meterQuantity: partial.meterQuantity,
      customerCharge: partial.customerCharge,
      providerCostEstimate: partial.providerCostEstimate,
      tax: partial.tax,
      stripeFees: partial.stripeFees,
      reserve: partial.reserve,
      platformMargin: partial.platformMargin,
      currency: partial.currency,
      metadata: partial.metadata ?? {},
    };
    this.entries.push(entry);
    return entry;
  }

  async listByAccount(accountId: string): Promise<UsageLedgerEntry[]> {
    return this.entries.filter((e) => e.accountId === accountId);
  }

  async clear(): Promise<void> {
    this.entries = [];
  }

  /** Optional local dump for debugging (not used in serverless by default). */
  dumpToFile(path?: string): void {
    const here = dirname(fileURLToPath(import.meta.url));
    const target =
      path ?? join(here, '..', '.data', 'usage-ledger.json');
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(this.entries, null, 2));
  }
}

let defaultStore: UsageLedgerStore = new InMemoryUsageLedger();

export function getUsageLedger(): UsageLedgerStore {
  return defaultStore;
}

export function setUsageLedger(store: UsageLedgerStore): void {
  defaultStore = store;
}

export function createInMemoryUsageLedger(): InMemoryUsageLedger {
  return new InMemoryUsageLedger();
}

export async function recordUsage(
  partial: Omit<UsageLedgerEntry, 'id' | 'timestamp'> & {
    id?: string;
    timestamp?: string;
  },
): Promise<UsageLedgerEntry> {
  return getUsageLedger().append(partial);
}
