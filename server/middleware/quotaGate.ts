/*
Copyright (c) 2026 Crystal E Arena-Turner (TerAustralis Incognita, ABN 70 741 068 059).
All rights reserved, except as set out in the copyright owner's licence.
*/
/**
 * Shared quota / entitlement gate for ALL categories:
 * inference, creation, social, MCP, APIs, connectors, developer, automation.
 */

import { authorize, type GateOpts } from '../entitlements/service.js';
import type { Capability, Entitlements, GateDecision } from '../lib/types.js';

export function quotaGate(
  entitlements: Entitlements,
  capability: Capability,
  opts?: GateOpts,
): GateDecision {
  return authorize(entitlements, capability, opts);
}
