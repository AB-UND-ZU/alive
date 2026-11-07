# Stack

Draws a quantity-dependent item stack.

```tsx
Stack({
  segments,
  layerCount,
}: {
  segments: Segment[];
  layerCount: number;
})
```
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
