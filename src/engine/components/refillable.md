# REFILLABLE

Stores a refillable resource or container state.

`Refillable`

| Field | Type |
| --- | --- |
| `element` | `Element` |

Attach with `world.addComponentToEntity(entity, REFILLABLE, data)`. Query with `world.getEntities([REFILLABLE])`.

Systems: `harvest`.
<!-- source-types -->

## Refillable

```ts src/engine/components/refillable.ts
export type Refillable = {
  element: Element;
};
```
