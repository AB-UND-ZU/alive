# Lootable

Marks an inventory that nearby units can loot.

[Collect](../systems/collect.md) transfers the contained items. [Drop](../systems/drop.md) removes an empty loot entity when `disposable` is true.

| Field        | Meaning                                                    |
| ------------ | ---------------------------------------------------------- |
| `disposable` | Remove this loot entity after its inventory becomes empty. |
<!-- source-types -->

## Lootable

```ts src/engine/components/lootable.ts
export type Lootable = {
  disposable: boolean;
};
```
