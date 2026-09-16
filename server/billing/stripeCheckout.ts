/**
 * Stripe Checkout + Customer Portal stubs.
 * Does not call Stripe until Crystal provisions STRIPE_SECRET_KEY and Price IDs.
 *
 * Stripe is the customer billing layer only. It does not pay OpenAI, Anthropic,
 * Suno, CapCut, or other creation platforms directly unless those providers
 * participate in a documented Connect arrangement (not assumed).
 */

export interface CheckoutSessionStub {
  scaffold: true;
  mode: 'subscription';
  successUrl: string;
  cancelUrl: string;
  priceId: string | null;
  customerId: string | null;
  message: string;
}

export interface PortalSessionStub {
  scaffold: true;
  customerId: string;
  returnUrl: string;
  message: string;
}

export function createCheckoutSessionStub(input: {
  accountId: string;
  successUrl: string;
  cancelUrl: string;
  priceEnvKey?: string;
}): CheckoutSessionStub {
  const priceKey = input.priceEnvKey ?? 'STRIPE_PRICE_PAID_BASE';
  const priceId = process.env[priceKey] || null;
  return {
    scaffold: true,
    mode: 'subscription',
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    priceId,
    customerId: null,
    message: priceId
      ? 'Would create Stripe Checkout Session (wire stripe SDK when going live).'
      : `PLACEHOLDER: set ${priceKey} after Crystal creates Stripe Prices. No live charge.`,
  };
}

export function createCustomerPortalStub(input: {
  customerId: string;
  returnUrl: string;
}): PortalSessionStub {
  return {
    scaffold: true,
    customerId: input.customerId,
    returnUrl: input.returnUrl,
    message:
      'Would create Stripe Billing Portal session (wire stripe SDK when going live).',
  };
}
