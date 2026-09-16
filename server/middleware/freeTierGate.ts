/**
 * Free tier hard-cap gate + circuit breaker hooks.
 * Enforces hard caps across ALL entitlement categories.
 */

import { assertCircuitClosed } from '../billing/circuitBreaker.js';
import { authorize } from '../entitlements/service.js';
import type { Capability, Entitlements, GateDecision } from '../lib/types.js';
import { isFreeTierId } from '../lib/tiers.js';

export function freeTierHardCapGate(
  entitlements: Entitlements,
  capability: Capability,
  opts?: Parameters<typeof authorize>[2],
): GateDecision {
  if (!isFreeTierId(entitlements.tierId)) {
    return authorize(entitlements, capability, opts);
  }

  const circuit = assertCircuitClosed();
  if (!circuit.ok) {
    return {
      allow: false,
      status: 402,
      code: 'circuit_breaker_open',
      message: 'Free-tier platform spend paused (circuit breaker).',
    };
  }

  // Enforce hard_cap semantics for Free regardless of misconfiguration.
  const locked: Entitlements = {
    ...entitlements,
    inference: { ...entitlements.inference, overagePolicy: 'hard_cap' },
    creationPlatforms: {
      ...entitlements.creationPlatforms,
      overagePolicy: 'hard_cap',
      sandboxOnly: true,
      productionAccess: false,
    },
    socialMedia: {
      ...entitlements.socialMedia,
      overagePolicy: 'hard_cap',
      sandboxOnly: true,
      productionAccess: false,
      autoPostingAllowed: false,
    },
    mcpServers: {
      ...entitlements.mcpServers,
      overagePolicy: 'hard_cap',
      sandboxOnly: true,
      productionAccess: false,
    },
    apis: {
      ...entitlements.apis,
      overagePolicy: 'hard_cap',
      sandboxOnly: true,
      productionAccess: false,
    },
    connectors: {
      ...entitlements.connectors,
      overagePolicy: 'hard_cap',
      sandboxOnly: true,
      productionAccess: false,
    },
    developer: {
      ...entitlements.developer,
      overagePolicy: 'hard_cap',
      sandboxOnly: true,
      productionAccess: false,
      productionKeysAllowed: false,
      productionPromoteAllowed: false,
      webhooksAllowed: false,
    },
    automation: {
      ...entitlements.automation,
      overagePolicy: 'hard_cap',
      sandboxOnly: true,
      productionAccess: false,
      retriesAllowed: false,
    },
    connections: {
      ...entitlements.connections,
      productionKeysAllowed: false,
      sandboxOnly: true,
      webhooksAllowed: false,
      productionPromoteAllowed: false,
    },
  };

  return authorize(locked, capability, opts);
}
