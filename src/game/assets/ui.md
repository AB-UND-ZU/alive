# UI sprites

`createText` creates one sprite per character. `createButton` stacks button backgrounds, text, edges, and highlight layers. `underline` adds the underscore layer used on hover.

`createTab(title, width, selected, instant)` is shared by popup tabs and wiki sections. The selected state uses black text on a white background; the inactive state uses white text with the gray lower-half background. Instant popups use the existing yellow/olive palette.

`pixelFrame` in `pixels.ts` builds character frames. Keyboard key and socket sprites are defined in `sprites/particles.ts` and composed by `components/Keyboard`.
<!-- source-types -->

## Palette

```ts src/game/assets/ui.ts
export type Palette = keyof typeof buttonPalettes;
```

## Stats

```ts src/game/assets/ui.ts
export type Stats = UnitStats & ItemStats;
```
