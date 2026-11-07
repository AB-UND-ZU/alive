# MELEE

Stores an equipped melee weapon’s attack state.

`Melee`

| Field | Type |
| --- | --- |
| `facing?` | `Orientation` |
| `hits` | `0` |

Attach with `world.addComponentToEntity(entity, MELEE, data)`. Query with `world.getEntities([MELEE])`.

Systems: `collect`, `damage`, `fate`, `spike`.
<!-- source-types -->

## Melee

```ts src/engine/components/melee.ts
export type Melee = {
  facing?: Orientation;
  hits: 0;
};
```
