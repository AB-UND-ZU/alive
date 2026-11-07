# EXERTABLE

Links a cell effect to the cast that produced it.

`Exertable`

| Field | Type |
| --- | --- |
| `castable` | `number` |

Attach with `world.addComponentToEntity(entity, EXERTABLE, data)`. Query with `world.getEntities([EXERTABLE])`.

Systems: `action`, `ai`, `damage`, `homing`, `magic`, `movement`.
<!-- source-types -->

## Exertable

```ts src/engine/components/exertable.ts
export type Exertable = {
  castable: number;
};
```
