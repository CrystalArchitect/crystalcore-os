# CrystalCore.OS — API tiers contract (scaffold)

**Status:** Scaffold / internal contract. Not production billing.  
**Related plan concepts:** Free vs Paid entitlements, central usage ledger, hybrid Stripe settlement, BYOK, universal entitlement across all connectors/MCPs/APIs/dev tooling.  
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

## Tiers (structure)

| | Free | Paid |
|---|------|------|
| Auth | API key (sandbox/dev) | API keys (incl. production) |
| Inference | Hard-capped allowance; no overages | Higher allowance; overage policy TBD by Crystal |
| **Developer** | Limited keys/envs; no prod secrets | More keys, webhooks, environments, SDK, seats, retention |
| **Creation platforms** | Sandbox/dev; **hard caps** | **Production**; higher quotas; webhooks/exports |
| **Social media** | Sandbox/limited; **hard caps**; no uncapped auto-posting | More accounts/platforms; production webhooks; seats |
| **MCP servers** | Sandbox MCP tool/resource/prompt caps | Production MCP; higher quotas |
| **APIs** | Sandbox first/third-party call caps | Production HTTP/GraphQL/gRPC quotas |
| **Connectors** | Sandbox generic integrations | Production CRM/email/calendar/storage/payments/analytics/… |
| **Automation** | Hard-capped schedules/agents; no retries (scaffold) | Production agents/workflows; retries allowed |
| Support | Community | Priority / SLA TBD |

Exact counts, catalogs, and prices: **Crystal fills** before marketing or charging.

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
| `config/tiers.example.json` | Free/Paid + all categories PLACEHOLDERs + open-ended catalogs |
| `.env.example` | Env **names** only |

Static site (`index.html`, `styles.css`, `app.js`) remains unchanged and deployable.

## Go-live checklist (Crystal)

- [ ] Answer plan §9 decisions (tiers, metering unit, settlement, tax, BYOK).
- [ ] Provider / connector / MCP / API **contracts** + real **cost tables**.
- [ ] Fill `tiers.example.json` → private config (no invented marketing numbers in-repo).
- [ ] Create Stripe Products/Prices; set `STRIPE_PRICE_*`, webhook secret.
- [ ] Provision `DATABASE_URL` and replace in-memory ledger.
- [ ] Confirm auto-pay / invoice options per provider category.
- [ ] Wire real Stripe SDK + signature verification (`constructEvent`).
- [ ] Staging: Free hard caps + circuit breaker; shadow reconciliation.
- [ ] Paid live only after reconciliation trusted and margin floor configured.
- [ ] Optional BYOK across categories.
- [ ] Marketing/pricing UI in a **separate** front-end PR — after checkout URLs and approved numbers exist.

## What is explicitly TBD

All dollar amounts, included units, RPM/TPM, connector counts, creation/social/MCP/API/automation quotas, margin %, Stripe Price IDs, tax/GST treatment, legal entity/currency details, and which specific catalog IDs are Free-eligible.
