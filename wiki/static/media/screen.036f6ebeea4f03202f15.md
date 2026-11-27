# Terminal screen

`getTerminalFrame` builds the native character, foreground and background grid from the shared game scene. It also draws stats, equipped actions, tabs and pause or loading overlays with the normal game sprites.

Dialog tabs keep the web renderer's five-letter labels and cell positions. Tabs use full-cell backgrounds, including padding and brackets. The outer header edges remain brackets; inactive inner separators use `|`. The close X stays in its original cell. Popup arrows use black `>` on lime; Pause uses a plain white `>`. Stats bars use whole-cell fills with black empty sections; paused worlds use a quarter shade, with a caret beside the selected action, its bright palette with black text, and gray inactive buttons. Only the pause title, text and controls cover the shade; spaces between rows and beside narrower controls retain the underlying palette.

`getTerminalLayout` centers a viewport of at most 33 columns and 13 rows, matching the normal landscape browser view rather than revealing more world on a large terminal. `TerminalSession` supplies pause, loading and save feedback without changing the world. Sound and level loading use the same producer-supplied sprite rows as the other clients. A suspended frame keeps the HUD and chrome, replacing the old world contents with the loading message in the same white dialog as the web clients. Minimap terrain uses one background color and one half block per cell. The warp map uses the same sprite definitions as the web clients, including their Terminal variants. Shop prices use the single-coin symbol without changing coin item variants elsewhere. The spare footer row is used for the world, giving a 20-row browser grid a 13-row viewport. Corners always join its side borders. The frame sits below popup particles so it does not cover dialog endings on narrow screens. Stats and controls stay next to the frame, with extra terminal rows divided above and below the whole layout. The handedness setting mirrors both stats buttons and the bottom action controls. The native client and browser preview use this same projection; this module does not import the native React host or terminal I/O.
<!-- source-types -->

## TerminalSession

```ts src/renderers/terminal/screen.ts
export type TerminalSession = {
  paused?: boolean;
  suspended?: boolean;
  saving?: boolean;
  saveName?: string;
  selection?: number;
  failed?: boolean;
  flipped?: boolean;
};
```

Pause dots retain known fogged terrain colors instead of using only the gray fog background. Empty fog stays gray. Disabled quick buttons keep gray backgrounds; their underlined hotkeys use olive text.

Shop prices use the shared single-coin sprite on black. Empty gear slots use black slot symbols on gray, including unselected slots.
