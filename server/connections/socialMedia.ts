/**
 * Pluggable social_media connectors.
 * Extensible catalog — examples of the class (not an exclusive allowlist):
 * X/Twitter, Instagram, TikTok, YouTube, Facebook/Meta, LinkedIn, Threads,
 * Bluesky, Discord, Telegram, and future platforms Crystal adds.
 *
 * Billing modes: platform-managed OAuth apps and/or BYOK (bring-your-own-app credentials).
 * Stripe does NOT pay Meta/TikTok/etc. directly unless a documented Connect relationship exists.
 */

import type { BillingMode, SocialMeterUnit } from '../lib/types.js';
import { recordUsage } from '../metering/usageLedger.js';
import { authorize, buildEntitlements } from '../entitlements/service.js';
import type { Capability, Entitlements, GateDecision, TierId } from '../lib/types.js';
import { assertCircuitClosed } from '../billing/circuitBreaker.js';
import { resolveByokFromHeaders } from '../byok/index.js';

export interface SocialMediaConnector {
  connectorId: string;
  displayName: string;
  capabilities: string[];
  meterUnits: SocialMeterUnit[];
  billingModes: BillingMode[];
}

/** Scaffold registry — PLACEHOLDER ids; Crystal curates the real catalog. */
export const SOCIAL_MEDIA_REGISTRY: SocialMediaConnector[] = [
  {
    connectorId: 'PLACEHOLDER_x_twitter',
    displayName: 'X / Twitter (class example)',
    capabilities: ['oauth_connect', 'publish', 'schedule', 'media_upload', 'analytics', 'inbox', 'webhook'],
    meterUnits: ['oauth_connect', 'publish', 'schedule', 'media_upload', 'analytics_pull', 'inbox_action', 'webhook_delivery', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_instagram',
    displayName: 'Instagram (class example)',
    capabilities: ['oauth_connect', 'publish', 'schedule', 'media_upload', 'analytics', 'inbox', 'webhook'],
    meterUnits: ['oauth_connect', 'publish', 'schedule', 'media_upload', 'analytics_pull', 'inbox_action', 'webhook_delivery', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_tiktok',
    displayName: 'TikTok (class example)',
    capabilities: ['oauth_connect', 'publish', 'schedule', 'media_upload', 'analytics', 'webhook'],
    meterUnits: ['oauth_connect', 'publish', 'schedule', 'media_upload', 'analytics_pull', 'webhook_delivery', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_youtube',
    displayName: 'YouTube (class example)',
    capabilities: ['oauth_connect', 'publish', 'schedule', 'media_upload', 'analytics', 'webhook'],
    meterUnits: ['oauth_connect', 'publish', 'schedule', 'media_upload', 'analytics_pull', 'webhook_delivery', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_meta_facebook',
    displayName: 'Facebook / Meta (class example)',
    capabilities: ['oauth_connect', 'publish', 'schedule', 'media_upload', 'analytics', 'inbox', 'webhook'],
    meterUnits: ['oauth_connect', 'publish', 'schedule', 'media_upload', 'analytics_pull', 'inbox_action', 'webhook_delivery', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_linkedin',
    displayName: 'LinkedIn (class example)',
    capabilities: ['oauth_connect', 'publish', 'schedule', 'media_upload', 'analytics', 'webhook'],
    meterUnits: ['oauth_connect', 'publish', 'schedule', 'media_upload', 'analytics_pull', 'webhook_delivery', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_threads',
    displayName: 'Threads (class example)',
    capabilities: ['oauth_connect', 'publish', 'schedule', 'analytics', 'webhook'],
    meterUnits: ['oauth_connect', 'publish', 'schedule', 'analytics_pull', 'webhook_delivery', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_bluesky',
    displayName: 'Bluesky (class example)',
    capabilities: ['oauth_connect', 'publish', 'schedule', 'analytics', 'webhook'],
    meterUnits: ['oauth_connect', 'publish', 'schedule', 'analytics_pull', 'webhook_delivery', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_discord',
    displayName: 'Discord (class example)',
    capabilities: ['oauth_connect', 'publish', 'inbox', 'webhook'],
    meterUnits: ['oauth_connect', 'publish', 'inbox_action', 'webhook_delivery', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_telegram',
    displayName: 'Telegram (class example)',
    capabilities: ['oauth_connect', 'publish', 'inbox', 'webhook'],
    meterUnits: ['oauth_connect', 'publish', 'inbox_action', 'webhook_delivery', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_social_future',
    displayName: 'PLACEHOLDER future social platform (extensible slot)',
    capabilities: ['oauth_connect', 'publish', 'schedule', 'media_upload', 'analytics', 'inbox', 'webhook'],
    meterUnits: ['oauth_connect', 'publish', 'schedule', 'media_upload', 'analytics_pull', 'inbox_action', 'webhook_delivery', 'linked_account', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
];

export function listSocialMediaConnectors(): SocialMediaConnector[] {
  return [...SOCIAL_MEDIA_REGISTRY];
}

const ACTION_TO_CAPABILITY: Record<string, Capability> = {
  oauth_connect: 'social.oauth_connect',
  publish: 'social.publish',
  schedule: 'social.schedule',
  media_upload: 'social.media_upload',
  analytics: 'social.analytics',
  inbox: 'social.inbox',
  webhook: 'social.webhook',
  multi_account: 'social.multi_account',
};

const UNIT_TO_KIND: Partial<
  Record<
    SocialMeterUnit,
    | 'social_oauth'
    | 'social_publish'
    | 'social_schedule'
    | 'social_media_upload'
    | 'social_analytics'
    | 'social_inbox'
    | 'social_webhook'
    | 'social_api_call'
  >
> = {
  oauth_connect: 'social_oauth',
  publish: 'social_publish',
  schedule: 'social_schedule',
  media_upload: 'social_media_upload',
  analytics_pull: 'social_analytics',
  inbox_action: 'social_inbox',
  webhook_delivery: 'social_webhook',
  api_call: 'social_api_call',
  linked_account: 'social_api_call',
};

export async function runSocialAction(input: {
  entitlements: Entitlements;
  connectorId: string;
  action: keyof typeof ACTION_TO_CAPABILITY;
  meterUnit: SocialMeterUnit;
  meterQuantity: number;
  requestId: string;
  apiKeyId?: string | null;
  headers?: Record<string, string | string[] | undefined>;
  environment?: 'sandbox' | 'production';
}): Promise<{ decision: GateDecision; ledgerId?: string }> {
  const circuit = assertCircuitClosed();
  const byok = resolveByokFromHeaders(input.headers ?? {});

  if (!circuit.ok && byok.mode === 'platform_managed') {
    return {
      decision: {
        allow: false,
        status: 402,
        code: 'circuit_breaker_open',
        message:
          circuit.state.reason ??
          'Platform-managed social spend paused by circuit breaker.',
      },
    };
  }

  const capability = ACTION_TO_CAPABILITY[input.action];
  const decision = authorize(input.entitlements, capability, {
    connectorId: input.connectorId,
    meterUnit: input.meterUnit,
    meterQuantity: input.meterQuantity,
    environment: input.environment,
  });

  if (!decision.allow) return { decision };

  const kind = UNIT_TO_KIND[input.meterUnit] ?? 'social_api_call';

  const entry = await recordUsage({
    accountId: input.entitlements.accountId,
    apiKeyId: input.apiKeyId ?? null,
    requestId: input.requestId,
    kind,
    provider: input.connectorId,
    modelOrConnector: input.connectorId,
    billingMode: byok.mode,
    inputUnits: null,
    outputUnits: null,
    meterUnit: input.meterUnit,
    meterQuantity: input.meterQuantity,
    customerCharge: null,
    providerCostEstimate: null,
    tax: null,
    stripeFees: null,
    reserve: null,
    platformMargin: null,
    currency: null,
    metadata: {
      action: input.action,
      category: 'social_media',
      byok: byok.enabled,
      scaffold: true,
      note: 'Stripe does not pay Meta/TikTok/X/etc. directly. BYOK = customer app credentials; platform-managed = Crystal OAuth apps.',
    },
  });

  return { decision, ledgerId: entry.id };
}

export function socialEntitlementsForTier(
  tierId: TierId,
  accountId: string,
  extras?: Omit<Parameters<typeof buildEntitlements>[0], 'tierId' | 'accountId'>,
): Entitlements {
  return buildEntitlements({ tierId, accountId, ...extras });
}
