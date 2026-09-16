# CrystalCore.OS extraction

- Source: `https://claude.ai/artifact/PiiKNJsLJq2sDKUVCbMNKX`
- Method: opened the artifact, used Chrome DevTools to inspect the cross-origin artifact iframe, evaluated `document.documentElement.outerHTML`, transferred the result to the host page, and downloaded it. Removed Claude's frame-runtime bootstrap so the artifact's own inline HTML/CSS/JS is directly runnable.
- Result: `index.html` is a complete self-contained artifact implementation (inline CSS and JavaScript; all four tabs and controls preserved). It was verified by serving `/workspace/crystalcore-os` locally and switching tabs.
- External assets: Google Fonts (`fonts.googleapis.com` / `fonts.gstatic.com`) remain referenced; the app still renders with fallback fonts if offline.
- APIs/assets missing: no `fetch`, `XMLHttpRequest`, or `WebSocket` usage was found in the artifact's own script. Dynamic clocks, feed updates, graphs, and animations are local JavaScript.
