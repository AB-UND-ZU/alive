# Entity segments

`getSegments` composes existing character sprites into the ordered parts of an entity: shadow, backdrop, offhand, body and weapon. It reads equipment, facing, swimming and life state from the engine. Draw heights and segment offsets are shared data, independent of a React host.

`getLayerCount` counts resolved sprite layers. Rendering options are carried as generic layer props so each renderer can supply its own representation without putting host objects in engine components.
<!-- source-types -->

## RenderLayerProps

```ts src/renderers/interface/segments.ts
export type RenderLayerProps = {
  isTransparent: boolean;
  receiveShadow: boolean;
};
```

## Segment

```ts src/renderers/interface/segments.ts
export type Segment<Props extends RenderLayerProps = RenderLayerProps> = {
  id: number;
  sprite: Sprite;
  facing?: import("../../engine/components/orientable").Orientation;
  amount?: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  layerProps: Props;
};
```
