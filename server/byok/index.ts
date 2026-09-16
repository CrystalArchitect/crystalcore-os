/**
 * BYOK (bring your own key) header/path stub.
 * Customer supplies provider / creation-platform keys (vaulted in production);
 * they pay that provider directly. Crystal charges platform fee via Stripe.
 *
 * Applies to AI model providers AND creation platforms (Suno-class, CapCut-class,
 * image/design/voice, etc.). Header: X-Crystal-BYOK-Provider + X-Crystal-BYOK-Key
 * (scaffold only — do not log key material).
 */

export type ByokProviderKind =
  | 'openai'
  | 'anthropic'
  | 'creation_platform'
  | string;

export interface ByokContext {
  enabled: boolean;
  provider: string | null;
  /** Redacted — never echo full key. */
  keyFingerprint: string | null;
  mode: 'platform_managed' | 'byok';
}

function fingerprint(key: string): string {
  if (key.length < 8) return '****';
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

export function resolveByokFromHeaders(headers: Record<string, string | string[] | undefined>): ByokContext {
  const byokFlag = process.env.BYOK_ENABLED === 'true';
  const providerHeader = headers['x-crystal-byok-provider'];
  const keyHeader = headers['x-crystal-byok-key'];
  const provider = Array.isArray(providerHeader)
    ? providerHeader[0]
    : providerHeader;
  const key = Array.isArray(keyHeader) ? keyHeader[0] : keyHeader;

  if (!byokFlag || !provider || !key) {
    return {
      enabled: false,
      provider: null,
      keyFingerprint: null,
      mode: 'platform_managed',
    };
  }

  const allowed = (process.env.BYOK_ALLOWED_PROVIDERS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (allowed.length > 0 && !allowed.includes(provider)) {
    return {
      enabled: false,
      provider,
      keyFingerprint: null,
      mode: 'platform_managed',
    };
  }

  return {
    enabled: true,
    provider,
    keyFingerprint: fingerprint(key),
    mode: 'byok',
  };
}

export default async function handler(
  req: { method?: string; headers: Record<string, string | string[] | undefined> },
  res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (s: string) => void },
): Promise<void> {
  const ctx = resolveByokFromHeaders(req.headers ?? {});
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(
    JSON.stringify({
      scaffold: true,
      byok: ctx,
      note: 'BYOK removes Crystal provider-credit exposure for that connector; Stripe still bills the platform fee. Stripe does not pay Suno/CapCut/etc. directly.',
    }),
  );
}
