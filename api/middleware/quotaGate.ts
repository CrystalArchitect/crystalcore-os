/**
 * Shared quota / entitlement gate for inference + connectors + creation + social.
 */

import { authorize } from '../entitlements/service.js';
import type {
  Capability,
  CreationMeterUnit,
  Entitlements,
  GateDecision,
  SocialMeterUnit,
} from '../lib/types.js';

export function quotaGate(
  entitlements: Entitlements,
  capability: Capability,
  opts?: {
    connectorId?: string;
    meterUnit?: CreationMeterUnit | SocialMeterUnit;
    meterQuantity?: number;
    model?: string;
    environment?: 'sandbox' | 'production';
  },
): GateDecision {
  return authorize(entitlements, capability, opts);
}
