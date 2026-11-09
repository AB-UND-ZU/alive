# Sprite

Expands a sprite into ordered `Layer` components. `getFacingLayers` selects its direction and amount variant before rendering, so the renderer uses the same sprite definitions as game UI.

`Sprite` applies cell offsets and shared layer properties. `AnimatedSprite` additionally moves from the supplied animated origin. The parent stack supplies the elevation used to keep one segment above another.

Both skip rendering while sprite, facing, amount, offsets and layer properties are unchanged. Particles of one entity are rendered together, so a spawning rain drop or rising smoke puff would otherwise rerender all of its siblings.
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
