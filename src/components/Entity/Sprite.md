# Sprite

Draws an ordered set of sprite layers.

```tsx
AnimatedSprite({
  sprite,
  facing,
  amount,
  offsetX,
  offsetY,
  offsetZ,
  layerProps,
}: SpriteProps)
Sprite({
  sprite,
  facing,
  amount,
  offsetX,
  offsetY,
  offsetZ,
  layerProps,
}: SpriteProps)
```
<!-- source-types -->

## SpriteProps

```ts src/components/Entity/Sprite.tsx
type SpriteProps = {
  sprite: SpriteType;
  facing?: Orientation;
  amount?: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  layerProps: LayerProps;
};
```
