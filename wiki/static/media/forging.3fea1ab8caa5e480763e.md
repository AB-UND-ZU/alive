# Forging Rules

Defines supported material/element upgrades and their timed forging steps. The base item and ingredient are checked against live inventory before a result becomes available.

| Function         | Contract                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------- |
| getForgeOptions  | Upgrades for an item's kind, material and element; none without a supported kind/material |
| getForgeStatus   | Resolve selected inventory items, matching option and ingredient amount                   |
| forgingCompleted | Whether all current forging steps are complete                                            |
| getForgingSteps  | Timed step data for the selected upgrade                                                  |
| performForgeHit  | Apply a swing/hit to the current anvil state                                              |

| Data          | Meaning                                         |
| ------------- | ----------------------------------------------- |
| forgableSlots | Equipment slots supported by upgrade generation |
| forgeStats    | Generated material/element upgrade options      |
| forgeTicks    | Timing scale for forging steps                  |
| hittingOffset | Offset of the hit indicator                     |
| hittingWidth  | Full indicator width                            |
| hittingArea   | Active hit area                                 |

`getForgeStatus` distinguishes an invalid selection, selecting the same item twice, and insufficient ingredient quantity. A valid base selection can be shown before an ingredient is chosen.

[Popup](../../engine/systems/popup.md) controls selection; [Forgable](../../engine/components/forgable.md) stores the running attempt. Keep upgrade rules here rather than duplicating them in a dialog or example.
<!-- source-types -->

## ForgeOption

```ts src/game/balancing/forging.ts
export type ForgeOption = {
  base: Omit<Item, "carrier" | "bound">;
  add: Omit<Item, "carrier" | "bound">;
  result: Omit<Item, "carrier" | "bound" | "amount">;
};
```

## ForgeOptionResult

```ts src/game/balancing/forging.ts
export type ForgeOptionResult = Omit<ForgeOption, "result"> & {
  result: Omit<Item, "carrier" | "bound">;
};
```

## ForgeStatus

```ts src/game/balancing/forging.ts
export type ForgeStatus = {
  forgeable: boolean;
  duplicate: boolean;
  insufficient?: Omit<Item, "carrier" | "bound">;
  baseItem?: Omit<Item, "carrier" | "bound">;
  addItem?: Omit<Item, "carrier" | "bound">;
  resultItem?: Omit<Item, "carrier" | "bound">;
};
```
