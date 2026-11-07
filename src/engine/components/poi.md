# POI

Marks a point of interest.

`Poi`

| Field | Type |
| --- | --- |
| `sprite` | `Sprite` |

Attach with `world.addComponentToEntity(entity, POI, data)`. Query with `world.getEntities([POI])`.
<!-- source-types -->

## Poi

```ts src/engine/components/poi.ts
export type Poi = {
  sprite: Sprite;
};
```
