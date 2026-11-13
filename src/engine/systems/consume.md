# Consume

Applies usable inventory items, automatic potion doses and equipment stat changes.

| Change                      | Work                                              |
| --------------------------- | ------------------------------------------------- |
| Consumable becomes eligible | Start consumption and reduce its remaining amount |
| Equipment changes           | Apply the difference in equipment bonuses         |
| Haste or vision changes     | Update the action clock or light radius           |

Consumption is skipped while an existing consumption or popup blocks it. Potion cooldowns are tracked per carrier and item.

When installing systems on a restored world, initialize cached vision, haste and equipment stats from the saved hero. Loading must not add bonuses again. An active vision sequence seeds the vision cache from its target, so pending equipment changes are retried after it finishes. Otherwise, preserve the saved light, including level-provided radii. Cache a new vision target only when outside and no vision sequence is active; changes made during an animation or indoors remain pending until they can be applied. See [saved games](../../game/saves/index.md) and the received-state effects in [Magic](magic.md).
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
