/**
 * Billing HTTP stubs: Checkout + Customer Portal session creators.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { json, readJsonBody } from '../lib/http.js';
import {
  createCheckoutSessionStub,
  createCustomerPortalStub,
} from './stripeCheckout.js';
import { assertCircuitClosed, getCircuitBreakerState } from './circuitBreaker.js';

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const action = url.searchParams.get('action') ?? 'checkout';

  if (req.method === 'GET' && action === 'circuit') {
    json(res, 200, { ...getCircuitBreakerState(), scaffold: true });
    return;
  }

  if (req.method === 'POST' && action === 'checkout') {
    const body =
      (await readJsonBody<{
        accountId?: string;
        successUrl?: string;
        cancelUrl?: string;
      }>(req)) ?? {};
    if (!body.accountId || !body.successUrl || !body.cancelUrl) {
      json(res, 400, {
        error: 'accountId_successUrl_cancelUrl_required',
      });
      return;
    }
    const session = createCheckoutSessionStub({
      accountId: body.accountId,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
    });
    json(res, 200, session);
    return;
  }

  if (req.method === 'POST' && action === 'portal') {
    const body =
      (await readJsonBody<{ customerId?: string; returnUrl?: string }>(req)) ??
      {};
    if (!body.customerId || !body.returnUrl) {
      json(res, 400, { error: 'customerId_returnUrl_required' });
      return;
    }
    json(res, 200, createCustomerPortalStub(body as { customerId: string; returnUrl: string }));
    return;
  }

  if (req.method === 'POST' && action === 'assert-circuit') {
    json(res, 200, { ...assertCircuitClosed(), scaffold: true });
    return;
  }

  json(res, 405, { error: 'method_not_allowed' });
}
