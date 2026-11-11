# POI

Marks a point of interest.

The map popup draws `sprite` instead of the entity's world sprite. [Fog](fog.md) determines whether the point has been discovered.
<!-- source-types -->

## Poi

```ts src/engine/components/poi.ts
export type Poi = {
  sprite: Sprite;
};
```
