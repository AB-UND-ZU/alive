# Blockable

Marks an entity that blocks other interaction targets in its cell.

`getBlockable` in [Action](../systems/action.md) checks this marker before choosing another target in the cell. Solid movement obstacles use [Collidable](collidable.md).
<!-- source-types -->

## Blockable

```ts src/engine/components/blockable.ts
export type Blockable = {};
```
