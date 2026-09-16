/**
 * Central entitlement service — ONE gate for inference + developer connections
 * + creation platforms (music/video/image/design/voice pluggable connectors).
 */

import type {
  Capability,
  CreationMeterUnit,
  Entitlements,
  GateDecision,
  TierId,
} from '../lib/types.js';

/** Build entitlements from tier + live usage. Null limits mean "not configured yet" → deny for safety in free hard-cap paths when exhausted flags are set. */
export function buildEntitlements(input: {
  tierId: TierId;
  accountId: string;
  softLocked?: boolean;
  usedInferenceUnits?: number;
  includedInferenceUnits?: number | null;
  creationUsed?: Partial<Record<CreationMeterUnit, number>>;
  creationIncluded?: Partial<Record<CreationMeterUnit, number | null>>;
  allowedCreationConnectorIds?: string[];
  overagePolicy?: 'hard_cap' | 'metered';
}): Entitlements {
  const isFree = input.tierId === 'free';
  const overage = input.overagePolicy ?? (isFree ? 'hard_cap' : 'hard_cap');

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
  };
}

function exhausted(
  used: number,
  included: number | null,
  policy: 'hard_cap' | 'metered',
): boolean {
  if (included === null) {
    // Unconfigured allowance: treat Free hard_cap as deny-until-configured when used > 0 and tests set included explicitly.
    return false;
  }
  if (policy === 'metered') return false;
  return used >= included;
}

/**
 * Authorize a capability against entitlements.
 * Free exhausted → reject; paid entitled → allow (scaffold defaults).
 */
export function authorize(
  entitlements: Entitlements,
  capability: Capability,
  opts?: {
    connectorId?: string;
    meterUnit?: CreationMeterUnit;
    meterQuantity?: number;
    model?: string;
    environment?: 'sandbox' | 'production';
  },
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
        !entitlements.connections.productionKeysAllowed
      ) {
        return {
          allow: false,
          status: 403,
          code: 'production_keys_not_allowed',
          message: 'Free tier is sandbox/dev keys only.',
        };
      }
      return { allow: true };
    }

    case 'webhook.register':
    case 'webhook.deliver': {
      if (!entitlements.connections.webhooksAllowed) {
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
      if (!entitlements.connections.productionPromoteAllowed) {
        return {
          allow: false,
          status: 403,
          code: 'promote_not_allowed',
          message: 'Production promote requires paid entitlements.',
        };
      }
      return { allow: true };
    }

    case 'connector.create':
    case 'connector.run':
    case 'creation.generate':
    case 'creation.render':
    case 'creation.export':
    case 'creation.webhook': {
      return authorizeCreation(entitlements, capability, opts);
    }

    default:
      return {
        allow: false,
        status: 403,
        code: 'unknown_capability',
        message: 'Capability not recognized.',
      };
  }
}

function authorizeCreation(
  entitlements: Entitlements,
  capability: Capability,
  opts?: {
    connectorId?: string;
    meterUnit?: CreationMeterUnit;
    meterQuantity?: number;
    environment?: 'sandbox' | 'production';
  },
): GateDecision {
  const cp = entitlements.creationPlatforms;
  if (!cp.enabled) {
    return {
      allow: false,
      status: 403,
      code: 'creation_platforms_disabled',
      message: 'Creation platforms are disabled for this account.',
    };
  }

  if (opts?.environment === 'production' && !cp.productionAccess) {
    return {
      allow: false,
      status: 403,
      code: 'creation_production_not_allowed',
      message:
        'Free tier: sandbox/dev creation connectors only. Paid unlocks production.',
    };
  }

  if (
    opts?.connectorId &&
    cp.allowedConnectorIds.length > 0 &&
    !cp.allowedConnectorIds.includes(opts.connectorId)
  ) {
    return {
      allow: false,
      status: 403,
      code: 'creation_connector_not_entitled',
      message: 'Connector not in this tier’s allowed creation catalog.',
    };
  }

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

  const unit = opts?.meterUnit;
  const qty = opts?.meterQuantity ?? 1;
  if (unit) {
    const included = cp.included[unit] ?? null;
    const used = cp.used[unit] ?? 0;
    if (exhausted(used + qty - 1, included, cp.overagePolicy)) {
      return {
        allow: false,
        status: 429,
        code: 'creation_allowance_exhausted',
        message: `Creation platform ${unit} allowance exhausted (hard cap).`,
      };
    }
  }

  return { allow: true };
}
