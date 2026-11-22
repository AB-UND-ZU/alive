# Browser Renderer

The build fixes this component to Excalibur, ThreeJS or HTML with `REACT_APP_RENDERER`. Each branch imports only its selected renderer. Terminal uses its own entry and chrome.

Development previews may select a renderer by client path or query; those runtime branches are omitted from production builds. `scripts/build-clients.mjs` checks emitted source maps for renderer isolation.
<!-- source-types -->

## BrowserRendererName

```ts src/renderers/browser.tsx
export type BrowserRendererName = "excalibur" | "three-js" | "html";
```
