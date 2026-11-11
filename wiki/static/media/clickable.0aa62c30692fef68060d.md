# Clickable

Records a pending pointer click.

[Click](../systems/click.md) turns the pending click into movement or interaction. [Freeze](../systems/freeze.md) also handles clicks on snow cover.
<!-- source-types -->

## Clickable

```ts src/engine/components/clickable.ts
export type Clickable = {
  clicked: boolean;
  player: boolean;
};
```
