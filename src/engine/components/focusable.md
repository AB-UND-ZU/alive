# Focusable

Marks quest, enemy, or grave focus targets.

[Focus](../systems/focus.md) follows target changes and creates highlights. [Trackable](trackable.md) stores the compass target.

| Field           | Meaning                                              |
| --------------- | ---------------------------------------------------- |
| `target`        | Current target entity ID.                            |
| `pendingTarget` | Next target entity ID, applied after the transition. |
<!-- source-types -->

## Focusable

```ts src/engine/components/focusable.ts
export type Focusable = {
  target?: number;
  pendingTarget?: number;
  highlight?: "quest" | "tombstone" | "enemy";
};
```
