/**
 * DRAFT 42-tier pricing ladder helpers.
 * Loads config/tiers.example.json (or override path). Not marketing-live.
 *
 * Product rules (all tiers):
 * - On-device privacy by default; cloud only on opt-in connector/inference.
 * - Universal entitlement across all categories.
 * - Shared billable credits wallet (~1 credit ≈ AUD $0.01 cost basis — DRAFT).
 * - Free = hard caps / sandbox; Paid = included credits + overage at cost + margin_floor 30% (DRAFT).
 * - Stripe bills customer; does NOT pay providers directly. BYOK preferred.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TierId } from './types.js';

export interface TierDraftRecord {
  id: string;
  display_name: string;
  subtitle?: string;
  draft?: boolean;
  currency: string;
  price_aud_monthly: number;
  included_credits: number;
  seats: number;
  sandbox_only: boolean;
  production: boolean;
  overage_policy: 'hard_cap' | 'metered';
  margin_floor_percent: number | null;
  stripe_price_id: null;
  stripe_metered_price_id?: null;
  inherits?: string;
  alias_of?: string;
  comment?: string;
}

export interface TiersConfigFile {
  version: string;
  draft_pricing: {
    status: string;
    currency: string;
    tier_count: number;
    not_marketing_live: boolean;
    [key: string]: unknown;
  };
  defaults: Record<string, unknown>;
  tier_order: string[];
  tiers: Record<string, TierDraftRecord>;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONFIG_PATH = join(__dirname, '../../config/tiers.example.json');

let cached: TiersConfigFile | null = null;

export function loadTiersConfig(path: string = DEFAULT_CONFIG_PATH): TiersConfigFile {
  if (cached && path === DEFAULT_CONFIG_PATH) return cached;
  const raw = JSON.parse(readFileSync(path, 'utf8')) as TiersConfigFile;
  if (path === DEFAULT_CONFIG_PATH) cached = raw;
  return raw;
}

/** Resolve legacy aliases (`free` → tier_01, `paid` → tier_02) and look up by id. */
export function getTierById(id: TierId | string, config?: TiersConfigFile): TierDraftRecord {
  const cfg = config ?? loadTiersConfig();
  const direct = cfg.tiers[id];
  if (!direct) {
    throw new Error(`Unknown tier id: ${id}`);
  }
  if (direct.alias_of) {
    const canonical = cfg.tiers[direct.alias_of];
    if (!canonical) {
      throw new Error(`Alias ${id} points to missing ${direct.alias_of}`);
    }
    return canonical;
  }
  return direct;
}

export function listOrderedTiers(config?: TiersConfigFile): TierDraftRecord[] {
  const cfg = config ?? loadTiersConfig();
  return cfg.tier_order.map((id) => {
    const t = cfg.tiers[id];
    if (!t) throw new Error(`tier_order references missing ${id}`);
    return t;
  });
}

export function isFreeTierId(tierId: TierId | string): boolean {
  return tierId === 'free' || tierId === 'tier_01';
}

export function isPaidTierId(tierId: TierId | string): boolean {
  return !isFreeTierId(tierId);
}

/** Canonical ordered ids tier_01 … tier_42 (excludes legacy aliases). */
export function expectedTierIds(): string[] {
  return Array.from({ length: 42 }, (_, i) => `tier_${String(i + 1).padStart(2, '0')}`);
}
