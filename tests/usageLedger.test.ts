import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInMemoryUsageLedger,
  setUsageLedger,
  recordUsage,
} from '../api/metering/usageLedger.js';
import { runCreationAction, entitlementsForTier } from '../api/connections/creationPlatforms.js';

describe('usage ledger', () => {
  beforeEach(async () => {
    const store = createInMemoryUsageLedger();
    setUsageLedger(store);
  });

  it('records creation platform generation with null commercial fields', async () => {
    const entry = await recordUsage({
      accountId: 'acct_1',
      apiKeyId: null,
      requestId: 'req_1',
      kind: 'creation_generation',
      provider: 'PLACEHOLDER_music_provider',
      modelOrConnector: 'PLACEHOLDER_music_provider',
      billingMode: 'platform_managed',
      inputUnits: null,
      outputUnits: null,
      meterUnit: 'generation',
      meterQuantity: 1,
      customerCharge: null,
      providerCostEstimate: null,
      tax: null,
      stripeFees: null,
      reserve: null,
      platformMargin: null,
      currency: null,
      metadata: { scaffold: true },
    });
    assert.ok(entry.id);
    assert.equal(entry.customerCharge, null);
    assert.equal(entry.kind, 'creation_generation');
  });

  it('runCreationAction allows paid and writes ledger', async () => {
    const ent = entitlementsForTier('paid', 'acct_paid', {
      allowedCreationConnectorIds: ['PLACEHOLDER_music_provider'],
      creationIncluded: { generation: 10 },
      creationUsed: { generation: 0 },
    });
    const result = await runCreationAction({
      entitlements: ent,
      connectorId: 'PLACEHOLDER_music_provider',
      action: 'generate',
      meterUnit: 'generation',
      meterQuantity: 1,
      requestId: 'req_create_1',
      environment: 'production',
    });
    assert.equal(result.decision.allow, true);
    assert.ok(result.ledgerId);
  });
});
