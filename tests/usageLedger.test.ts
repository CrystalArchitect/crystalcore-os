import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInMemoryUsageLedger,
  setUsageLedger,
  recordUsage,
} from '../server/metering/usageLedger.js';
import { runCreationAction, entitlementsForTier } from '../server/connections/creationPlatforms.js';
import { runSocialAction, socialEntitlementsForTier } from '../server/connections/socialMedia.js';
import { runMcpAction, mcpEntitlementsForTier } from '../server/connections/mcpServers.js';
import { runApiAction, apiEntitlementsForTier } from '../server/connections/apis.js';
import { runConnectorAction, connectorEntitlementsForTier } from '../server/connections/connectors.js';
import { runAutomationAction, automationEntitlementsForTier } from '../server/connections/automation.js';

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

  it('runSocialAction allows paid publish and writes ledger', async () => {
    const ent = socialEntitlementsForTier('paid', 'acct_paid', {
      allowedSocialConnectorIds: ['PLACEHOLDER_linkedin'],
      socialIncluded: { publish: 10 },
      socialUsed: { publish: 0 },
    });
    const result = await runSocialAction({
      entitlements: ent,
      connectorId: 'PLACEHOLDER_linkedin',
      action: 'publish',
      meterUnit: 'publish',
      meterQuantity: 1,
      requestId: 'req_social_1',
      environment: 'production',
    });
    assert.equal(result.decision.allow, true);
    assert.ok(result.ledgerId);
  });

  it('runMcpAction allows paid tool_call and writes ledger', async () => {
    const ent = mcpEntitlementsForTier('paid', 'acct_paid', {
      allowedMcpConnectorIds: ['PLACEHOLDER_mcp_filesystem'],
      mcpIncluded: { tool_call: 10 },
      mcpUsed: { tool_call: 0 },
    });
    const result = await runMcpAction({
      entitlements: ent,
      connectorId: 'PLACEHOLDER_mcp_filesystem',
      action: 'tool_call',
      meterUnit: 'tool_call',
      meterQuantity: 1,
      requestId: 'req_mcp_1',
      environment: 'production',
    });
    assert.equal(result.decision.allow, true);
    assert.ok(result.ledgerId);
  });

  it('runApiAction allows paid http and writes ledger', async () => {
    const ent = apiEntitlementsForTier('paid', 'acct_paid', {
      allowedApiConnectorIds: ['PLACEHOLDER_api_third_party_http'],
      apiIncluded: { http_call: 10 },
      apiUsed: { http_call: 0 },
    });
    const result = await runApiAction({
      entitlements: ent,
      connectorId: 'PLACEHOLDER_api_third_party_http',
      action: 'http',
      meterUnit: 'http_call',
      meterQuantity: 1,
      requestId: 'req_api_1',
      apiKind: 'third_party',
      environment: 'production',
    });
    assert.equal(result.decision.allow, true);
    assert.ok(result.ledgerId);
  });

  it('runConnectorAction allows paid invoke and writes ledger', async () => {
    const ent = connectorEntitlementsForTier('paid', 'acct_paid', {
      allowedConnectorIds: ['PLACEHOLDER_connector_crm'],
      connectorIncluded: { invoke: 10 },
      connectorUsed: { invoke: 0 },
    });
    const result = await runConnectorAction({
      entitlements: ent,
      connectorId: 'PLACEHOLDER_connector_crm',
      connectorType: 'crm',
      action: 'invoke',
      meterUnit: 'invoke',
      meterQuantity: 1,
      requestId: 'req_conn_1',
      environment: 'production',
    });
    assert.equal(result.decision.allow, true);
    assert.ok(result.ledgerId);
  });

  it('runAutomationAction allows paid agent_run and writes ledger', async () => {
    const ent = automationEntitlementsForTier('paid', 'acct_paid', {
      allowedAutomationConnectorIds: ['PLACEHOLDER_automation_agent'],
      automationIncluded: { agent_run: 5 },
      automationUsed: { agent_run: 0 },
    });
    const result = await runAutomationAction({
      entitlements: ent,
      connectorId: 'PLACEHOLDER_automation_agent',
      action: 'agent_run',
      meterUnit: 'agent_run',
      meterQuantity: 1,
      requestId: 'req_auto_1',
      environment: 'production',
    });
    assert.equal(result.decision.allow, true);
    assert.ok(result.ledgerId);
  });
});
