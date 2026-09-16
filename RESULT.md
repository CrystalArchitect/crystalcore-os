# RESULT — API tiers + Stripe settlement scaffold (universal entitlements)

**PR URL:** https://github.com/CrystalArchitect/crystalcore-os/pull/2  
**Branch:** `feat/api-tiers-stripe-scaffold`  
**Title:** Scaffold API tiers and Stripe settlement  
**Status:** Open — **DO NOT MERGE** until Crystal reviews. Homepage hero PR (#1) not modified by this workstream.

**Local path:** `/workspace/crystalcore-api-tiers`  
**RESULT path:** `/workspace/crystalcore-api-tiers/RESULT.md`

## What shipped

Scaffold only (no live prices, no production Stripe wiring):

1. **`api/`** — Vercel/Next-compatible TypeScript stubs  
   - Auth: issue / hash / revoke API keys  
   - Entitlements: **universal** single gate for **all** categories (deny-by-default for unknown capabilities)  
   - Middleware: quota gate, rate-limit stub, cost-estimate stub, Free hard-cap + circuit breaker hooks (all categories)  
   - Usage ledger: types + in-memory store with event kinds per category  
   - Stripe: Checkout + Customer Portal stubs, webhook signature-verify stub, circuit breaker  
   - BYOK / bring-your-own-app-credentials header stub  
   - Registries under `api/connections/`:
     - `creationPlatforms.ts` — music/video/image/design/voice  
     - `socialMedia.ts` — X, Instagram, TikTok, YouTube, Meta, LinkedIn, Threads, Bluesky, Discord, Telegram, extensible  
     - `mcpServers.ts` — MCP tools/resources/prompts  
     - `apis.ts` — first-party + third-party HTTP/GraphQL/gRPC  
     - `connectors.ts` — CRM, email, calendar, storage, payments, analytics, open-ended `other`  
     - `developer.ts` — API keys, environments, webhooks, SDK, seats, retention, rate limits  
     - `automation.ts` — scheduled jobs, agents/workflows, retries  
2. **`config/tiers.example.json`** + **`config/README.md`** — Free/Paid with **null/PLACEHOLDER** for all commercial numbers; categories listed below; open-ended catalog policy documented  
3. **`.env.example`** — names only  
4. **`docs/API-TIERS.md`** — explicit **“Everything is entitled”** section + Free vs Paid + hybrid settlement + go-live checklist  
5. **`package.json` / `tsconfig.json`** — build/test/typecheck  
6. **Unit tests** — Free exhausted MCP/API/connector denied; paid allowed; unknown capability denied by default; prior inference/creation/social coverage retained  
7. **`vercel.json`** — `cleanUrls` + `api/**/*.ts` functions hint; static site untouched  

## Categories now covered

| Category | Role |
|----------|------|
| `inference` | Model / token / unit inference |
| `creation_platforms` | Music, video, image, design, voice (pluggable) |
| `social_media` | Social networks (extensible catalog) |
| `mcp_servers` | MCP tool / resource / prompt invocations |
| `apis` | First-party + third-party HTTP / GraphQL / gRPC |
| `connectors` | Generic integrations (CRM, email, calendar, storage, payments, analytics, other) |
| `developer` | API keys, environments, webhooks, SDK, team seats, log retention, rate limits |
| `automation` | Scheduled jobs, agents/workflows, retries |

**Open-ended:** unknown future platforms register as connectors with a **type + meter units**. No bypass of the central entitlement service.

## Settlement statements (honored)

- Stripe = customer billing only.
- Does **not** claim Stripe pays OpenAI, Anthropic, Suno, CapCut, Meta, TikTok, X, MCP hosts, third-party APIs, or other connector vendors directly (Connect only if documented — not assumed).
- Hybrid: platform-managed keys/OAuth apps + BYOK / bring-your-own-app-credentials.

## Tests

```bash
npm install && npm test && npm run typecheck
```

- **30** tests passing (6 suites)
- Typecheck clean

Coverage includes: Free inference/creation/social/MCP/API/connector exhausted; paid allow paths; Free automation retry deny; Paid automation allow; unknown capability deny-by-default; ledger writes for creation, social, MCP, API, connector, automation; Stripe signature stub; circuit breaker.

## Key files (added/updated this pass)

- `api/lib/types.ts` — all categories, meter units, ledger kinds  
- `api/entitlements/service.ts` — universal gate  
- `api/connections/mcpServers.ts`  
- `api/connections/apis.ts`  
- `api/connections/connectors.ts`  
- `api/connections/developer.ts`  
- `api/connections/automation.ts`  
- `api/middleware/freeTierGate.ts` / `quotaGate.ts`  
- `config/tiers.example.json` — Free/Paid + catalogs for every category  
- `docs/API-TIERS.md` — “Everything is entitled”  
- `tests/entitlements.test.ts` / `tests/usageLedger.test.ts`  

## TBD (Crystal must fill — not invented)

- All dollar prices, included units, RPM/TPM/concurrency  
- Quotas for every category (MCP, API, connectors, developer, automation, creation, social)  
- Margin floor / reserve policy / Free provider-spend ceilings  
- Stripe Product/Price IDs, tax/GST, legal entity & currency  
- Real contracts and cost tables  
- Free-eligible vs Paid catalog IDs per connector  
- `DATABASE_URL` and production ledger persistence  
- Paid overage: hard cap vs metered (per tier)  
- Which BYOK providers at launch  
- Marketing/pricing UI (separate front-end PR after numbers exist)  

## Constraints honored

- No invented live prices/margins presented as final  
- No claim that Stripe pays providers/networks/MCP hosts/APIs directly  
- PR not merged  
- Homepage hero PR (#1) not edited as part of this scaffold  
