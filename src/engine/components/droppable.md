# DROPPABLE

Tracks decay and loot release.

`Droppable`

| Field | Type |
| --- | --- |
| `decayed` | `boolean` |
| `evaporate?` | `{ sprite: Sprite; fast: boolean }` |

Attach with `world.addComponentToEntity(entity, DROPPABLE, data)`. Query with `world.getEntities([DROPPABLE])`.

Systems: `ai`, `drop`, `fate`, `harvest`, `homing`, `magic`, `trigger`.
<!-- source-types -->

## Droppable

```ts src/engine/components/droppable.ts
export type Droppable = {
  decayed: boolean;
  evaporate?: { sprite: Sprite; fast: boolean };
};
```
