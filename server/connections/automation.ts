/**
 * Automation: scheduled jobs, agents/workflows, retries.
 * All automation spend/quota is entitled — agents cannot bypass the gate.
 */

import type {
  AutomationMeterUnit,
  BillingMode,
  UsageLedgerKind,
} from '../lib/types.js';
import { recordUsage } from '../metering/usageLedger.js';
import { authorize, buildEntitlements } from '../entitlements/service.js';
import type { Capability, Entitlements, GateDecision, TierId } from '../lib/types.js';
import { assertCircuitClosed } from '../billing/circuitBreaker.js';
import { resolveByokFromHeaders } from '../byok/index.js';

export interface AutomationConnector {
  connectorId: string;
  displayName: string;
  capabilities: string[];
  meterUnits: AutomationMeterUnit[];
  billingModes: BillingMode[];
}

export const AUTOMATION_REGISTRY: AutomationConnector[] = [
  {
    connectorId: 'PLACEHOLDER_automation_scheduler',
    displayName: 'Scheduled jobs',
    capabilities: ['schedule', 'run'],
    meterUnits: ['scheduled_run', 'retry'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_automation_agent',
    displayName: 'Agents',
    capabilities: ['agent_run'],
    meterUnits: ['agent_run', 'retry'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_automation_workflow',
    displayName: 'Workflows',
    capabilities: ['workflow_run'],
    meterUnits: ['workflow_run', 'retry'],
    billingModes: ['platform_managed', 'byok'],
  },
];

export function listAutomation(): AutomationConnector[] {
  return [...AUTOMATION_REGISTRY];
}

const ACTION_TO_CAPABILITY: Record<string, Capability> = {
  schedule: 'automation.schedule',
  agent_run: 'automation.agent_run',
  workflow: 'automation.workflow',
  retry: 'automation.retry',
};

const UNIT_TO_KIND: Record<AutomationMeterUnit, UsageLedgerKind> = {
  scheduled_run: 'automation_scheduled',
  agent_run: 'automation_agent',
  workflow_run: 'automation_workflow',
  retry: 'automation_retry',
};

export async function runAutomationAction(input: {
  entitlements: Entitlements;
  connectorId: string;
  action: keyof typeof ACTION_TO_CAPABILITY;
  meterUnit: AutomationMeterUnit;
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
          'Platform-managed automation spend paused by circuit breaker.',
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
      category: 'automation',
      byok: byok.enabled,
      scaffold: true,
      note: 'Agents/workflows cannot bypass entitlements. Stripe does not pay automation vendors directly.',
    },
  });

  return { decision, ledgerId: entry.id };
}

export function automationEntitlementsForTier(
  tierId: TierId,
  accountId: string,
  extras?: Omit<Parameters<typeof buildEntitlements>[0], 'tierId' | 'accountId'>,
): Entitlements {
  return buildEntitlements({ tierId, accountId, ...extras });
}
