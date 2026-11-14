# Terminal screen

`getTerminalFrame` builds the native character, foreground and background grid from the shared game scene. It also draws stats, equipped actions, tabs and pause or loading overlays with the normal game sprites.

Multiple dialog tabs use five cells each, including brackets. Their labels use the first three letters, keeping the tabs and close button inside the normal 19-cell dialog frame. A single tab keeps its full label.

`getTerminalLayout` centers a viewport of at most 33 columns and 13 rows, matching the normal landscape browser view rather than revealing more world on a large terminal. `TerminalSession` supplies pause, loading and save feedback without changing the world. The native client and browser preview use this same projection; this module does not import the native React host or terminal I/O.

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
