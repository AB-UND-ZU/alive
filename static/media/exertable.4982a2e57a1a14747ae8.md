# Exertable

Links a cell effect to the cast that produced it.

[Magic](../systems/magic.md) resolves `castable` as the owning cast entity. Multiple area cells can therefore share one cast and its hit history.

| Field      | Meaning                                           |
| ---------- | ------------------------------------------------- |
| `castable` | Entity ID of the cast that owns this effect cell. |
<!-- source-types -->

## Exertable

```ts src/engine/components/exertable.ts
export type Exertable = {
  castable: number;
};
```
