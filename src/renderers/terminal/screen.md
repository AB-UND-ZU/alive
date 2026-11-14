# Terminal screen

`getTerminalFrame` builds the native character, foreground and background grid from the shared game scene. It also draws stats, equipped actions, tabs and pause or loading overlays with the normal game sprites.

Dialog tabs keep the web renderer's five-letter labels and cell positions. Vertical separators become brackets around the active tab. The close X stays in its original cell. Active arrows use black `>` on lime. Stats bars use whole-cell fills; paused worlds use a quarter shade, with a caret beside the selected action and gray inactive buttons. Only the pause title, text and controls cover the shade; spaces between rows and beside narrower controls retain the underlying palette.

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
