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
4. **Social media** (`social_media` category + `social_media_catalog` + `social_media_metering`):
   - Extensible catalog (X/Twitter, Instagram, TikTok, YouTube, Facebook/Meta, LinkedIn, Threads, Bluesky, Discord, Telegram, …).
   - Capabilities: OAuth connect, publish/schedule, media upload, analytics, inbox/DMs/comments, engagement webhooks, multi-account/brand seats.
   - Free: sandbox/limited accounts, hard caps, **no uncapped auto-posting**.
   - Paid: more accounts/platforms, higher quotas, production webhooks, longer retention, team seats.
   - BYOK / bring-your-own-app-credentials vs platform-managed OAuth apps.
5. **Stripe Price IDs** after Products/Prices exist in the Stripe dashboard (test then live).
6. **Margin floor** and **provider spend ceilings** (Free marketing budget + paid risk reserve).

## Settlement reminder

- Stripe is the **customer** billing layer.
- Stripe does **not** automatically pay OpenAI, Anthropic, Suno, CapCut, or other creation platforms unless those providers participate in a **documented** Stripe Connect (or similar) arrangement — none is assumed here.
- Hybrid: platform-managed keys/OAuth apps (Crystal floats provider cost + reserves) and/or **BYOK** / bring-your-own-app-credentials (customer pays that platform or uses their own app; Crystal charges a platform fee via Stripe).
- Stripe does **not** pay Meta, TikTok, X, or other social networks directly unless a documented Connect relationship exists.

Copy to a private config / secrets store; do not commit filled production values into this repo.
