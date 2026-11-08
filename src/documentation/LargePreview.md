# Large Preview

`LargePreview` accepts an existing item or unit sprite. It composes the game's sprite layers through the shared font masks. Each output character holds two source pixels, using upper and lower half blocks.

`previewRows` trims empty and black margins before pairing pixels. An optional shared `bounds` from `previewBounds` keeps related portraits on the same pixel coordinates. Standalone portraits still trim their own margins. An odd last pixel row keeps a black lower half. Empty sprites produce no cells. Every output cell uses the normal documentation character size.

A `grid` renders multi-cell bodies in both directions, preserving the complete native arrangement before cropping the outer margins. Rotten uses the three actual cell-factory fragments.

World objects spanning several vertical cells can pass a `sprites` array. Their pixel grids are joined before cropping, preserving the alignment of an Oak's canopy and trunk while removing only the outer margins.

Character definitions may include a backdrop. It is merged before the character's sprite, using the game's sprite compositor. Unit portraits supplied by `getUnitSprite` already include their backdrop and visible equipment.
<!-- source-types -->

## PreviewBounds

```ts src/documentation/LargePreview.tsx
export type PreviewBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};
```
