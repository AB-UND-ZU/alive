# RECHARGABLE

Tracks charge regeneration.

`Rechargable`

| Field | Type |
| --- | --- |
| `hit` | `boolean` |

Attach with `world.addComponentToEntity(entity, RECHARGABLE, data)`. Query with `world.getEntities([RECHARGABLE])`.

Systems: `ai`, `damage`, `drop`.
<!-- source-types -->

## Rechargable

```ts src/engine/components/rechargable.ts
export type Rechargable = {
  hit: boolean;
};
```
