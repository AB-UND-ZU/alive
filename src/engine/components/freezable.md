# FREEZABLE

Tracks freezing and thawing.

`Freezable`

| Field | Type |
| --- | --- |
| `frozen` | `boolean` |

Attach with `world.addComponentToEntity(entity, FREEZABLE, data)`. Query with `world.getEntities([FREEZABLE])`.

Systems: `freeze`.
<!-- source-types -->

## Freezable

```ts src/engine/components/freezable.ts
export type Freezable = {
  frozen: boolean;
};
```
