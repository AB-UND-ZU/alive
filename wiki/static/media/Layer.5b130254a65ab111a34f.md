# Layer

Draws one colored glyph at its stack elevation. Full-block characters use cached box geometry; other characters use cached font shapes.

| Layer state | Rendering path |
| --- | --- |
| Opaque | `Instance` in a shared batch |
| Animated opacity | Individual glyph with an animated material |
| Receives shadows | Lambert material |
| Unlit UI or effect | Basic material |

`colorFactor` darkens elevated stack layers. `offsetZ` keeps their order; `LayerProps` carries opacity, darkness and movement settings from `Sprite`.
<!-- source-types -->

## LayerProps

```ts src/renderers/three-js/Entity/Layer.tsx
export type LayerProps = {
  isTransparent: boolean;
  opacity?: SpringValue<number>;
  darkness?: SpringValue<number>;
  animatedOrigin?: Point;
  particle?: Entity;
  receiveShadow: boolean;
  colorFactor?: number;
  duration?: number;
};
```
