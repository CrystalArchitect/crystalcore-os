# Tier config (example only) — DRAFT 42-tier ladder

`tiers.example.json` holds a **DRAFT** 42-tier pricing scaffold (`tier_01`…`tier_42`).  
**Not marketing-live.** Stripe Price IDs stay **`null`** until Crystal creates Products/Prices.

See also: [`docs/PRICING-DRAFT.md`](../docs/PRICING-DRAFT.md).

## Structure

- `draft_pricing` — status DRAFT, AUD, credit basis, margin floor notes
- `defaults` — on-device privacy, credit wallet, `free_template` / `paid_template` metering placeholders
- `tier_order` — canonical ordered ids
- `tiers` — per-tier overrides: price, included_credits, seats, sandbox/production, overage, margin; plus legacy aliases `free` / `paid`
- Catalogs — creation, social, MCP, APIs, connectors, developer, automation (open-ended)

## Product rules (encoded in comments)

1. **On-device privacy** for ALL 42 tiers.
2. **Universal entitlement** across all categories.
3. Shared **billable credits** wallet (~1 credit ≈ AUD $0.01 cost basis — DRAFT).
4. Free = hard caps / sandbox; Paid = included credits + overage at cost + margin_floor 30% (DRAFT).
5. Stripe bills customer; does **not** pay providers directly. BYOK preferred.
6. Marked **DRAFT** everywhere prices appear.

## Universal entitlement categories

1. Inference  
2. Creation platforms  
3. Social media  
4. MCP servers  
5. APIs  
6. Connectors  
7. Developer  
8. Automation  

## Settlement reminder

- Stripe is the **customer** billing layer.
- Stripe does **not** automatically pay providers unless a **documented** Stripe Connect arrangement exists — none assumed.
- Hybrid: platform-managed keys/OAuth apps and/or **BYOK**.

Copy filled production values to a private store; do not commit live secrets or invented Stripe Price IDs.
