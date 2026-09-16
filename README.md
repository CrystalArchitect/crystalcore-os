# CrystalCore.OS

**CrystalCore.OS v7.7.7** — Crystal’s live CrystalCore.OS site.

## Live

- **Production:** [https://www.teraustralis.com.au](https://www.teraustralis.com.au)
- **Vercel project:** `crystalcore-os-live`
- **Team:** TerAustralis Incognita

## What’s in this repo

Canonical three-file static site served in production:

| File | Role |
|------|------|
| `index.html` | Shell / markup |
| `styles.css` | Styles |
| `app.js` | Client logic |

Provenance notes for the original artifact extraction are in `EXTRACT.md`.

## Deploy

Static site on Vercel. Minimal config in `vercel.json` (`cleanUrls: true`).

This repository is the source of truth for the site content. Linking the Vercel project `crystalcore-os-live` to this GitHub repo is a separate step.

## Local preview

```bash
npx serve .
# or: python3 -m http.server 8080
```

Then open `http://localhost:3000` (or the port shown).


## API tiers scaffold (separate from marketing site)

Serverless stubs under `api/` plus `config/tiers.example.json` and `docs/API-TIERS.md` scaffold **universal** Free/Paid entitlements (inference, creation platforms, social media, **MCP servers**, **APIs**, **generic connectors**, **developer** tooling, **automation**), usage ledger, Stripe settlement stubs, and BYOK. Catalog is open-ended; deny-by-default for unknown capabilities. See `docs/API-TIERS.md` (“Everything is entitled”).

```bash
npm install
npm test
npm run typecheck
```

Prices/limits are PLACEHOLDER/null — Crystal must fill before go-live. Do not merge until reviewed. Static site files above are unchanged.
