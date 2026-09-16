/**
 * Central entitlement service — ONE gate for inference + developer connections
 * + creation platforms + social media (pluggable connector catalogs).
 */

import type {
  Capability,
  CreationMeterUnit,
  Entitlements,
  GateDecision,
  SocialMeterUnit,
  TierId,
} from '../lib/types.js';

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
  overagePolicy?: 'hard_cap' | 'metered';
}): Entitlements {
  const isFree = input.tierId === 'free';
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
      /** Free: no uncapped auto-posting that burns platform/provider cost. */
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

type GateOpts = {
  connectorId?: string;
  meterUnit?: CreationMeterUnit | SocialMeterUnit;
  meterQuantity?: number;
  model?: string;
  environment?: 'sandbox' | 'production';
};

/**
 * Authorize a capability against entitlements.
 * Free exhausted → reject; paid entitled → allow (scaffold defaults).
 */
export function authorize(
  entitlements: Entitlements,
  capability: Capability,
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
  opts?: GateOpts,
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

  const unit = opts?.meterUnit as CreationMeterUnit | undefined;
  const qty = opts?.meterQuantity ?? 1;
  if (unit && unit in (cp.included as object)) {
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

function authorizeSocial(
  entitlements: Entitlements,
  capability: Capability,
  opts?: GateOpts,
): GateDecision {
  const sm = entitlements.socialMedia;
  if (!sm.enabled) {
    return {
      allow: false,
      status: 403,
      code: 'social_media_disabled',
      message: 'Social media connectors are disabled for this account.',
    };
  }

  if (opts?.environment === 'production' && !sm.productionAccess) {
    return {
      allow: false,
      status: 403,
      code: 'social_production_not_allowed',
      message:
        'Free tier: sandbox/limited social linking only. Paid unlocks production.',
    };
  }

  if (
    opts?.connectorId &&
    sm.allowedConnectorIds.length > 0 &&
    !sm.allowedConnectorIds.includes(opts.connectorId)
  ) {
    return {
      allow: false,
      status: 403,
      code: 'social_connector_not_entitled',
      message: 'Social platform not in this tier’s allowed catalog.',
    };
  }

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

  const unit = opts?.meterUnit as SocialMeterUnit | undefined;
  const qty = opts?.meterQuantity ?? 1;
  if (unit) {
    const included = sm.included[unit] ?? null;
    const used = sm.used[unit] ?? 0;
    if (exhausted(used + qty - 1, included, sm.overagePolicy)) {
      return {
        allow: false,
        status: 429,
        code: 'social_allowance_exhausted',
        message: `Social media ${unit} allowance exhausted (hard cap).`,
      };
    }
  }

  return { allow: true };
}
