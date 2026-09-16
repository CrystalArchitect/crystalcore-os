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
