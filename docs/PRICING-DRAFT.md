# CrystalCore.OS — 42-tier DRAFT pricing ladder

> **Status: DRAFT — not marketing-live.**  
> Numbers, credits, seats, and margins are provisional until Crystal confirms.  
> Do **not** publish as final pricing. Do **not** invent Stripe Price IDs.

**Related:** `config/tiers.example.json`, `docs/API-TIERS.md`  
**PR:** #2 (`feat/api-tiers-stripe-scaffold`) — do not merge until reviewed. Hero PR untouched.

## Product rules (all 42 tiers)

1. **On-device privacy:** customer data/workspace stays on their device by default; cloud only when they opt into a connector/inference call. Applies to **ALL** 42 tiers.
2. **Universal entitlement:** every connectors / MCPs / APIs / developer / creation / social / automation capability gates spend, quota, and access through the central entitlement service.
3. **Shared billable credits wallet:** ~1 credit ≈ **AUD $0.01** platform cost basis (**DRAFT**). Credits are shared across categories.
4. **Free vs Paid**
   - **Free (`tier_01`):** hard caps, sandbox only, no overages (`hard_cap`).
   - **Paid (`tier_02`…`tier_42`):** included credits; overage at **cost + `margin_floor_percent` 30** (**DRAFT**).
5. **Stripe** bills the customer into the platform balance. Stripe does **not** pay providers directly. **BYOK** preferred.
6. Everything here is **DRAFT / not locked** for marketing until Crystal confirms.

## Credit wallet (DRAFT)

| Concept | Value |
|---------|-------|
| Unit | `billable_credit` |
| Cost basis | ~AUD $0.01 / credit (**DRAFT**) |
| Free included | 500 credits / period |
| Paid included | `max(1000, price_aud_monthly × 200)` (**DRAFT**) |
| Free overage | None — hard cap |
| Paid overage | Metered from wallet at cost + 30% margin floor (**DRAFT**) |
| Stripe Price IDs | All `null` (PLACEHOLDER) |

## Seats formula (DRAFT)

`seats = min(500, 1 + floor((tier_index − 1) / 3))`

## Full 42-tier table (AUD monthly — DRAFT)

Currency: **AUD**. Period: **month**. `stripe_price_id`: **null** for every tier.

| Tier id | Name | AUD / mo (DRAFT) | Included credits (DRAFT) | Seats (DRAFT) | Overage | Sandbox only | Production | Margin floor % | Stripe price |
|---------|------|------------------|--------------------------|---------------|---------|--------------|------------|----------------|--------------|
| `tier_01` | Free | 0 | 500 | 1 | `hard_cap` | True | False | N/A | `null` |
| `tier_02` | T02 | 5 | 1,000 | 1 | `metered` | False | True | 30 | `null` |
| `tier_03` | T03 | 9 | 1,800 | 1 | `metered` | False | True | 30 | `null` |
| `tier_04` | T04 | 12 | 2,400 | 2 | `metered` | False | True | 30 | `null` |
| `tier_05` | T05 | 15 | 3,000 | 2 | `metered` | False | True | 30 | `null` |
| `tier_06` | T06 | 19 | 3,800 | 2 | `metered` | False | True | 30 | `null` |
| `tier_07` | T07 | 24 | 4,800 | 3 | `metered` | False | True | 30 | `null` |
| `tier_08` | T08 | 29 | 5,800 | 3 | `metered` | False | True | 30 | `null` |
| `tier_09` | T09 | 34 | 6,800 | 3 | `metered` | False | True | 30 | `null` |
| `tier_10` | T10 | 39 | 7,800 | 4 | `metered` | False | True | 30 | `null` |
| `tier_11` | T11 | 49 | 9,800 | 4 | `metered` | False | True | 30 | `null` |
| `tier_12` | T12 | 59 | 11,800 | 4 | `metered` | False | True | 30 | `null` |
| `tier_13` | T13 | 69 | 13,800 | 5 | `metered` | False | True | 30 | `null` |
| `tier_14` | T14 | 79 | 15,800 | 5 | `metered` | False | True | 30 | `null` |
| `tier_15` | T15 | 89 | 17,800 | 5 | `metered` | False | True | 30 | `null` |
| `tier_16` | T16 | 99 | 19,800 | 6 | `metered` | False | True | 30 | `null` |
| `tier_17` | T17 | 119 | 23,800 | 6 | `metered` | False | True | 30 | `null` |
| `tier_18` | T18 | 139 | 27,800 | 6 | `metered` | False | True | 30 | `null` |
| `tier_19` | T19 | 149 | 29,800 | 7 | `metered` | False | True | 30 | `null` |
| `tier_20` | T20 | 169 | 33,800 | 7 | `metered` | False | True | 30 | `null` |
| `tier_21` | T21 | 199 | 39,800 | 7 | `metered` | False | True | 30 | `null` |
| `tier_22` | T22 | 229 | 45,800 | 8 | `metered` | False | True | 30 | `null` |
| `tier_23` | T23 | 249 | 49,800 | 8 | `metered` | False | True | 30 | `null` |
| `tier_24` | T24 | 279 | 55,800 | 8 | `metered` | False | True | 30 | `null` |
| `tier_25` | T25 | 299 | 59,800 | 9 | `metered` | False | True | 30 | `null` |
| `tier_26` | T26 | 349 | 69,800 | 9 | `metered` | False | True | 30 | `null` |
| `tier_27` | T27 | 399 | 79,800 | 9 | `metered` | False | True | 30 | `null` |
| `tier_28` | T28 | 449 | 89,800 | 10 | `metered` | False | True | 30 | `null` |
| `tier_29` | T29 | 499 | 99,800 | 10 | `metered` | False | True | 30 | `null` |
| `tier_30` | T30 | 599 | 119,800 | 10 | `metered` | False | True | 30 | `null` |
| `tier_31` | T31 | 699 | 139,800 | 11 | `metered` | False | True | 30 | `null` |
| `tier_32` | T32 | 799 | 159,800 | 11 | `metered` | False | True | 30 | `null` |
| `tier_33` | T33 | 899 | 179,800 | 11 | `metered` | False | True | 30 | `null` |
| `tier_34` | T34 | 999 | 199,800 | 12 | `metered` | False | True | 30 | `null` |
| `tier_35` | T35 | 1199 | 239,800 | 12 | `metered` | False | True | 30 | `null` |
| `tier_36` | T36 | 1499 | 299,800 | 12 | `metered` | False | True | 30 | `null` |
| `tier_37` | T37 | 1799 | 359,800 | 13 | `metered` | False | True | 30 | `null` |
| `tier_38` | T38 | 1999 | 399,800 | 13 | `metered` | False | True | 30 | `null` |
| `tier_39` | T39 | 2499 | 499,800 | 13 | `metered` | False | True | 30 | `null` |
| `tier_40` | T40 | 2999 | 599,800 | 14 | `metered` | False | True | 30 | `null` |
| `tier_41` | T41 | 3999 | 799,800 | 14 | `metered` | False | True | 30 | `null` |
| `tier_42` | T42 | 4999 | 999,800 | 14 | `metered` | False | True | 30 | `null` |

### Ladder note

The brief’s paid AUD list contained **42** amounts for a **41**-slot band (tiers 2–42). **AUD 1299** was omitted (1199→1499 kept smooth; mid-ladder **139** retained) so the ladder stays **exactly 42** tiers (Free + 41 paid). Crystal can restore or reshape before go-live.

## Settlement (reminder)

- Stripe = customer billing only.
- Platform pays providers (or customer uses BYOK) — Stripe does not pay OpenAI, Anthropic, creation platforms, social networks, MCP hosts, or third-party APIs directly unless a documented Connect relationship exists (none assumed).

## Not marketing-live

Do not surface these numbers in public marketing, checkout copy, or homepage hero work until Crystal locks the ladder and creates real Stripe Products/Prices.
