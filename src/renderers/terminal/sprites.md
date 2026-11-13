# Terminal sprite cells

`TerminalCell` contains one Unicode character, a foreground color and an
optional background color. An absent background lets the cell beneath show.
`projectSprite` selects the normal facing/amount layers before projection;
`projectLayers` also accepts layers already selected by the shared scene.

See [Terminal renderer](./index.md) for character mappings and the pixel-mask
fallback. No sprite assets or engine rules are changed by this projection.

<!-- source-types -->

## TerminalCell

```ts src/renderers/terminal/sprites.ts
export type TerminalCell = {
  char: string;
  foreground: string;
  background?: string;
};
```
