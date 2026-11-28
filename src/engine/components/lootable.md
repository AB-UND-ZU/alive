# Lootable

Marks an inventory that nearby units can loot.

[Collect](../systems/collect.md) transfers the contained items. [Drop](../systems/drop.md) removes an empty loot entity when `disposable` is true.

| Field        | Meaning                                                    |
| ------------ | ---------------------------------------------------------- |
| `disposable` | Remove this loot entity after its inventory becomes empty. |
| `crack` | Current hatch frame of a loose egg. |
| `droppedBy` | The player who dropped an item from their bag, or the pet that delivered it. |
| `offering` | Directs a favourite food’s XP to the pet that ate it. |
<!-- source-types -->

## Lootable

```ts src/engine/components/lootable.ts
export type Lootable = {
  disposable: boolean;
  crack?: number;
  droppedBy?: number;
  offering?: XpSequence["offering"];
};
```
