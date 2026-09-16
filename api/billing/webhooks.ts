/**
 * Stripe webhook handler skeleton with signature verification stub.
 * Production: use stripe.webhooks.constructEvent with STRIPE_WEBHOOK_SECRET.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { json, readJsonBody } from '../lib/http.js';
import { tripCircuitBreaker, resetCircuitBreaker } from './circuitBreaker.js';

export function verifyStripeSignatureStub(
  payload: string,
  signatureHeader: string | undefined,
  secret: string | undefined,
): { ok: boolean; reason?: string } {
  if (!secret) {
    return {
      ok: false,
      reason: 'STRIPE_WEBHOOK_SECRET not configured (scaffold deny)',
    };
  }
  if (!signatureHeader) {
    return { ok: false, reason: 'missing_stripe_signature' };
  }
  // Scaffold: HMAC compare against a simplified header value (not full Stripe scheme).
  // Replace with stripe.webhooks.constructEvent before production.
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const provided = signatureHeader.replace(/^sha256=/, '');
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(provided);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: 'signature_mismatch' };
    }
  } catch {
    return { ok: false, reason: 'signature_parse_error' };
  }
  return { ok: true };
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'method_not_allowed' });
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  const sig = req.headers['stripe-signature'];
  const sigStr = Array.isArray(sig) ? sig[0] : sig;

  const verified = verifyStripeSignatureStub(
    raw,
    sigStr,
    process.env.STRIPE_WEBHOOK_SECRET,
  );

  if (!verified.ok) {
    json(res, 400, { error: 'invalid_signature', reason: verified.reason, scaffold: true });
    return;
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(raw);
  } catch {
    json(res, 400, { error: 'invalid_json' });
    return;
  }

  switch (event.type) {
    case 'invoice.payment_failed':
    case 'customer.subscription.deleted':
      tripCircuitBreaker(`stripe:${event.type}`);
      break;
    case 'invoice.payment_succeeded':
    case 'customer.subscription.updated':
      resetCircuitBreaker();
      break;
    default:
      break;
  }

  json(res, 200, { received: true, type: event.type ?? null, scaffold: true });
}

/** Exported for tests that prefer body object path. */
export async function handleStripeEventBody(
  body: unknown,
): Promise<{ received: boolean; type: string | null }> {
  const event = body as { type?: string };
  return { received: true, type: event.type ?? null };
}

// silence unused import when tree-shaken differently
void readJsonBody;
