# BUMPABLE

Records a bump direction and the generation that produced it.

`Bumpable`

| Field | Type |
| --- | --- |
| `generation` | `number` |
| `orientation?` | `Orientation` |

Attach with `world.addComponentToEntity(entity, BUMPABLE, data)`. Query with `world.getEntities([BUMPABLE])`.

Systems: `ai`, `click`, `collect`, `damage`, `fate`, `fishing`, `harvest`, `homing`, `magic`, `movement`, `spike`.
<!-- source-types -->

## Bumpable

```ts src/engine/components/bumpable.ts
export type Bumpable = {
  generation: number;
  orientation?: Orientation;
};
```
