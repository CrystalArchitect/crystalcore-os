/**
 * Pluggable MCP servers catalog.
 * Every tool / resource / prompt invocation is entitled — no bypass.
 * Catalog is open-ended: unknown future MCP servers register with type + meter units.
 */

import type { BillingMode, McpMeterUnit, UsageLedgerKind } from '../lib/types.js';
import { recordUsage } from '../metering/usageLedger.js';
import { authorize, buildEntitlements } from '../entitlements/service.js';
import type { Capability, Entitlements, GateDecision, TierId } from '../lib/types.js';
import { assertCircuitClosed } from '../billing/circuitBreaker.js';
import { resolveByokFromHeaders } from '../byok/index.js';

export interface McpServerConnector {
  connectorId: string;
  displayName: string;
  capabilities: string[];
  meterUnits: McpMeterUnit[];
  billingModes: BillingMode[];
}

export const MCP_SERVERS_REGISTRY: McpServerConnector[] = [
  {
    connectorId: 'PLACEHOLDER_mcp_filesystem',
    displayName: 'MCP filesystem-class',
    capabilities: ['tool_call', 'resource_read'],
    meterUnits: ['tool_call', 'resource_read', 'session'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_mcp_browser',
    displayName: 'MCP browser-class',
    capabilities: ['tool_call', 'resource_read', 'prompt_get'],
    meterUnits: ['tool_call', 'resource_read', 'prompt_get', 'session'],
    billingModes: ['platform_managed', 'byok'],
  },
  {
    connectorId: 'PLACEHOLDER_mcp_future',
    displayName: 'PLACEHOLDER future MCP server (extensible)',
    capabilities: ['tool_call', 'resource_read', 'prompt_get'],
    meterUnits: ['tool_call', 'resource_read', 'prompt_get', 'session'],
    billingModes: ['platform_managed', 'byok'],
  },
];

export function listMcpServers(): McpServerConnector[] {
  return [...MCP_SERVERS_REGISTRY];
}

const ACTION_TO_CAPABILITY: Record<string, Capability> = {
  tool_call: 'mcp.tool_call',
  resource_read: 'mcp.resource_read',
  prompt_get: 'mcp.prompt_get',
};

const UNIT_TO_KIND: Record<McpMeterUnit, UsageLedgerKind> = {
  tool_call: 'mcp_tool_call',
  resource_read: 'mcp_resource_read',
  prompt_get: 'mcp_prompt_get',
  session: 'mcp_session',
};

export async function runMcpAction(input: {
  entitlements: Entitlements;
  connectorId: string;
  action: keyof typeof ACTION_TO_CAPABILITY;
  meterUnit: McpMeterUnit;
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
          'Platform-managed MCP spend paused by circuit breaker.',
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
      category: 'mcp_servers',
      byok: byok.enabled,
      scaffold: true,
      note: 'Stripe does not pay MCP host vendors directly. All MCP invocations are entitled.',
    },
  });

  return { decision, ledgerId: entry.id };
}

export function mcpEntitlementsForTier(
  tierId: TierId,
  accountId: string,
  extras?: Omit<Parameters<typeof buildEntitlements>[0], 'tierId' | 'accountId'>,
): Entitlements {
  return buildEntitlements({ tierId, accountId, ...extras });
}
