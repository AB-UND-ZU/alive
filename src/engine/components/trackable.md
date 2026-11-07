# TRACKABLE

Stores a compass or marker target.

`Trackable`

| Field | Type |
| --- | --- |
| `target?` | `number` |
| `quadrant?` | `Position` |

Attach with `world.addComponentToEntity(entity, TRACKABLE, data)`. Query with `world.getEntities([TRACKABLE])`.

Systems: `fate`, `needle`, `popup`, `trigger`.
<!-- source-types -->

## Trackable

```ts src/engine/components/trackable.ts
export type Trackable = {
  target?: number;
  quadrant?: Position
};
```
