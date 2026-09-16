# CrystalCore.OS — API tiers contract (scaffold)

**Status:** Scaffold / internal contract. **DRAFT 42-tier pricing ladder** — not production billing, **not marketing-live**.  
**Related plan concepts:** 42-tier DRAFT ladder (`tier_01`…`tier_42`), shared billable credits, central usage ledger, hybrid Stripe settlement, BYOK, universal entitlement, **on-device privacy for all tiers**.  
**Pricing detail:** see [`docs/PRICING-DRAFT.md`](./PRICING-DRAFT.md) and `config/tiers.example.json`.  
**Hero PR (unrelated):** do not bundle with homepage hero work.

## What this document is

Public/internal summary of **Free vs Paid**, how **settlement** is intended to work, and a **go-live checklist**. Numeric prices, allowances, RPM, connector limits, and margins are **not** defined here — see `config/tiers.example.json` (`null` / `PLACEHOLDER`) and `config/README.md`.

## Everything is entitled (universal entitlement)

**Product rule:** any capability that **spends money**, **burns quota**, or **grants access** must go through the **central entitlement service** (`api/entitlements/service.ts`).

There are **no bypass paths** for:

- MCP tools / resources / prompts
- Arbitrary REST / GraphQL / gRPC APIs (first-party or third-party)
- Webhooks, SDKs, CLIs
- Third-party connectors (CRM, email, calendar, storage, payments, analytics, …)
- Creation platforms, social media, inference, automation agents/workflows

**Deny-by-default:** unregistered / unknown capabilities are rejected (`unknown_capability`). New platforms register in a pluggable catalog with a **type + meter units**, then receive Free/Paid entitlements — they do not get free access by omission.

**Open-ended catalog:** unknown future platforms register as **connectors** (or under a registered category such as `mcp_servers` / `apis` / `automation`) with a type + meter units. The category list is intentionally extensible; commercial numbers stay `null`/`PLACEHOLDER` until Crystal fills them.

## On-device privacy (all 42 tiers)

**Product rule:** customer data/workspace stays **on their device by default**. Cloud is used only when they **opt into** a connector or inference call. This applies to **every** tier from Free (`tier_01`) through `tier_42`.

## Tiers (DRAFT 42-rung ladder)

Canonical ids: **`tier_01` … `tier_42`**. Legacy aliases `free` → `tier_01`, `paid` → `tier_02` remain for scaffold code.

| | Free (`tier_01`) | Paid (`tier_02`…`tier_42`) |
|---|------|------|
| Price (AUD/mo) | **0 (DRAFT)** | Ascending nice numbers — see `PRICING-DRAFT.md` (**DRAFT**) |
| Credits | 500 included; **hard_cap**; no overages | `max(1000, price×200)` included (**DRAFT**); overage at cost + **30%** margin floor (**DRAFT**) |
| Seats | 1 | `1 + floor((index−1)/3)` capped at 500 (**DRAFT**) |
| Environment | **Sandbox only**; production false | Production allowed |
| Auth | API key (sandbox/dev) | API keys (incl. production) |
| Inference / connectors / MCP / APIs / creation / social / automation / developer | Hard-capped; universal entitlement | Higher included credits; universal entitlement; metered overage (**DRAFT**) |
| Stripe `price_id` | `null` PLACEHOLDER | `null` PLACEHOLDER — do not invent |
| Privacy | On-device by default | On-device by default |

Full 42-row table, credit wallet, and “not marketing-live” notice: **[`docs/PRICING-DRAFT.md`](./PRICING-DRAFT.md)**. Config: `config/tiers.example.json` (`defaults` + per-tier overrides + `tier_order`).

## Categories (pluggable registries)

| Category | Registry | What is metered (structure only) |
|----------|----------|----------------------------------|
| `inference` | (models list in tier config) | Billable units / tokens |
| `creation_platforms` | `api/connections/creationPlatforms.ts` | Generations, render minutes, exports, storage, API calls |
| `social_media` | `api/connections/socialMedia.ts` | OAuth, publish/schedule, media, analytics, inbox, webhooks |
| `mcp_servers` | `api/connections/mcpServers.ts` | Tool calls, resource reads, prompt gets, sessions |
| `apis` | `api/connections/apis.ts` | HTTP / GraphQL / gRPC / requests |
| `connectors` | `api/connections/connectors.ts` | Invoke, sync, webhook delivery, API calls |
| `developer` | `api/connections/developer.ts` | Keys, environments, webhooks, SDK, seats, retention, rate limits |
| `automation` | `api/connections/automation.ts` | Scheduled runs, agent runs, workflow runs, retries |

## Creation platforms (developer/provider connectors)

Creation platforms are **first-class connectors** under the **same** Free/Paid entitlements and Stripe settlement model as inference and other integrations.

**Class (pluggable — not hardcoded to two vendors):**

- Music generation (e.g. Suno-class)
- Video edit / export (e.g. CapCut-class)
- Image generation
- Design tools
- Voice / TTS
- Future providers Crystal adds to the catalog

**Free:** sandbox/dev; limited catalog; hard caps; no production exports/webhooks on scaffold defaults.  
**Paid:** production; broader catalog; webhooks/exports (limits TBD).

## Social media (developer/provider connectors)

Social networks are a pluggable connector category **`social_media`** under the **same** Free/Paid entitlements, usage ledger, and Stripe settlement model.

**Class (extensible):** X/Twitter, Instagram, TikTok, YouTube, Facebook/Meta, LinkedIn, Threads, Bluesky, Discord, Telegram, and future platforms.

**Free:** sandbox/limited; hard caps; **no uncapped auto-posting**.  
**Paid:** more accounts/platforms; production webhooks; retention; team seats (counts TBD).

## MCP servers

Every MCP **tool / resource / prompt** invocation is entitled. Free hard-caps tool calls; Paid unlocks production. Future MCP servers register in `mcp_servers_catalog` with meter units — they do not bypass the gate.

## APIs (first-party + third-party)

HTTP, GraphQL, and gRPC calls — whether CrystalCore first-party or third-party — burn API entitlements. SDKs and CLIs that call these APIs are covered by the same gate (plus `developer` meters for SDK usage itself).

## Generic connectors

CRM, email, calendar, storage, payments, analytics, and **other** types live under `connectors`. The catalog is **open-ended**: a new SaaS registers with `connector_type` + meter units and receives Free/Paid entitlements. No silent free access.

## Developer tooling

API keys, environments, webhooks, SDK usage, team seats, log retention, and rate limits are entitled under `developer` (mirrored with `connections` for key/webhook/promote gates). Free = sandbox keys only; Paid = production promote + webhooks.

## Automation

Scheduled jobs, agents, and workflows **cannot** bypass entitlements. Retries are Paid-only on this scaffold’s defaults. Agent runs that invoke MCP/API/connectors still pay each underlying category’s meters as well.

## Settlement hybrid (do not misstate)

1. **Stripe** = customer billing (Checkout, Customer Portal, subscriptions, metered invoices, webhooks).
2. Stripe collects into the **platform** Stripe balance / bank settlement.
3. Stripe does **not**, by itself, pay OpenAI, Anthropic, **Suno, CapCut**, **Meta, TikTok, X**, MCP hosts, third-party APIs, or other connector vendors — unless a provider **explicitly** participates in a documented **Stripe Connect** (or similar) arrangement. **None is assumed.**
4. **Platform-managed keys / OAuth apps:** Crystal’s provider accounts are billed or rate-limited separately; maintain reserves; circuit-break on unsafe balance or customer payment failure.
5. **BYOK / bring-your-own-app-credentials:** Customer brings credentials; customer pays or operates under that provider’s terms; Crystal charges a **platform fee** via Stripe.
6. **Stripe Connect** (if ever used): marketplace payouts to participating third-party developers/vendors — **not** a generic way to pay arbitrary provider bills.

## Scaffold surface (this PR)

| Path | Role |
|------|------|
| `api/auth/` | API key issue, hash, revoke |
| `api/entitlements/` | **One** entitlement service for **all** categories (deny-by-default) |
| `api/middleware/` | Quota gate, rate limit stub, cost estimate stub, free hard-cap gate |
| `api/metering/` | Usage ledger interface + in-memory store (kinds per category) |
| `api/billing/` | Checkout/portal stubs, webhook signature stub, circuit breaker |
| `api/byok/` | BYOK header resolution stub |
| `api/connections/creationPlatforms.ts` | Creation-platform registry + run path |
| `api/connections/socialMedia.ts` | Social media registry + run path |
| `api/connections/mcpServers.ts` | MCP servers registry + run path |
| `api/connections/apis.ts` | First/third-party API registry + run path |
| `api/connections/connectors.ts` | Generic connectors registry + run path |
| `api/connections/developer.ts` | Developer tooling registry + run path |
| `api/connections/automation.ts` | Automation registry + run path |
| `config/tiers.example.json` | **DRAFT** 42 tiers (`tier_01`…`tier_42`) + defaults/templates + open-ended catalogs |
| `.env.example` | Env **names** only |

Static site (`index.html`, `styles.css`, `app.js`) remains unchanged and deployable.

## Go-live checklist (Crystal)

- [ ] Answer plan §9 decisions (tiers, metering unit, settlement, tax, BYOK).
- [ ] Provider / connector / MCP / API **contracts** + real **cost tables**.
- [ ] Confirm **DRAFT** 42-tier ladder in `tiers.example.json` / `PRICING-DRAFT.md` → private config (no invented live Stripe Price IDs).
- [ ] Create Stripe Products/Prices; set `STRIPE_PRICE_*`, webhook secret.
- [ ] Provision `DATABASE_URL` and replace in-memory ledger.
- [ ] Confirm auto-pay / invoice options per provider category.
- [ ] Wire real Stripe SDK + signature verification (`constructEvent`).
- [ ] Staging: Free hard caps + circuit breaker; shadow reconciliation.
- [ ] Paid live only after reconciliation trusted and margin floor configured.
- [ ] Optional BYOK across categories.
- [ ] Marketing/pricing UI in a **separate** front-end PR — after checkout URLs and approved numbers exist.

## What is explicitly TBD

DRAFT AUD ladder / credits / seats / 30% margin floor are provisional. Still TBD: final marketing numbers, RPM/TPM, per-category meter splits, Stripe Price IDs (keep null until created), tax/GST, legal entity details, and Free-eligible catalog IDs.
