/**
 * Generic integration connectors (CRM, email, calendar, storage, payments, analytics, …).
 * Open-ended catalog: unknown future platforms register with a type + meter units.
 * All invokes/syncs/webhooks go through central entitlements.
 */

import type {
  BillingMode,
  ConnectorMeterUnit,
  UsageLedgerKind,
} from '../lib/types.js';
import { recordUsage } from '../metering/usageLedger.js';
import { authorize, buildEntitlements } from '../entitlements/service.js';
import type { Capability, Entitlements, GateDecision, TierId } from '../lib/types.js';
import { assertCircuitClosed } from '../billing/circuitBreaker.js';
import { resolveByokFromHeaders } from '../byok/index.js';

export type ConnectorType =
  | 'crm'
  | 'email'
  | 'calendar'
  | 'storage'
  | 'payments'
  | 'analytics'
  | 'other';

export interface GenericConnector {
  connectorId: string;
  displayName: string;
  connectorType: ConnectorType;
  capabilities: string[];
  meterUnits: ConnectorMeterUnit[];
  billingModes: BillingMode[];
}

export const CONNECTORS_REGISTRY: GenericConnector[] = [
  {
    connectorId: 'PLACEHOLDER_connector_crm',
    displayName: 'CRM-class',
    connectorType: 'crm',
    capabilities: ['invoke', 'sync', 'webhook'],
    meterUnits: ['invoke', 'sync', 'webhook_delivery', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_connector_email',
    displayName: 'Email-class',
    connectorType: 'email',
    capabilities: ['invoke', 'sync', 'webhook'],
    meterUnits: ['invoke', 'sync', 'webhook_delivery', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_connector_calendar',
    displayName: 'Calendar-class',
    connectorType: 'calendar',
    capabilities: ['invoke', 'sync'],
    meterUnits: ['invoke', 'sync', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_connector_storage',
    displayName: 'Storage-class',
    connectorType: 'storage',
    capabilities: ['invoke', 'sync'],
    meterUnits: ['invoke', 'sync', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_connector_payments',
    displayName: 'Payments-class',
    connectorType: 'payments',
    capabilities: ['invoke', 'webhook'],
    meterUnits: ['invoke', 'webhook_delivery', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_connector_analytics',
    displayName: 'Analytics-class',
    connectorType: 'analytics',
    capabilities: ['invoke', 'sync'],
    meterUnits: ['invoke', 'sync', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_connector_future',
    displayName: 'PLACEHOLDER future connector (open-ended)',
    connectorType: 'other',
    capabilities: ['invoke', 'sync', 'webhook'],
    meterUnits: ['invoke', 'sync', 'webhook_delivery', 'api_call'],
    billingModes: ['platform_managed', 'byok'],
  },
];

export function listConnectors(): GenericConnector[] {
  return [...CONNECTORS_REGISTRY];
}

const ACTION_TO_CAPABILITY: Record<string, Capability> = {
  create: 'connector.create',
  run: 'connector.run',
  invoke: 'connector.invoke',
  sync: 'connector.sync',
};

const UNIT_TO_KIND: Record<ConnectorMeterUnit, UsageLedgerKind> = {
  invoke: 'connector_invoke',
  sync: 'connector_sync',
  webhook_delivery: 'connector_webhook',
  api_call: 'connector_api_call',
};

export async function runConnectorAction(input: {
  entitlements: Entitlements;
  connectorId: string;
  connectorType?: ConnectorType;
  action: keyof typeof ACTION_TO_CAPABILITY;
  meterUnit: ConnectorMeterUnit;
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
          'Platform-managed connector spend paused by circuit breaker.',
      },
    };
  }

  const capability = ACTION_TO_CAPABILITY[input.action];
  const decision = authorize(input.entitlements, capability, {
    connectorId: input.connectorId,
    connectorType: input.connectorType,
    meterUnit: input.meterUnit,
    meterQuantity: input.meterQuantity,
    environment: input.environment,
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
      category: 'connectors',
      connectorType: input.connectorType ?? null,
      byok: byok.enabled,
      scaffold: true,
      note: 'Open-ended catalog. Stripe does not pay third-party connector vendors directly.',
    },
  });

  return { decision, ledgerId: entry.id };
}

export function connectorEntitlementsForTier(
  tierId: TierId,
  accountId: string,
  extras?: Omit<Parameters<typeof buildEntitlements>[0], 'tierId' | 'accountId'>,
): Entitlements {
  return buildEntitlements({ tierId, accountId, ...extras });
}
