/**
 * Pluggable creation-platform connectors.
 * Class covers music generation, video edit/export, image gen, design tools, voice, etc.
 * Named examples of the class: Suno, CapCut — catalog is curated by Crystal, not hardcoded to two IDs.
 */

import type { BillingMode, CreationMeterUnit } from '../lib/types.js';
import { recordUsage } from '../metering/usageLedger.js';
import { authorize, buildEntitlements } from '../entitlements/service.js';
import type { Entitlements, GateDecision, TierId } from '../lib/types.js';
import { assertCircuitClosed } from '../billing/circuitBreaker.js';
import { resolveByokFromHeaders } from '../byok/index.js';

export interface CreationPlatformConnector {
  connectorId: string;
  displayName: string;
  capabilities: string[];
  meterUnits: CreationMeterUnit[];
  billingModes: BillingMode[];
}

/** Scaffold registry — PLACEHOLDER ids until Crystal fills config/tiers.example.json catalog. */
export const CREATION_PLATFORM_REGISTRY: CreationPlatformConnector[] = [
  {
    connectorId: 'PLACEHOLDER_music_provider',
    displayName: 'Music generation (Suno-class)',
    capabilities: ['generate', 'export'],
    meterUnits: ['generation', 'export', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_video_provider',
    displayName: 'Video edit/export (CapCut-class)',
    capabilities: ['edit', 'render', 'export', 'webhook'],
    meterUnits: ['render_minute', 'export', 'storage_gb', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_image_provider',
    displayName: 'Image generation',
    capabilities: ['generate', 'export'],
    meterUnits: ['generation', 'export', 'storage_gb', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_design_provider',
    displayName: 'Design tools',
    capabilities: ['edit', 'export'],
    meterUnits: ['api_call', 'export', 'storage_gb'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_voice_provider',
    displayName: 'Voice / TTS',
    capabilities: ['generate', 'export'],
    meterUnits: ['generation', 'api_call', 'storage_gb'],
    billingModes: ['platform_managed', 'byok'],
  },
];

export function listCreationPlatforms(): CreationPlatformConnector[] {
  return [...CREATION_PLATFORM_REGISTRY];
}

export async function runCreationAction(input: {
  entitlements: Entitlements;
  connectorId: string;
  action: 'generate' | 'render' | 'export' | 'webhook';
  meterUnit: CreationMeterUnit;
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
          'Platform-managed creation spend paused by circuit breaker.',
      },
    };
  }

  const capability =
    input.action === 'generate'
      ? 'creation.generate'
      : input.action === 'render'
        ? 'creation.render'
        : input.action === 'export'
          ? 'creation.export'
          : 'creation.webhook';

  const decision = authorize(input.entitlements, capability, {
    connectorId: input.connectorId,
    meterUnit: input.meterUnit,
    meterQuantity: input.meterQuantity,
    environment: input.environment,
  });

  if (!decision.allow) return { decision };

  const kind =
    input.meterUnit === 'generation'
      ? 'creation_generation'
      : input.meterUnit === 'render_minute'
        ? 'creation_render'
        : input.meterUnit === 'export'
          ? 'creation_export'
          : input.meterUnit === 'storage_gb'
            ? 'creation_storage'
            : 'creation_api_call';

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
      byok: byok.enabled,
      scaffold: true,
      note: 'Provider cost / customer charge null until Crystal cost tables exist. Stripe does not pay creation platforms directly.',
    },
  });

  return { decision, ledgerId: entry.id };
}

export function entitlementsForTier(
  tierId: TierId,
  accountId: string,
  extras?: Omit<Parameters<typeof buildEntitlements>[0], 'tierId' | 'accountId'>,
): Entitlements {
  return buildEntitlements({
    tierId,
    accountId,
    ...extras,
  });
}
