/**
 * Shared types for API tiers scaffold.
 * Numeric commercial fields are intentionally optional / nullable — Crystal fills real values.
 *
 * Universal entitlement: any capability that spends money, burns quota, or grants access
 * must go through the central entitlement service. No bypass for MCP, APIs, webhooks,
 * SDKs, CLIs, or third-party connectors.
 */

export type TierId = 'free' | 'paid';

export type Capability =
  | 'inference'
  | 'connector.create'
  | 'connector.run'
  | 'connector.invoke'
  | 'connector.sync'
  | 'webhook.register'
  | 'webhook.deliver'
  | 'environment.promote'
  | 'key.issue'
  | 'creation.generate'
  | 'creation.render'
  | 'creation.export'
  | 'creation.webhook'
  | 'social.oauth_connect'
  | 'social.publish'
  | 'social.schedule'
  | 'social.media_upload'
  | 'social.analytics'
  | 'social.inbox'
  | 'social.webhook'
  | 'social.multi_account'
  | 'mcp.tool_call'
  | 'mcp.resource_read'
  | 'mcp.prompt_get'
  | 'api.http'
  | 'api.graphql'
  | 'api.grpc'
  | 'developer.sdk'
  | 'developer.team_seat'
  | 'developer.log_retention'
  | 'automation.schedule'
  | 'automation.agent_run'
  | 'automation.workflow'
  | 'automation.retry';

/**
 * Catalog categories. Open-ended: unknown future platforms register as connectors
 * with a type + meter units under `connectors` (or a new registered category).
 */
export type ConnectorCategory =
  | 'inference'
  | 'integrations'
  | 'creation_platforms'
  | 'social_media'
  | 'mcp_servers'
  | 'apis'
  | 'connectors'
  | 'developer'
  | 'automation';

/** Meter units for creation platforms (music, video, image, design, voice, …). */
export type CreationMeterUnit =
  | 'generation'
  | 'render_minute'
  | 'export'
  | 'storage_gb'
  | 'api_call';

/** Meter units for social media connectors (extensible catalog). */
export type SocialMeterUnit =
  | 'oauth_connect'
  | 'publish'
  | 'schedule'
  | 'media_upload'
  | 'analytics_pull'
  | 'inbox_action'
  | 'webhook_delivery'
  | 'linked_account'
  | 'api_call';

/** MCP tools / resources / prompts. */
export type McpMeterUnit =
  | 'tool_call'
  | 'resource_read'
  | 'prompt_get'
  | 'session';

/** First-party + third-party HTTP / GraphQL / gRPC. */
export type ApiMeterUnit =
  | 'http_call'
  | 'graphql_call'
  | 'grpc_call'
  | 'request';

/** Generic integration connectors (CRM, email, calendar, storage, payments, analytics, …). */
export type ConnectorMeterUnit =
  | 'invoke'
  | 'sync'
  | 'webhook_delivery'
  | 'api_call';

/** Developer tooling: keys, envs, webhooks, SDK, seats, retention, rate limits. */
export type DeveloperMeterUnit =
  | 'api_key'
  | 'environment'
  | 'webhook_endpoint'
  | 'sdk_call'
  | 'team_seat'
  | 'log_retention_day'
  | 'rate_limit_burst';

/** Scheduled jobs, agents/workflows, retries. */
export type AutomationMeterUnit =
  | 'scheduled_run'
  | 'agent_run'
  | 'workflow_run'
  | 'retry';

export type AnyMeterUnit =
  | CreationMeterUnit
  | SocialMeterUnit
  | McpMeterUnit
  | ApiMeterUnit
  | ConnectorMeterUnit
  | DeveloperMeterUnit
  | AutomationMeterUnit
  | 'billable_token'
  | 'request';

export type BillingMode = 'platform_managed' | 'byok';

export type OveragePolicy = 'hard_cap' | 'metered';

export interface ApiKeyRecord {
  id: string;
  accountId: string;
  /** SHA-256 (or better) hash of the secret; never store plaintext. */
  keyHash: string;
  prefix: string;
  scopes: Capability[];
  environment: 'sandbox' | 'production';
  revokedAt: string | null;
  createdAt: string;
}

export interface CategoryQuotaBlock<TUnit extends string> {
  enabled: boolean;
  maxCount: number | null;
  allowedConnectorIds: string[];
  sandboxOnly: boolean;
  productionAccess: boolean;
  webhooksAllowed: boolean;
  included: Partial<Record<TUnit, number | null>>;
  used: Partial<Record<TUnit, number>>;
  overagePolicy: OveragePolicy;
}

export interface Entitlements {
  tierId: TierId;
  accountId: string;
  softLocked: boolean;
  inference: {
    includedUnits: number | null;
    usedUnits: number;
    rpm: number | null;
    tpm: number | null;
    concurrency: number | null;
    overagePolicy: OveragePolicy;
    allowedModels: string[];
  };
  /** Developer connections (API keys, webhooks, environments) — also mirrored under `developer`. */
  connections: {
    maxConnectors: number | null;
    productionKeysAllowed: boolean;
    sandboxOnly: boolean;
    webhooksAllowed: boolean;
    maxWebhookEndpoints: number | null;
    productionPromoteAllowed: boolean;
  };
  creationPlatforms: CategoryQuotaBlock<CreationMeterUnit> & {
    exportsAllowed: boolean;
  };
  socialMedia: CategoryQuotaBlock<SocialMeterUnit> & {
    maxLinkedAccounts: number | null;
    teamSeats: number | null;
    logRetentionDays: number | null;
    autoPostingAllowed: boolean;
  };
  mcpServers: CategoryQuotaBlock<McpMeterUnit>;
  apis: CategoryQuotaBlock<ApiMeterUnit> & {
    firstPartyAllowed: boolean;
    thirdPartyAllowed: boolean;
  };
  /** Generic integration connectors (CRM, email, calendar, storage, payments, analytics, …). */
  connectors: CategoryQuotaBlock<ConnectorMeterUnit> & {
    allowedTypes: string[];
  };
  developer: CategoryQuotaBlock<DeveloperMeterUnit> & {
    maxApiKeys: number | null;
    maxEnvironments: number | null;
    teamSeats: number | null;
    logRetentionDays: number | null;
    rpm: number | null;
    productionKeysAllowed: boolean;
    productionPromoteAllowed: boolean;
    sdkAllowed: boolean;
  };
  automation: CategoryQuotaBlock<AutomationMeterUnit> & {
    maxScheduledJobs: number | null;
    maxConcurrentAgents: number | null;
    retriesAllowed: boolean;
  };
}

export type GateDecision =
  | { allow: true }
  | {
      allow: false;
      status: 402 | 403 | 429;
      code: string;
      message: string;
    };

export type UsageLedgerKind =
  | 'inference'
  | 'connector'
  | 'webhook'
  | 'creation_generation'
  | 'creation_render'
  | 'creation_export'
  | 'creation_storage'
  | 'creation_api_call'
  | 'social_oauth'
  | 'social_publish'
  | 'social_schedule'
  | 'social_media_upload'
  | 'social_analytics'
  | 'social_inbox'
  | 'social_webhook'
  | 'social_api_call'
  | 'mcp_tool_call'
  | 'mcp_resource_read'
  | 'mcp_prompt_get'
  | 'mcp_session'
  | 'api_http'
  | 'api_graphql'
  | 'api_grpc'
  | 'api_request'
  | 'connector_invoke'
  | 'connector_sync'
  | 'connector_webhook'
  | 'connector_api_call'
  | 'developer_sdk'
  | 'developer_key'
  | 'developer_webhook'
  | 'developer_seat'
  | 'automation_scheduled'
  | 'automation_agent'
  | 'automation_workflow'
  | 'automation_retry';

export interface UsageLedgerEntry {
  id: string;
  accountId: string;
  apiKeyId: string | null;
  requestId: string;
  timestamp: string;
  kind: UsageLedgerKind;
  /** Provider / connector / MCP / API id (e.g. placeholder catalog id). */
  provider: string | null;
  modelOrConnector: string | null;
  billingMode: BillingMode;
  inputUnits: number | null;
  outputUnits: number | null;
  meterUnit: AnyMeterUnit | null;
  meterQuantity: number | null;
  /** What Stripe would bill the customer (null until Crystal sets prices). */
  customerCharge: number | null;
  /** Estimated provider/platform cost to Crystal (null for BYOK). */
  providerCostEstimate: number | null;
  tax: number | null;
  stripeFees: number | null;
  reserve: number | null;
  platformMargin: number | null;
  currency: string | null;
  metadata: Record<string, unknown>;
}

export interface CircuitBreakerState {
  open: boolean;
  reason: string | null;
  openedAt: string | null;
}
