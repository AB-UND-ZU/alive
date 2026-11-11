# Stack

Renders the ordered segments returned for an entity's body, items and effects. Each segment supplies a sprite, orientation, amount, offsets and layer properties.

World offsets are converted to renderer coordinates. The number of preceding glyph layers determines each segment's elevation. Segments with an animated origin use `AnimatedSprite`; the others use `Sprite`.
<!-- source-types -->

## Segment

```ts src/components/Entity/Stack.tsx
export type Segment = {
  id: number;
  sprite: SpriteType;
  facing?: Orientation;
  amount?: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  layerProps: LayerProps;
};
```
