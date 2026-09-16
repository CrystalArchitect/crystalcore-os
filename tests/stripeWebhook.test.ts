import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyStripeSignatureStub } from '../server/billing/webhooks.js';
import {
  tripCircuitBreaker,
  resetCircuitBreaker,
  assertCircuitClosed,
} from '../server/billing/circuitBreaker.js';

describe('stripe webhook signature stub', () => {
  it('rejects missing secret', () => {
    const r = verifyStripeSignatureStub('{}', 'sha256=abc', undefined);
    assert.equal(r.ok, false);
  });

  it('accepts matching HMAC scaffold signature', () => {
    const secret = 'whsec_test';
    const payload = '{"type":"invoice.payment_succeeded"}';
    const sig = createHmac('sha256', secret).update(payload).digest('hex');
    const r = verifyStripeSignatureStub(payload, `sha256=${sig}`, secret);
    assert.equal(r.ok, true);
  });
});

describe('circuit breaker', () => {
  it('trips and blocks then resets', () => {
    resetCircuitBreaker();
    assert.equal(assertCircuitClosed().ok, true);
    tripCircuitBreaker('test');
    assert.equal(assertCircuitClosed().ok, false);
    resetCircuitBreaker();
    assert.equal(assertCircuitClosed().ok, true);
  });
});
