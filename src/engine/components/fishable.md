# FISHABLE

Stores the fishing state of a fish.

`Fishable`

| Field | Type |
| --- | --- |
| `population` | `number` |

Attach with `world.addComponentToEntity(entity, FISHABLE, data)`. Query with `world.getEntities([FISHABLE])`.

Systems: `ai`.
<!-- source-types -->

## Fishable

```ts src/engine/components/fishable.ts
export type Fishable = {
  population: number;
};
```
