# consume.ts

Uses carried items and automatic potion doses.

When installing systems on a restored world, initialize cached vision, haste and equipped-item stats from the saved hero. Loading must not apply equipment bonuses a second time. See [saved games](../../game/saves/index.md).
<!-- source-types -->

## StackableConsumption

```ts src/engine/systems/consume.ts
export type StackableConsumption = {
  amount: number;
  percentage?: boolean;
  countable: keyof Countable;
};
```

## ItemConsumption

```ts src/engine/systems/consume.ts
export type ItemConsumption = StackableConsumption & {
  item: TypedEntity<"ITEM">;
};
```
