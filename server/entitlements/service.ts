/**
 * Central entitlement service — ONE gate for EVERYTHING:
 * inference, creation platforms, social media, MCP servers, APIs,
 * generic connectors, developer tooling, and automation.
 *
 * Product rule: any capability that spends money, burns quota, or grants access
 * must go through this service. No bypass for MCP tools, REST/GraphQL/gRPC,
 * webhooks, SDKs, CLIs, or third-party connectors.
 *
 * Deny-by-default for unregistered / unknown capabilities.
 */

import type {
  ApiMeterUnit,
  AutomationMeterUnit,
  Capability,
  ConnectorMeterUnit,
  CreationMeterUnit,
  DeveloperMeterUnit,
  Entitlements,
  GateDecision,
  McpMeterUnit,
  SocialMeterUnit,
  TierId,
} from '../lib/types.js';
import { isFreeTierId } from '../lib/tiers.js';

export function buildEntitlements(input: {
  tierId: TierId;
  accountId: string;
  softLocked?: boolean;
  usedInferenceUnits?: number;
  includedInferenceUnits?: number | null;
  creationUsed?: Partial<Record<CreationMeterUnit, number>>;
  creationIncluded?: Partial<Record<CreationMeterUnit, number | null>>;
  allowedCreationConnectorIds?: string[];
  socialUsed?: Partial<Record<SocialMeterUnit, number>>;
  socialIncluded?: Partial<Record<SocialMeterUnit, number | null>>;
  allowedSocialConnectorIds?: string[];
  mcpUsed?: Partial<Record<McpMeterUnit, number>>;
  mcpIncluded?: Partial<Record<McpMeterUnit, number | null>>;
  allowedMcpConnectorIds?: string[];
  apiUsed?: Partial<Record<ApiMeterUnit, number>>;
  apiIncluded?: Partial<Record<ApiMeterUnit, number | null>>;
  allowedApiConnectorIds?: string[];
  connectorUsed?: Partial<Record<ConnectorMeterUnit, number>>;
  connectorIncluded?: Partial<Record<ConnectorMeterUnit, number | null>>;
  allowedConnectorIds?: string[];
  allowedConnectorTypes?: string[];
  developerUsed?: Partial<Record<DeveloperMeterUnit, number>>;
  developerIncluded?: Partial<Record<DeveloperMeterUnit, number | null>>;
  automationUsed?: Partial<Record<AutomationMeterUnit, number>>;
  automationIncluded?: Partial<Record<AutomationMeterUnit, number | null>>;
  allowedAutomationConnectorIds?: string[];
  overagePolicy?: 'hard_cap' | 'metered';
}): Entitlements {
  const isFree = isFreeTierId(input.tierId);
  const overage = input.overagePolicy ?? 'hard_cap';

  return {
    tierId: input.tierId,
    accountId: input.accountId,
    softLocked: input.softLocked ?? false,
    inference: {
      includedUnits: input.includedInferenceUnits ?? null,
      usedUnits: input.usedInferenceUnits ?? 0,
      rpm: null,
      tpm: null,
      concurrency: null,
      overagePolicy: overage,
      allowedModels: [],
    },
    connections: {
      maxConnectors: null,
      productionKeysAllowed: !isFree,
      sandboxOnly: isFree,
      webhooksAllowed: !isFree,
      maxWebhookEndpoints: null,
      productionPromoteAllowed: !isFree,
    },
    creationPlatforms: {
      enabled: true,
      maxCount: null,
      allowedConnectorIds: input.allowedCreationConnectorIds ?? [],
      sandboxOnly: isFree,
      productionAccess: !isFree,
      webhooksAllowed: !isFree,
      exportsAllowed: !isFree,
      included: input.creationIncluded ?? {
        generation: null,
        render_minute: null,
        export: null,
        storage_gb: null,
        api_call: null,
      },
      used: input.creationUsed ?? {},
      overagePolicy: overage,
    },
    socialMedia: {
      enabled: true,
      maxCount: null,
      allowedConnectorIds: input.allowedSocialConnectorIds ?? [],
      sandboxOnly: isFree,
      productionAccess: !isFree,
      webhooksAllowed: !isFree,
      maxLinkedAccounts: null,
      teamSeats: null,
      logRetentionDays: null,
      autoPostingAllowed: !isFree,
      included: input.socialIncluded ?? {
        oauth_connect: null,
        publish: null,
        schedule: null,
        media_upload: null,
        analytics_pull: null,
        inbox_action: null,
        webhook_delivery: null,
        linked_account: null,
        api_call: null,
      },
      used: input.socialUsed ?? {},
      overagePolicy: overage,
    },
    mcpServers: {
      enabled: true,
      maxCount: null,
      allowedConnectorIds: input.allowedMcpConnectorIds ?? [],
      sandboxOnly: isFree,
      productionAccess: !isFree,
      webhooksAllowed: !isFree,
      included: input.mcpIncluded ?? {
        tool_call: null,
        resource_read: null,
        prompt_get: null,
        session: null,
      },
      used: input.mcpUsed ?? {},
      overagePolicy: overage,
    },
    apis: {
      enabled: true,
      maxCount: null,
      allowedConnectorIds: input.allowedApiConnectorIds ?? [],
      sandboxOnly: isFree,
      productionAccess: !isFree,
      webhooksAllowed: !isFree,
      firstPartyAllowed: true,
      thirdPartyAllowed: !isFree ? true : true,
      included: input.apiIncluded ?? {
        http_call: null,
        graphql_call: null,
        grpc_call: null,
        request: null,
      },
      used: input.apiUsed ?? {},
      overagePolicy: overage,
    },
    connectors: {
      enabled: true,
      maxCount: null,
      allowedConnectorIds: input.allowedConnectorIds ?? [],
      allowedTypes: input.allowedConnectorTypes ?? [
        'crm',
        'email',
        'calendar',
        'storage',
        'payments',
        'analytics',
        'other',
      ],
      sandboxOnly: isFree,
      productionAccess: !isFree,
      webhooksAllowed: !isFree,
      included: input.connectorIncluded ?? {
        invoke: null,
        sync: null,
        webhook_delivery: null,
        api_call: null,
      },
      used: input.connectorUsed ?? {},
      overagePolicy: overage,
    },
    developer: {
      enabled: true,
      maxCount: null,
      allowedConnectorIds: [],
      sandboxOnly: isFree,
      productionAccess: !isFree,
      webhooksAllowed: !isFree,
      maxApiKeys: null,
      maxEnvironments: null,
      teamSeats: null,
      logRetentionDays: null,
      rpm: null,
      productionKeysAllowed: !isFree,
      productionPromoteAllowed: !isFree,
      sdkAllowed: true,
      included: input.developerIncluded ?? {
        api_key: null,
        environment: null,
        webhook_endpoint: null,
        sdk_call: null,
        team_seat: null,
        log_retention_day: null,
        rate_limit_burst: null,
      },
      used: input.developerUsed ?? {},
      overagePolicy: overage,
    },
    automation: {
      enabled: true,
      maxCount: null,
      allowedConnectorIds: input.allowedAutomationConnectorIds ?? [],
      sandboxOnly: isFree,
      productionAccess: !isFree,
      webhooksAllowed: !isFree,
      maxScheduledJobs: null,
      maxConcurrentAgents: null,
      retriesAllowed: !isFree,
      included: input.automationIncluded ?? {
        scheduled_run: null,
        agent_run: null,
        workflow_run: null,
        retry: null,
      },
      used: input.automationUsed ?? {},
      overagePolicy: overage,
    },
  };
}

function exhausted(
  used: number,
  included: number | null,
  policy: 'hard_cap' | 'metered',
): boolean {
  if (included === null) return false;
  if (policy === 'metered') return false;
  return used >= included;
}

export type GateOpts = {
  connectorId?: string;
  connectorType?: string;
  meterUnit?:
    | CreationMeterUnit
    | SocialMeterUnit
    | McpMeterUnit
    | ApiMeterUnit
    | ConnectorMeterUnit
    | DeveloperMeterUnit
    | AutomationMeterUnit;
  meterQuantity?: number;
  model?: string;
  environment?: 'sandbox' | 'production';
  apiKind?: 'first_party' | 'third_party';
};

/**
 * Authorize a capability against entitlements.
 * Free exhausted → reject; paid entitled → allow (scaffold defaults).
 * Unknown / unregistered capability → deny by default.
 */
export function authorize(
  entitlements: Entitlements,
  capability: Capability | string,
  opts?: GateOpts,
): GateDecision {
  if (entitlements.softLocked) {
    return {
      allow: false,
      status: 402,
      code: 'account_soft_locked',
      message: 'Account entitlements paused (payment failure or risk lock).',
    };
  }

  switch (capability) {
    case 'inference': {
      if (
        exhausted(
          entitlements.inference.usedUnits,
          entitlements.inference.includedUnits,
          entitlements.inference.overagePolicy,
        )
      ) {
        return {
          allow: false,
          status: 429,
          code: 'inference_allowance_exhausted',
          message:
            'Inference allowance exhausted. Upgrade or wait for period reset.',
        };
      }
      if (
        opts?.model &&
        entitlements.inference.allowedModels.length > 0 &&
        !entitlements.inference.allowedModels.includes(opts.model)
      ) {
        return {
          allow: false,
          status: 403,
          code: 'model_not_entitled',
          message: 'Model not allowed on this tier.',
        };
      }
      return { allow: true };
    }

    case 'key.issue': {
      if (
        opts?.environment === 'production' &&
        !(
          entitlements.connections.productionKeysAllowed &&
          entitlements.developer.productionKeysAllowed
        )
      ) {
        return {
          allow: false,
          status: 403,
          code: 'production_keys_not_allowed',
          message: 'Free tier is sandbox/dev keys only.',
        };
      }
      return authorizeDeveloperMeter(entitlements, 'api_key', opts);
    }

    case 'webhook.register':
    case 'webhook.deliver': {
      if (
        !entitlements.connections.webhooksAllowed ||
        !entitlements.developer.webhooksAllowed
      ) {
        return {
          allow: false,
          status: 403,
          code: 'webhooks_not_allowed',
          message: 'Webhooks require a paid tier on this scaffold.',
        };
      }
      return { allow: true };
    }

    case 'environment.promote': {
      if (
        !entitlements.connections.productionPromoteAllowed ||
        !entitlements.developer.productionPromoteAllowed
      ) {
        return {
          allow: false,
          status: 403,
          code: 'promote_not_allowed',
          message: 'Production promote requires paid entitlements.',
        };
      }
      return { allow: true };
    }

    case 'developer.sdk':
    case 'developer.team_seat':
    case 'developer.log_retention': {
      return authorizeDeveloper(entitlements, capability, opts);
    }

    case 'creation.generate':
    case 'creation.render':
    case 'creation.export':
    case 'creation.webhook': {
      return authorizeCreation(entitlements, capability, opts);
    }

    case 'social.oauth_connect':
    case 'social.publish':
    case 'social.schedule':
    case 'social.media_upload':
    case 'social.analytics':
    case 'social.inbox':
    case 'social.webhook':
    case 'social.multi_account': {
      return authorizeSocial(entitlements, capability, opts);
    }

    case 'mcp.tool_call':
    case 'mcp.resource_read':
    case 'mcp.prompt_get': {
      return authorizeMcp(entitlements, capability, opts);
    }

    case 'api.http':
    case 'api.graphql':
    case 'api.grpc': {
      return authorizeApi(entitlements, capability, opts);
    }

    case 'connector.create':
    case 'connector.run':
    case 'connector.invoke':
    case 'connector.sync': {
      return authorizeConnector(entitlements, capability, opts);
    }

    case 'automation.schedule':
    case 'automation.agent_run':
    case 'automation.workflow':
    case 'automation.retry': {
      return authorizeAutomation(entitlements, capability, opts);
    }

    default:
      return {
        allow: false,
        status: 403,
        code: 'unknown_capability',
        message:
          'Capability not registered. Deny-by-default: register the capability and catalog entry, then entitle it.',
      };
  }
}

function checkCategoryAccess(
  block: {
    enabled: boolean;
    productionAccess: boolean;
    allowedConnectorIds: string[];
  },
  opts: GateOpts | undefined,
  codes: { disabled: string; production: string; notEntitled: string },
  label: string,
): GateDecision | null {
  if (!block.enabled) {
    return {
      allow: false,
      status: 403,
      code: codes.disabled,
      message: `${label} are disabled for this account.`,
    };
  }
  if (opts?.environment === 'production' && !block.productionAccess) {
    return {
      allow: false,
      status: 403,
      code: codes.production,
      message: `Free tier: sandbox/dev ${label.toLowerCase()} only. Paid unlocks production.`,
    };
  }
  if (
    opts?.connectorId &&
    block.allowedConnectorIds.length > 0 &&
    !block.allowedConnectorIds.includes(opts.connectorId)
  ) {
    return {
      allow: false,
      status: 403,
      code: codes.notEntitled,
      message: `Not in this tier’s allowed ${label.toLowerCase()} catalog.`,
    };
  }
  return null;
}

function authorizeCreation(
  entitlements: Entitlements,
  capability: Capability,
  opts?: GateOpts,
): GateDecision {
  const cp = entitlements.creationPlatforms;
  const denied = checkCategoryAccess(
    cp,
    opts,
    {
      disabled: 'creation_platforms_disabled',
      production: 'creation_production_not_allowed',
      notEntitled: 'creation_connector_not_entitled',
    },
    'Creation platforms',
  );
  if (denied) return denied;

  if (capability === 'creation.export' && !cp.exportsAllowed) {
    return {
      allow: false,
      status: 403,
      code: 'creation_exports_not_allowed',
      message: 'Exports require paid creation-platform entitlements.',
    };
  }

  if (capability === 'creation.webhook' && !cp.webhooksAllowed) {
    return {
      allow: false,
      status: 403,
      code: 'creation_webhooks_not_allowed',
      message: 'Creation webhooks require paid entitlements.',
    };
  }

  return checkMeter(
    cp,
    opts?.meterUnit as CreationMeterUnit | undefined,
    opts?.meterQuantity ?? 1,
    'creation_allowance_exhausted',
    'Creation platform',
  );
}

function authorizeSocial(
  entitlements: Entitlements,
  capability: Capability,
  opts?: GateOpts,
): GateDecision {
  const sm = entitlements.socialMedia;
  const denied = checkCategoryAccess(
    sm,
    opts,
    {
      disabled: 'social_media_disabled',
      production: 'social_production_not_allowed',
      notEntitled: 'social_connector_not_entitled',
    },
    'Social media connectors',
  );
  if (denied) return denied;

  if (capability === 'social.webhook' && !sm.webhooksAllowed) {
    return {
      allow: false,
      status: 403,
      code: 'social_webhooks_not_allowed',
      message: 'Social engagement webhooks require paid entitlements.',
    };
  }

  if (
    (capability === 'social.publish' || capability === 'social.schedule') &&
    !sm.autoPostingAllowed &&
    opts?.environment === 'production'
  ) {
    return {
      allow: false,
      status: 403,
      code: 'social_autopost_not_allowed',
      message:
        'Free tier: no uncapped auto-posting. Upgrade for production publish/schedule.',
    };
  }

  return checkMeter(
    sm,
    opts?.meterUnit as SocialMeterUnit | undefined,
    opts?.meterQuantity ?? 1,
    'social_allowance_exhausted',
    'Social media',
  );
}

function authorizeMcp(
  entitlements: Entitlements,
  _capability: Capability,
  opts?: GateOpts,
): GateDecision {
  const mcp = entitlements.mcpServers;
  const denied = checkCategoryAccess(
    mcp,
    opts,
    {
      disabled: 'mcp_servers_disabled',
      production: 'mcp_production_not_allowed',
      notEntitled: 'mcp_connector_not_entitled',
    },
    'MCP servers',
  );
  if (denied) return denied;

  return checkMeter(
    mcp,
    opts?.meterUnit as McpMeterUnit | undefined,
    opts?.meterQuantity ?? 1,
    'mcp_allowance_exhausted',
    'MCP',
  );
}

function authorizeApi(
  entitlements: Entitlements,
  _capability: Capability,
  opts?: GateOpts,
): GateDecision {
  const apis = entitlements.apis;
  const denied = checkCategoryAccess(
    apis,
    opts,
    {
      disabled: 'apis_disabled',
      production: 'api_production_not_allowed',
      notEntitled: 'api_connector_not_entitled',
    },
    'APIs',
  );
  if (denied) return denied;

  if (opts?.apiKind === 'third_party' && !apis.thirdPartyAllowed) {
    return {
      allow: false,
      status: 403,
      code: 'third_party_api_not_allowed',
      message: 'Third-party API calls are not entitled on this account.',
    };
  }

  return checkMeter(
    apis,
    opts?.meterUnit as ApiMeterUnit | undefined,
    opts?.meterQuantity ?? 1,
    'api_allowance_exhausted',
    'API',
  );
}

function authorizeConnector(
  entitlements: Entitlements,
  capability: Capability,
  opts?: GateOpts,
): GateDecision {
  const c = entitlements.connectors;
  const denied = checkCategoryAccess(
    c,
    opts,
    {
      disabled: 'connectors_disabled',
      production: 'connector_production_not_allowed',
      notEntitled: 'connector_not_entitled',
    },
    'Connectors',
  );
  if (denied) return denied;

  if (
    opts?.connectorType &&
    c.allowedTypes.length > 0 &&
    !c.allowedTypes.includes(opts.connectorType)
  ) {
    return {
      allow: false,
      status: 403,
      code: 'connector_type_not_entitled',
      message: 'Connector type not allowed on this tier.',
    };
  }

  if (
    (capability === 'connector.sync' || capability === 'connector.invoke') &&
    opts?.environment === 'production' &&
    !c.webhooksAllowed &&
    capability === ('connector.webhook' as Capability)
  ) {
    // no-op; webhooks checked separately when meter is webhook_delivery
  }

  return checkMeter(
    c,
    opts?.meterUnit as ConnectorMeterUnit | undefined,
    opts?.meterQuantity ?? 1,
    'connector_allowance_exhausted',
    'Connector',
  );
}

function authorizeDeveloper(
  entitlements: Entitlements,
  capability: Capability,
  opts?: GateOpts,
): GateDecision {
  const d = entitlements.developer;
  if (!d.enabled) {
    return {
      allow: false,
      status: 403,
      code: 'developer_disabled',
      message: 'Developer tooling is disabled for this account.',
    };
  }

  if (capability === 'developer.sdk' && !d.sdkAllowed) {
    return {
      allow: false,
      status: 403,
      code: 'sdk_not_allowed',
      message: 'SDK usage not entitled.',
    };
  }

  const unit: DeveloperMeterUnit | undefined =
    capability === 'developer.sdk'
      ? 'sdk_call'
      : capability === 'developer.team_seat'
        ? 'team_seat'
        : capability === 'developer.log_retention'
          ? 'log_retention_day'
          : (opts?.meterUnit as DeveloperMeterUnit | undefined);

  return checkMeter(
    d,
    unit ?? (opts?.meterUnit as DeveloperMeterUnit | undefined),
    opts?.meterQuantity ?? 1,
    'developer_allowance_exhausted',
    'Developer',
  );
}

function authorizeDeveloperMeter(
  entitlements: Entitlements,
  unit: DeveloperMeterUnit,
  opts?: GateOpts,
): GateDecision {
  return checkMeter(
    entitlements.developer,
    unit,
    opts?.meterQuantity ?? 1,
    'developer_allowance_exhausted',
    'Developer',
  );
}

function authorizeAutomation(
  entitlements: Entitlements,
  capability: Capability,
  opts?: GateOpts,
): GateDecision {
  const a = entitlements.automation;
  const denied = checkCategoryAccess(
    a,
    opts,
    {
      disabled: 'automation_disabled',
      production: 'automation_production_not_allowed',
      notEntitled: 'automation_connector_not_entitled',
    },
    'Automation',
  );
  if (denied) return denied;

  if (capability === 'automation.retry' && !a.retriesAllowed) {
    return {
      allow: false,
      status: 403,
      code: 'automation_retries_not_allowed',
      message: 'Retries require paid automation entitlements on this scaffold.',
    };
  }

  return checkMeter(
    a,
    opts?.meterUnit as AutomationMeterUnit | undefined,
    opts?.meterQuantity ?? 1,
    'automation_allowance_exhausted',
    'Automation',
  );
}

function checkMeter(
  block: {
    included: Partial<Record<string, number | null>>;
    used: Partial<Record<string, number>>;
    overagePolicy: 'hard_cap' | 'metered';
  },
  unit: string | undefined,
  qty: number,
  code: string,
  label: string,
): GateDecision {
  if (unit) {
    const included = block.included[unit] ?? null;
    const used = block.used[unit] ?? 0;
    if (exhausted(used + qty - 1, included, block.overagePolicy)) {
      return {
        allow: false,
        status: 429,
        code,
        message: `${label} ${unit} allowance exhausted (hard cap).`,
      };
    }
  }
  return { allow: true };
}
