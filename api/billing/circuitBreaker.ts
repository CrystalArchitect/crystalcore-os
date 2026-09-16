/**
 * Circuit breaker hooks: customer payment failure / unsafe provider balance
 * → pause platform-managed inference and creation-platform spend.
 */

import type { CircuitBreakerState } from '../lib/types.js';

let state: CircuitBreakerState = {
  open: false,
  reason: null,
  openedAt: null,
};

export function getCircuitBreakerState(): CircuitBreakerState {
  return { ...state };
}

export function tripCircuitBreaker(reason: string): CircuitBreakerState {
  state = {
    open: true,
    reason,
    openedAt: new Date().toISOString(),
  };
  return getCircuitBreakerState();
}

export function resetCircuitBreaker(): CircuitBreakerState {
  state = { open: false, reason: null, openedAt: null };
  return getCircuitBreakerState();
}

export function assertCircuitClosed(): {
  ok: boolean;
  state: CircuitBreakerState;
} {
  const enabled = process.env.CIRCUIT_BREAKER_ENABLED !== 'false';
  if (!enabled) return { ok: true, state: getCircuitBreakerState() };
  if (state.open) return { ok: false, state: getCircuitBreakerState() };
  return { ok: true, state: getCircuitBreakerState() };
}
