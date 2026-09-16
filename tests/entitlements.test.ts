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

  it('unknown capability → deny by default', () => {
    const ent = buildEntitlements({
      tierId: 'paid',
      accountId: 'acct_paid',
    });
    const d = authorize(ent, 'totally.unregistered.capability' as never);
    assert.equal(d.allow, false);
    if (!d.allow) {
      assert.equal(d.status, 403);
      assert.equal(d.code, 'unknown_capability');
    }
  });
});

describe('social media entitlements', () => {
  it('Free social publish exhausted → reject', () => {
    const ent = buildEntitlements({
      tierId: 'free',
      accountId: 'acct_free',
      allowedSocialConnectorIds: ['PLACEHOLDER_x_twitter'],
      socialIncluded: { publish: 2 },
      socialUsed: { publish: 2 },
      overagePolicy: 'hard_cap',
    });
    const d = freeTierHardCapGate(ent, 'social.publish', {
      connectorId: 'PLACEHOLDER_x_twitter',
      meterUnit: 'publish',
      meterQuantity: 1,
      environment: 'sandbox',
    });
    assert.equal(d.allow, false);
    if (!d.allow) assert.equal(d.code, 'social_allowance_exhausted');
  });

  it('Free production social webhook → reject', () => {
    const ent = buildEntitlements({
      tierId: 'free',
      accountId: 'acct_free',
      allowedSocialConnectorIds: ['PLACEHOLDER_instagram'],
    });
    const d = authorize(ent, 'social.webhook', {
      connectorId: 'PLACEHOLDER_instagram',
      environment: 'production',
    });
    assert.equal(d.allow, false);
  });

  it('Paid social publish + webhook → allow', () => {
    const ent = buildEntitlements({
      tierId: 'paid',
      accountId: 'acct_paid',
      allowedSocialConnectorIds: ['PLACEHOLDER_tiktok', 'PLACEHOLDER_youtube'],
      socialIncluded: { publish: 100, webhook_delivery: 100 },
      socialUsed: { publish: 1, webhook_delivery: 0 },
    });
    assert.equal(
      authorize(ent, 'social.publish', {
        connectorId: 'PLACEHOLDER_tiktok',
        meterUnit: 'publish',
        environment: 'production',
      }).allow,
      true,
    );
    assert.equal(
      authorize(ent, 'social.webhook', {
        connectorId: 'PLACEHOLDER_youtube',
        environment: 'production',
      }).allow,
      true,
    );
  });
});

describe('universal categories: MCP / API / connectors', () => {
  it('Free exhausted MCP tool_call → deny', () => {
    const ent = buildEntitlements({
      tierId: 'free',
      accountId: 'acct_free',
      allowedMcpConnectorIds: ['PLACEHOLDER_mcp_filesystem'],
      mcpIncluded: { tool_call: 2 },
      mcpUsed: { tool_call: 2 },
      overagePolicy: 'hard_cap',
    });
    const d = freeTierHardCapGate(ent, 'mcp.tool_call', {
      connectorId: 'PLACEHOLDER_mcp_filesystem',
      meterUnit: 'tool_call',
      meterQuantity: 1,
      environment: 'sandbox',
    });
    assert.equal(d.allow, false);
    if (!d.allow) assert.equal(d.code, 'mcp_allowance_exhausted');
  });

  it('Paid MCP tool_call → allow', () => {
    const ent = buildEntitlements({
      tierId: 'paid',
      accountId: 'acct_paid',
      allowedMcpConnectorIds: ['PLACEHOLDER_mcp_browser'],
      mcpIncluded: { tool_call: 100 },
      mcpUsed: { tool_call: 1 },
    });
    const d = authorize(ent, 'mcp.tool_call', {
      connectorId: 'PLACEHOLDER_mcp_browser',
      meterUnit: 'tool_call',
      environment: 'production',
    });
    assert.equal(d.allow, true);
  });

  it('Free exhausted API http_call → deny', () => {
    const ent = buildEntitlements({
      tierId: 'free',
      accountId: 'acct_free',
      allowedApiConnectorIds: ['PLACEHOLDER_api_third_party_http'],
      apiIncluded: { http_call: 1 },
      apiUsed: { http_call: 1 },
      overagePolicy: 'hard_cap',
    });
    const d = freeTierHardCapGate(ent, 'api.http', {
      connectorId: 'PLACEHOLDER_api_third_party_http',
      meterUnit: 'http_call',
      meterQuantity: 1,
      environment: 'sandbox',
      apiKind: 'third_party',
    });
    assert.equal(d.allow, false);
    if (!d.allow) assert.equal(d.code, 'api_allowance_exhausted');
  });

  it('Paid API graphql → allow', () => {
    const ent = buildEntitlements({
      tierId: 'paid',
      accountId: 'acct_paid',
      allowedApiConnectorIds: ['PLACEHOLDER_api_graphql'],
      apiIncluded: { graphql_call: 50 },
      apiUsed: { graphql_call: 0 },
    });
    const d = authorize(ent, 'api.graphql', {
      connectorId: 'PLACEHOLDER_api_graphql',
      meterUnit: 'graphql_call',
      environment: 'production',
      apiKind: 'third_party',
    });
    assert.equal(d.allow, true);
  });

  it('Free exhausted connector invoke → deny', () => {
    const ent = buildEntitlements({
      tierId: 'free',
      accountId: 'acct_free',
      allowedConnectorIds: ['PLACEHOLDER_connector_crm'],
      connectorIncluded: { invoke: 3 },
      connectorUsed: { invoke: 3 },
      overagePolicy: 'hard_cap',
    });
    const d = freeTierHardCapGate(ent, 'connector.invoke', {
      connectorId: 'PLACEHOLDER_connector_crm',
      connectorType: 'crm',
      meterUnit: 'invoke',
      meterQuantity: 1,
      environment: 'sandbox',
    });
    assert.equal(d.allow, false);
    if (!d.allow) assert.equal(d.code, 'connector_allowance_exhausted');
  });

  it('Paid connector sync → allow', () => {
    const ent = buildEntitlements({
      tierId: 'paid',
      accountId: 'acct_paid',
      allowedConnectorIds: ['PLACEHOLDER_connector_email'],
      connectorIncluded: { sync: 20 },
      connectorUsed: { sync: 0 },
    });
    const d = authorize(ent, 'connector.sync', {
      connectorId: 'PLACEHOLDER_connector_email',
      connectorType: 'email',
      meterUnit: 'sync',
      environment: 'production',
    });
    assert.equal(d.allow, true);
  });

  it('Free automation retry → deny', () => {
    const ent = buildEntitlements({
      tierId: 'free',
      accountId: 'acct_free',
      allowedAutomationConnectorIds: ['PLACEHOLDER_automation_agent'],
    });
    const d = authorize(ent, 'automation.retry', {
      connectorId: 'PLACEHOLDER_automation_agent',
      meterUnit: 'retry',
      environment: 'sandbox',
    });
    assert.equal(d.allow, false);
    if (!d.allow) assert.equal(d.code, 'automation_retries_not_allowed');
  });

  it('Paid automation agent_run → allow', () => {
    const ent = buildEntitlements({
      tierId: 'paid',
      accountId: 'acct_paid',
      allowedAutomationConnectorIds: ['PLACEHOLDER_automation_agent'],
      automationIncluded: { agent_run: 10 },
      automationUsed: { agent_run: 0 },
    });
    const d = authorize(ent, 'automation.agent_run', {
      connectorId: 'PLACEHOLDER_automation_agent',
      meterUnit: 'agent_run',
      environment: 'production',
    });
    assert.equal(d.allow, true);
  });
});
