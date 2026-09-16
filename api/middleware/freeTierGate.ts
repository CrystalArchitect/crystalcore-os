/**
 * Free tier hard-cap gate + circuit breaker hooks.
 */

import { assertCircuitClosed } from '../billing/circuitBreaker.js';
import { authorize } from '../entitlements/service.js';
import type { Capability, Entitlements, GateDecision } from '../lib/types.js';

export function freeTierHardCapGate(
  entitlements: Entitlements,
  capability: Capability,
  opts?: Parameters<typeof authorize>[2],
): GateDecision {
  if (entitlements.tierId !== 'free') {
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
  };

  return authorize(locked, capability, opts);
}
