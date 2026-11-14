# Terminal screen

`getTerminalFrame` builds the native character, foreground and background grid from the shared game scene. It also draws stats, equipped actions, tabs and pause or loading overlays with the normal game sprites.

`getTerminalLayout` supplies the centered viewport bounds. `TerminalSession` supplies pause, loading and save feedback without changing the world. The native client and browser preview use this same projection; this module does not import the native React host or terminal I/O.
<!-- source-types -->

## TerminalSession

```ts src/renderers/terminal/screen.ts
export type TerminalSession = {
  paused?: boolean;
  suspended?: boolean;
  saveName?: string;
  selection?: number;
  failed?: boolean;
};
```
