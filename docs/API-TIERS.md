# CrystalCore.OS — API tiers contract (scaffold)

**Status:** Scaffold / internal contract. Not production billing.  
**Related plan concepts:** Free vs Paid entitlements, central usage ledger, hybrid Stripe settlement, BYOK, creation platforms as pluggable connectors.  
**Hero PR (unrelated):** do not bundle with homepage hero work.

## What this document is

Public/internal summary of **Free vs Paid**, how **settlement** is intended to work, and a **go-live checklist**. Numeric prices, allowances, RPM, connector limits, and margins are **not** defined here — see `config/tiers.example.json` (`null` / `PLACEHOLDER`) and `config/README.md`.

## Tiers (structure)

| | Free | Paid |
|---|------|------|
| Auth | API key (sandbox/dev) | API keys (incl. production) |
| Inference | Hard-capped allowance; no overages | Higher allowance; overage policy TBD by Crystal |
| Developer connections | Limited connectors; no prod secrets | More connectors, webhooks, environments |
| **Creation platforms** | Sandbox/dev access to a **limited** creation-connector set; **hard caps** | **Production** access, more platforms, higher quotas, webhooks/exports |
| Support | Community | Priority / SLA TBD |

Exact counts, catalogs, and prices: **Crystal fills** before marketing or charging.

## Creation platforms (developer/provider connectors)

Creation platforms are **first-class connectors** under the **same** Free/Paid entitlements and Stripe settlement model as inference and other integrations.

**Class (pluggable — not hardcoded to two vendors):**

- Music generation (e.g. Suno-class)
- Video edit / export (e.g. CapCut-class)
- Image generation
- Design tools
- Voice / TTS
- Future providers Crystal adds to the catalog

**Free**

- Sandbox / dev access only
- Limited allowed connector set (IDs TBD)
- Hard caps on generations, render minutes, exports, storage, API calls
- No production exports/webhooks on this scaffold’s defaults

**Paid**

- Production access
- Broader catalog + higher quotas
- Webhooks and exports enabled (limits TBD)

**Metering (usage ledger)**

Ledger events may record, per platform:

- Generations
- Minutes rendered
- Exports
- Storage
- API calls

Fields include customer charge, provider cost estimate, tax, Stripe fees, reserve, and platform margin — **values null until Crystal supplies cost tables**.

## Settlement hybrid (do not misstate)

1. **Stripe** = customer billing (Checkout, Customer Portal, subscriptions, metered invoices, webhooks).
2. Stripe collects into the **platform** Stripe balance / bank settlement.
3. Stripe does **not**, by itself, pay OpenAI, Anthropic, **Suno, CapCut**, or other creation platforms — unless a provider **explicitly** participates in a documented **Stripe Connect** (or similar) arrangement. **None is assumed.**
4. **Platform-managed keys:** Crystal’s provider accounts are billed separately (invoice/auto-charge where supported); maintain reserves; circuit-break on unsafe balance or customer payment failure.
5. **BYOK:** Customer brings their own Suno / CapCut / model / etc. keys; customer pays that provider directly; Crystal charges a **platform fee** via Stripe (removes Crystal’s provider-credit exposure for that path).
6. **Stripe Connect** (if ever used): marketplace payouts to participating third-party developers/vendors on the platform — **not** a generic way to pay arbitrary AI/creation provider bills.

## Scaffold surface (this PR)

| Path | Role |
|------|------|
| `api/auth/` | API key issue, hash, revoke |
| `api/entitlements/` | One entitlement service (inference + connections + creation) |
| `api/middleware/` | Quota gate, rate limit stub, cost estimate stub, free hard-cap gate |
| `api/metering/` | Usage ledger interface + in-memory store |
| `api/billing/` | Checkout/portal stubs, webhook signature stub, circuit breaker |
| `api/byok/` | BYOK header resolution stub |
| `api/connections/creationPlatforms.ts` | Pluggable creation-platform registry + run path |
| `config/tiers.example.json` | Free/Paid + `creation_platforms` PLACEHOLDERs |
| `.env.example` | Env **names** only |

Static site (`index.html`, `styles.css`, `app.js`) remains unchanged and deployable.

## Go-live checklist (Crystal)

- [ ] Answer plan §9 decisions (tiers, metering unit, settlement, tax, BYOK).
- [ ] Provider / creation-platform **contracts** + real **cost tables**.
- [ ] Fill `tiers.example.json` → private config (no invented marketing numbers in-repo).
- [ ] Create Stripe Products/Prices; set `STRIPE_PRICE_*`, webhook secret.
- [ ] Provision `DATABASE_URL` and replace in-memory ledger.
- [ ] Confirm auto-pay / invoice options per provider (AI + creation).
- [ ] Wire real Stripe SDK + signature verification (`constructEvent`).
- [ ] Staging: Free hard caps + circuit breaker; shadow reconciliation.
- [ ] Paid live only after reconciliation trusted and margin floor configured.
- [ ] Optional BYOK for creation platforms and model providers.
- [ ] Marketing/pricing UI in a **separate** front-end PR — after checkout URLs and approved numbers exist.

## What is explicitly TBD

All dollar amounts, included units, RPM/TPM, connector counts, creation quotas, margin %, Stripe Price IDs, tax/GST treatment, legal entity/currency details, and which specific Suno/CapCut/etc. products are Free-eligible.
