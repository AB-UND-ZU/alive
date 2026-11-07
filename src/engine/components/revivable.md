# REVIVABLE

Controls revival state.

`Revivable`

| Field | Type |
| --- | --- |
| `available` | `boolean` |

Attach with `world.addComponentToEntity(entity, REVIVABLE, data)`. Query with `world.getEntities([REVIVABLE])`.

Systems: `fate`, `interact`.
<!-- source-types -->

## Revivable

```ts src/engine/components/revivable.ts
export type Revivable = {
  available: boolean;
};
```
