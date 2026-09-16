/**
 * First-party + third-party HTTP / GraphQL / gRPC API catalog.
 * Every call burns quota / access through central entitlements — no bypass.
 */

import type { ApiMeterUnit, BillingMode, UsageLedgerKind } from '../lib/types.js';
import { recordUsage } from '../metering/usageLedger.js';
import { authorize, buildEntitlements } from '../entitlements/service.js';
import type { Capability, Entitlements, GateDecision, TierId } from '../lib/types.js';
import { assertCircuitClosed } from '../billing/circuitBreaker.js';
import { resolveByokFromHeaders } from '../byok/index.js';

export interface ApiConnector {
  connectorId: string;
  displayName: string;
  apiKind: 'first_party' | 'third_party';
  capabilities: string[];
  meterUnits: ApiMeterUnit[];
  billingModes: BillingMode[];
}

export const APIS_REGISTRY: ApiConnector[] = [
  {
    connectorId: 'PLACEHOLDER_api_first_party',
    displayName: 'First-party CrystalCore API',
    apiKind: 'first_party',
    capabilities: ['http', 'graphql'],
    meterUnits: ['http_call', 'graphql_call', 'request'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_api_third_party_http',
    displayName: 'Third-party HTTP API',
    apiKind: 'third_party',
    capabilities: ['http'],
    meterUnits: ['http_call', 'request'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_api_graphql',
    displayName: 'GraphQL API',
    apiKind: 'third_party',
    capabilities: ['graphql'],
    meterUnits: ['graphql_call', 'request'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_api_grpc',
    displayName: 'gRPC API',
    apiKind: 'third_party',
    capabilities: ['grpc'],
    meterUnits: ['grpc_call', 'request'],
    billingModes: ['platform_managed', 'byok'],
  },
];

export function listApis(): ApiConnector[] {
  return [...APIS_REGISTRY];
}

const ACTION_TO_CAPABILITY: Record<string, Capability> = {
  http: 'api.http',
  graphql: 'api.graphql',
  grpc: 'api.grpc',
};

const UNIT_TO_KIND: Record<ApiMeterUnit, UsageLedgerKind> = {
  http_call: 'api_http',
  graphql_call: 'api_graphql',
  grpc_call: 'api_grpc',
  request: 'api_request',
};

export async function runApiAction(input: {
  entitlements: Entitlements;
  connectorId: string;
  action: keyof typeof ACTION_TO_CAPABILITY;
  meterUnit: ApiMeterUnit;
  meterQuantity: number;
  requestId: string;
  apiKind?: 'first_party' | 'third_party';
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
          'Platform-managed API spend paused by circuit breaker.',
      },
    };
  }

  const capability = ACTION_TO_CAPABILITY[input.action];
  const decision = authorize(input.entitlements, capability, {
    connectorId: input.connectorId,
    meterUnit: input.meterUnit,
    meterQuantity: input.meterQuantity,
    environment: input.environment,
    apiKind: input.apiKind,
  });

  if (!decision.allow) return { decision };

  const entry = await recordUsage({
    accountId: input.entitlements.accountId,
    apiKeyId: input.apiKeyId ?? null,
    requestId: input.requestId,
    kind: UNIT_TO_KIND[input.meterUnit],
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
      category: 'apis',
      apiKind: input.apiKind ?? null,
      byok: byok.enabled,
      scaffold: true,
      note: 'Stripe does not pay third-party API vendors directly. All API calls are entitled.',
    },
  });

  return { decision, ledgerId: entry.id };
}

export function apiEntitlementsForTier(
  tierId: TierId,
  accountId: string,
  extras?: Omit<Parameters<typeof buildEntitlements>[0], 'tierId' | 'accountId'>,
): Entitlements {
  return buildEntitlements({ tierId, accountId, ...extras });
}
