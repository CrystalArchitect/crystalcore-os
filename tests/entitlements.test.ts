import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  authorize,
  buildEntitlements,
} from '../api/entitlements/service.js';
import { freeTierHardCapGate } from '../api/middleware/freeTierGate.js';
import { quotaGate } from '../api/middleware/quotaGate.js';

describe('entitlement allow/deny', () => {
  it('Free exhausted inference → reject', () => {
    const ent = buildEntitlements({
      tierId: 'free',
      accountId: 'acct_free',
      includedInferenceUnits: 100,
      usedInferenceUnits: 100,
      overagePolicy: 'hard_cap',
    });
    const d = authorize(ent, 'inference');
    assert.equal(d.allow, false);
    if (!d.allow) {
      assert.equal(d.status, 429);
      assert.equal(d.code, 'inference_allowance_exhausted');
    }
  });

  it('Paid entitled inference → allow', () => {
    const ent = buildEntitlements({
      tierId: 'paid',
      accountId: 'acct_paid',
      includedInferenceUnits: 10_000,
      usedInferenceUnits: 50,
      overagePolicy: 'hard_cap',
    });
    const d = authorize(ent, 'inference');
    assert.equal(d.allow, true);
  });

  it('Free sandbox creation generate within cap → allow', () => {
    const ent = buildEntitlements({
      tierId: 'free',
      accountId: 'acct_free',
      allowedCreationConnectorIds: ['PLACEHOLDER_music_provider'],
      creationIncluded: { generation: 5 },
      creationUsed: { generation: 2 },
      overagePolicy: 'hard_cap',
    });
    const d = authorize(ent, 'creation.generate', {
      connectorId: 'PLACEHOLDER_music_provider',
      meterUnit: 'generation',
      meterQuantity: 1,
      environment: 'sandbox',
    });
    assert.equal(d.allow, true);
  });

  it('Free creation generations exhausted → reject', () => {
    const ent = buildEntitlements({
      tierId: 'free',
      accountId: 'acct_free',
      allowedCreationConnectorIds: ['PLACEHOLDER_music_provider'],
      creationIncluded: { generation: 3 },
      creationUsed: { generation: 3 },
      overagePolicy: 'hard_cap',
    });
    const d = freeTierHardCapGate(ent, 'creation.generate', {
      connectorId: 'PLACEHOLDER_music_provider',
      meterUnit: 'generation',
      meterQuantity: 1,
      environment: 'sandbox',
    });
    assert.equal(d.allow, false);
    if (!d.allow) assert.equal(d.code, 'creation_allowance_exhausted');
  });

  it('Free production creation → reject', () => {
    const ent = buildEntitlements({
      tierId: 'free',
      accountId: 'acct_free',
      allowedCreationConnectorIds: ['PLACEHOLDER_video_provider'],
      creationIncluded: { render_minute: 100 },
      creationUsed: { render_minute: 0 },
    });
    const d = authorize(ent, 'creation.render', {
      connectorId: 'PLACEHOLDER_video_provider',
      meterUnit: 'render_minute',
      environment: 'production',
    });
    assert.equal(d.allow, false);
    if (!d.allow) assert.equal(d.code, 'creation_production_not_allowed');
  });

  it('Paid creation export + webhook → allow', () => {
    const ent = buildEntitlements({
      tierId: 'paid',
      accountId: 'acct_paid',
      allowedCreationConnectorIds: [
        'PLACEHOLDER_video_provider',
        'PLACEHOLDER_music_provider',
      ],
      creationIncluded: { export: 50, generation: 50 },
      creationUsed: { export: 1, generation: 1 },
    });
    assert.equal(
      authorize(ent, 'creation.export', {
        connectorId: 'PLACEHOLDER_video_provider',
        meterUnit: 'export',
        environment: 'production',
      }).allow,
      true,
    );
    assert.equal(
      authorize(ent, 'creation.webhook', {
        connectorId: 'PLACEHOLDER_video_provider',
        environment: 'production',
      }).allow,
      true,
    );
  });

  it('Free production API keys → deny via quotaGate', () => {
    const ent = buildEntitlements({
      tierId: 'free',
      accountId: 'acct_free',
    });
    const d = quotaGate(ent, 'key.issue', { environment: 'production' });
    assert.equal(d.allow, false);
    if (!d.allow) assert.equal(d.code, 'production_keys_not_allowed');
  });

  it('soft lock → 402', () => {
    const ent = buildEntitlements({
      tierId: 'paid',
      accountId: 'acct_paid',
      softLocked: true,
      includedInferenceUnits: 1000,
      usedInferenceUnits: 0,
    });
    const d = authorize(ent, 'inference');
    assert.equal(d.allow, false);
    if (!d.allow) {
      assert.equal(d.status, 402);
      assert.equal(d.code, 'account_soft_locked');
    }
  });
});
