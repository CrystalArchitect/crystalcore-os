/**
 * Shared quota / entitlement gate for inference + connectors + creation platforms.
 */

import { authorize } from '../entitlements/service.js';
import type { Capability, Entitlements, GateDecision } from '../lib/types.js';
import type { CreationMeterUnit } from '../lib/types.js';

export function quotaGate(
  entitlements: Entitlements,
  capability: Capability,
  opts?: {
    connectorId?: string;
    meterUnit?: CreationMeterUnit;
    meterQuantity?: number;
    model?: string;
    environment?: 'sandbox' | 'production';
  },
): GateDecision {
  return authorize(entitlements, capability, opts);
}
