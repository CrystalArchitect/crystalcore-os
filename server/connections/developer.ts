/**
 * Developer tooling entitlements surface:
 * API keys, environments, webhooks, SDK usage, team seats, log retention, rate limits.
 * All developer access that grants quota or spend goes through central entitlements.
 */

import type {
  BillingMode,
  DeveloperMeterUnit,
  UsageLedgerKind,
} from '../lib/types.js';
import { recordUsage } from '../metering/usageLedger.js';
import { authorize, buildEntitlements } from '../entitlements/service.js';
import type { Capability, Entitlements, GateDecision, TierId } from '../lib/types.js';

export interface DeveloperCapability {
  id: string;
  displayName: string;
  meterUnits: DeveloperMeterUnit[];
  billingModes: BillingMode[];
}

export const DEVELOPER_REGISTRY: DeveloperCapability[] = [
  {
    id: 'PLACEHOLDER_dev_api_keys',
    displayName: 'API keys',
    meterUnits: ['api_key'],
    billingModes: ['platform_managed'],
  },
  {
    id: 'PLACEHOLDER_dev_environments',
    displayName: 'Environments',
    meterUnits: ['environment'],
    billingModes: ['platform_managed'],
  },
  {
    id: 'PLACEHOLDER_dev_webhooks',
    displayName: 'Webhook endpoints',
    meterUnits: ['webhook_endpoint'],
    billingModes: ['platform_managed'],
  },
  {
    id: 'PLACEHOLDER_dev_sdk',
    displayName: 'SDK usage',
    meterUnits: ['sdk_call'],
    billingModes: ['platform_managed'],
  },
  {
    id: 'PLACEHOLDER_dev_team_seats',
    displayName: 'Team seats',
    meterUnits: ['team_seat'],
    billingModes: ['platform_managed'],
  },
  {
    id: 'PLACEHOLDER_dev_log_retention',
    displayName: 'Log retention',
    meterUnits: ['log_retention_day'],
    billingModes: ['platform_managed'],
  },
  {
    id: 'PLACEHOLDER_dev_rate_limits',
    displayName: 'Rate limits',
    meterUnits: ['rate_limit_burst'],
    billingModes: ['platform_managed'],
  },
];

export function listDeveloperCapabilities(): DeveloperCapability[] {
  return [...DEVELOPER_REGISTRY];
}

const ACTION_TO_CAPABILITY: Record<string, Capability> = {
  key_issue: 'key.issue',
  webhook_register: 'webhook.register',
  promote: 'environment.promote',
  sdk: 'developer.sdk',
  team_seat: 'developer.team_seat',
  log_retention: 'developer.log_retention',
};

const UNIT_TO_KIND: Partial<Record<DeveloperMeterUnit, UsageLedgerKind>> = {
  api_key: 'developer_key',
  webhook_endpoint: 'developer_webhook',
  sdk_call: 'developer_sdk',
  team_seat: 'developer_seat',
};

export async function runDeveloperAction(input: {
  entitlements: Entitlements;
  action: keyof typeof ACTION_TO_CAPABILITY;
  meterUnit?: DeveloperMeterUnit;
  meterQuantity?: number;
  requestId: string;
  apiKeyId?: string | null;
  environment?: 'sandbox' | 'production';
}): Promise<{ decision: GateDecision; ledgerId?: string }> {
  const capability = ACTION_TO_CAPABILITY[input.action];
  const decision = authorize(input.entitlements, capability, {
    meterUnit: input.meterUnit,
    meterQuantity: input.meterQuantity ?? 1,
    environment: input.environment,
  });

  if (!decision.allow) return { decision };

  const kind =
    (input.meterUnit && UNIT_TO_KIND[input.meterUnit]) ||
    (input.action === 'sdk'
      ? 'developer_sdk'
      : input.action === 'key_issue'
        ? 'developer_key'
        : 'developer_webhook');

  const entry = await recordUsage({
    accountId: input.entitlements.accountId,
    apiKeyId: input.apiKeyId ?? null,
    requestId: input.requestId,
    kind,
    provider: 'developer',
    modelOrConnector: input.action,
    billingMode: 'platform_managed',
    inputUnits: null,
    outputUnits: null,
    meterUnit: input.meterUnit ?? null,
    meterQuantity: input.meterQuantity ?? 1,
    customerCharge: null,
    providerCostEstimate: null,
    tax: null,
    stripeFees: null,
    reserve: null,
    platformMargin: null,
    currency: null,
    metadata: {
      action: input.action,
      category: 'developer',
      scaffold: true,
      note: 'Developer tooling entitlements — keys, envs, webhooks, SDK, seats, retention, rate limits.',
    },
  });

  return { decision, ledgerId: entry.id };
}

export function developerEntitlementsForTier(
  tierId: TierId,
  accountId: string,
  extras?: Omit<Parameters<typeof buildEntitlements>[0], 'tierId' | 'accountId'>,
): Entitlements {
  return buildEntitlements({ tierId, accountId, ...extras });
}
