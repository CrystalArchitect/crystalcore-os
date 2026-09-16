
# fix docs if first cat failed weirdly
mkdir -p /workspace/crystalcore-os-repo/docs
cat > /workspace/crystalcore-os-repo/docs/DEPLOY.md << 'EOF'
# Deploy notes

Production site **https://www.teraustralis.com.au** is already live on the Vercel project **`crystalcore-os-live`** (team **TerAustralis Incognita**).

This GitHub repo holds the canonical static files (`index.html`, `styles.css`, `app.js`). Connecting that Vercel project to this repository (Git integration / production branch `main`) is handled separately and is not done as part of the initial repo create.

## Lattice ignition

Redeploy trigger 2026-09-16T15:30:40+10:00 (Australia/Sydney alignment).
