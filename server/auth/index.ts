/**
 * Auth HTTP stubs: issue + revoke API keys.
 * Mounted as Vercel serverless handlers under /api/auth/*.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { json, readJsonBody } from '../lib/http.js';
import type { Capability } from '../lib/types.js';
import { issueApiKey, revokeApiKey } from './keys.js';

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const action = url.searchParams.get('action') ?? 'issue';

  if (req.method === 'POST' && action === 'issue') {
    const body = (await readJsonBody<{
      accountId?: string;
      scopes?: Capability[];
      environment?: 'sandbox' | 'production';
    }>(req)) ?? {};

    if (!body.accountId) {
      json(res, 400, { error: 'accountId_required' });
      return;
    }

    const { record, secret } = issueApiKey({
      accountId: body.accountId,
      scopes: body.scopes ?? ['inference'],
      environment: body.environment ?? 'sandbox',
    });

    json(res, 201, {
      key: {
        id: record.id,
        prefix: record.prefix,
        scopes: record.scopes,
        environment: record.environment,
        createdAt: record.createdAt,
      },
      /** Returned once — client must store; server keeps hash only. */
      secret,
      scaffold: true,
    });
    return;
  }

  if (req.method === 'POST' && action === 'revoke') {
    const body = (await readJsonBody<{ keyId?: string }>(req)) ?? {};
    if (!body.keyId) {
      json(res, 400, { error: 'keyId_required' });
      return;
    }
    const revoked = revokeApiKey(body.keyId);
    if (!revoked) {
      json(res, 404, { error: 'key_not_found' });
      return;
    }
    json(res, 200, { id: revoked.id, revokedAt: revoked.revokedAt, scaffold: true });
    return;
  }

  json(res, 405, { error: 'method_not_allowed' });
}
