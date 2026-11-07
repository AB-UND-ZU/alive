# FOCUSABLE

Marks quest, enemy, or grave focus targets.

`Focusable`

| Field | Type |
| --- | --- |
| `target?` | `number` |
| `pendingTarget?` | `number` |
| `highlight?` | `"quest" \| "tombstone" \| "enemy"` |

Attach with `world.addComponentToEntity(entity, FOCUSABLE, data)`. Query with `world.getEntities([FOCUSABLE])`.

Systems: `focus`, `popup`.
<!-- source-types -->

## Focusable

```ts src/engine/components/focusable.ts
export type Focusable = {
  target?: number;
  pendingTarget?: number;
  highlight?: "quest" | "tombstone" | "enemy";
};
```
