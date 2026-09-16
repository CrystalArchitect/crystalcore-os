/**
 * Shared types for API tiers scaffold.
 * Numeric commercial fields are intentionally optional / nullable — Crystal fills real values.
 */

export type TierId = 'free' | 'paid';

export type Capability =
  | 'inference'
  | 'connector.create'
  | 'connector.run'
  | 'webhook.register'
  | 'webhook.deliver'
  | 'environment.promote'
  | 'key.issue'
  | 'creation.generate'
  | 'creation.render'
  | 'creation.export'
  | 'creation.webhook';

export type ConnectorCategory = 'integrations' | 'creation_platforms';

/** Meter units for creation platforms (music, video, image, design, voice, …). */
export type CreationMeterUnit =
  | 'generation'
  | 'render_minute'
  | 'export'
  | 'storage_gb'
  | 'api_call';

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
  connections: {
    maxConnectors: number | null;
    productionKeysAllowed: boolean;
    sandboxOnly: boolean;
    webhooksAllowed: boolean;
    maxWebhookEndpoints: number | null;
    productionPromoteAllowed: boolean;
  };
  creationPlatforms: {
    enabled: boolean;
    maxCount: number | null;
    allowedConnectorIds: string[];
    sandboxOnly: boolean;
    productionAccess: boolean;
    webhooksAllowed: boolean;
    exportsAllowed: boolean;
    included: Partial<Record<CreationMeterUnit, number | null>>;
    used: Partial<Record<CreationMeterUnit, number>>;
    overagePolicy: OveragePolicy;
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

export interface UsageLedgerEntry {
  id: string;
  accountId: string;
  apiKeyId: string | null;
  requestId: string;
  timestamp: string;
  kind:
    | 'inference'
    | 'connector'
    | 'webhook'
    | 'creation_generation'
    | 'creation_render'
    | 'creation_export'
    | 'creation_storage'
    | 'creation_api_call';
  /** Provider / creation-platform id (e.g. placeholder catalog id). */
  provider: string | null;
  modelOrConnector: string | null;
  billingMode: BillingMode;
  inputUnits: number | null;
  outputUnits: number | null;
  meterUnit: CreationMeterUnit | 'billable_token' | 'request' | null;
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
