# Tier config (example only)

`tiers.example.json` is a **scaffold**. Every numeric limit, price ID, allowance, RPM/TPM, connector count, creation-platform quota, and margin field is **`null` or `PLACEHOLDER`** on purpose.

## What Crystal must fill before go-live

1. **Inference:** included units, period, RPM/TPM/concurrency, allowed models, overage policy.
2. **Developer connections:** max keys, connectors, webhooks, environments, log retention, seats.
3. **Creation platforms** (`developer_connections.connectors.categories.creation_platforms` + `creation_platform_catalog` + `creation_platform_metering`):
   - Curate the real catalog (music gen, video edit/export, image, design, voice, …). Named examples of the *class* include Suno and CapCut — do not treat those two as the only connectors.
   - Free: which connector IDs are sandbox-eligible; hard caps on generations / render minutes / exports / storage / API calls.
   - Paid: production access, expanded catalog, higher quotas, webhooks/exports enabled.
   - Unit prices and included amounts — from real contracts, not invented here.
4. **Stripe Price IDs** after Products/Prices exist in the Stripe dashboard (test then live).
5. **Margin floor** and **provider spend ceilings** (Free marketing budget + paid risk reserve).

## Settlement reminder

- Stripe is the **customer** billing layer.
- Stripe does **not** automatically pay OpenAI, Anthropic, Suno, CapCut, or other creation platforms unless those providers participate in a **documented** Stripe Connect (or similar) arrangement — none is assumed here.
- Hybrid: platform-managed keys (Crystal floats provider cost + reserves) and/or **BYOK** (customer pays that platform directly; Crystal charges a platform fee via Stripe).

Copy to a private config / secrets store; do not commit filled production values into this repo.
