# Conditionable

Stores active skill and tool conditions.

[Trigger](../systems/trigger.md) starts conditions. [Harvest](../systems/harvest.md), [Fishing](../systems/fishing.md), [Build](../systems/build.md) and [Magic](../systems/magic.md) consume the relevant condition.

| Field        | Meaning                                               |
| ------------ | ----------------------------------------------------- |
| `item`       | Entity ID of the skill or tool used by the condition. |
| `generation` | Action generation used to advance the condition.      |
<!-- source-types -->

## ConditionType

```ts src/engine/components/conditionable.ts
export type ConditionType =
  | "zap"
  | "block"
  | "axe"
  | "pickaxe"
  | "shovel"
  | "hook"
  | "hammer"
  | "build";
```

## Conditionable

```ts src/engine/components/conditionable.ts
export type Conditionable = Partial<
  Record<
    ConditionType,
    {
      item: number;
      generation: number;
      modifier: number;
      amount: number;
      orientation?: Orientation;
    }
  >
>;
```
