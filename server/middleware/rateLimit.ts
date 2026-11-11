/*
Copyright (c) 2026 Crystal E Arena-Turner (TerAustralis Incognita, ABN 70 741 068 059).
All rights reserved, except as set out in the copyright owner's licence.
*/
/**
 * Rate-limit stub. RPM/TPM values come from Crystal-filled tier config (null = not enforced yet).
 */

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  reason?: string;
}

export function checkRateLimit(input: {
  rpm: number | null;
  requestsInWindow: number;
}): RateLimitResult {
  if (input.rpm === null) {
    return { allowed: true, reason: 'rpm_not_configured' };
  }
  if (input.requestsInWindow >= input.rpm) {
    return {
      allowed: false,
      retryAfterSeconds: 60,
      reason: 'rpm_exceeded',
    };
  }
  return { allowed: true };
}
