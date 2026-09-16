# Tier config (example only)

`tiers.example.json` is a **scaffold**. Every numeric limit, price ID, allowance, RPM/TPM, connector count, quota, and margin field is **`null` or `PLACEHOLDER`** on purpose.

## Universal entitlement

Any capability that spends money, burns quota, or grants access must be entitled via the central service. Categories covered:

1. **Inference**
2. **Creation platforms**
3. **Social media**
4. **MCP servers** — tools / resources / prompts
5. **APIs** — first-party + third-party HTTP/GraphQL/gRPC
6. **Connectors** — CRM, email, calendar, storage, payments, analytics, other (open-ended)
7. **Developer** — API keys, environments, webhooks, SDK, team seats, log retention, rate limits
8. **Automation** — scheduled jobs, agents/workflows, retries

**Open-ended:** unknown future platforms register as connectors with a **type + meter units**. Deny-by-default for unregistered capabilities.

## What Crystal must fill before go-live

1. **Inference:** included units, period, RPM/TPM/concurrency, allowed models, overage policy.
2. **Developer:** max keys, environments, webhooks, SDK, seats, retention, rate limits.
3. **Creation platforms** — curated catalog; Free sandbox hard caps; Paid production quotas.
4. **Social media** — extensible catalog; Free no uncapped auto-posting; Paid production webhooks/seats.
5. **MCP / APIs / Connectors / Automation** — included meters and unit prices from real contracts.
6. **Stripe Price IDs** after Products/Prices exist (test then live).
7. **Margin floor** and **provider spend ceilings**.

## Settlement reminder

- Stripe is the **customer** billing layer.
- Stripe does **not** automatically pay OpenAI, Anthropic, Suno, CapCut, Meta, TikTok, X, MCP hosts, third-party APIs, or other connector vendors unless those providers participate in a **documented** Stripe Connect (or similar) arrangement — none is assumed here.
- Hybrid: platform-managed keys/OAuth apps and/or **BYOK** / bring-your-own-app-credentials.

Copy to a private config / secrets store; do not commit filled production values into this repo.
