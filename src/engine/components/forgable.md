# Forgable

Stores the state and timing of the anvil interaction.

[Forging helpers](../../game/balancing/forging.md) create the timed steps and record hits. [Popup](../systems/popup.md) supplies the selection and confirmation input.
<!-- source-types -->

## ForgeStep

```ts src/engine/components/forgable.ts
export type ForgeStep = {
  item: Omit<Item, "carrier" | "bound" | "amount">;
  width: number;
  offset: number;
};
```

## Forgable

```ts src/engine/components/forgable.ts
export type Forgable = {
  steps: ForgeStep[];
  progress: number;
  lastElapsed: number;
  lastAction?: "swing" | "trigger" | "hit" | "miss";
  hitIndex?: number;
  completed?: Omit<Item, "carrier" | "bound" | "amount">;
};
```
