# CONDITIONABLE

Stores active skill and tool conditions.

Attach with `world.addComponentToEntity(entity, CONDITIONABLE, data)`. Query with `world.getEntities([CONDITIONABLE])`.

Systems: `action`, `build`, `damage`, `fate`, `fishing`, `harvest`, `interact`, `magic`, `trigger`.
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
