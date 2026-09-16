import type { IncomingMessage, ServerResponse } from 'node:http';
import { json } from './lib/http.js';

export default function handler(
  _req: IncomingMessage,
  res: ServerResponse,
): void {
  json(res, 200, {
    ok: true,
    service: 'crystalcore-os-api-tiers',
    scaffold: true,
    capabilities: [
      'auth.keys',
      'entitlements',
      'usage_ledger',
      'stripe.checkout_portal_webhooks',
      'creation_platforms',
      'social_media',
      'byok',
      'circuit_breaker',
    ],
  });
}
