# Browser renderer

The game uses Three.js by default. Open `?renderer=html` to use HTML and SVG instead, or `?test&renderer=html` to enable chat commands too. Both renderers share the normal keyboard, mouse and touch controls, saves and dialogs.

`Terminal` can also select a renderer through its `renderer` prop. The HTML implementation loads on demand. Its scene advances the same fixed-step world clock, without lighting or shadows.
<!-- source-types -->

## BrowserRendererName

```ts src/renderers/browser.tsx
export type BrowserRendererName = "three-js" | "html";
```
