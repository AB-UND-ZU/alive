# BAITABLE

Links fishing bait to its caster and caught target.

`Baitable`

| Field | Type |
| --- | --- |
| `caught?` | `number` |
| `caster` | `number` |
| `amount` | `number` |

Attach with `world.addComponentToEntity(entity, BAITABLE, data)`. Query with `world.getEntities([BAITABLE])`.

Systems: `ai`, `fishing`, `trigger`.
<!-- source-types -->

## Baitable

```ts src/engine/components/baitable.ts
export type Baitable = {
  caught?: number;
  caster: number;
  amount: number;
};
```
