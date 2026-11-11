# Item

Describes an item’s kind, material, element, quantity, and carrier.

[Collect](../systems/collect.md) changes item ownership; [Consume](../systems/consume.md) applies usable items and equipment. Keep `carrier` and the holder's [Inventory](inventory.md) in sync.

| Field     | Meaning                                                                                 |
| --------- | --------------------------------------------------------------------------------------- |
| `carrier` | Holder entity ID; -1 means no carrier.                                                  |
| `bound`   | Bound items are excluded from normal death drops.                                       |
| `amount`  | Stack size or remaining doses; some NPC equipment uses zero to hide its inventory icon. |
<!-- source-types -->

## Element

```ts src/engine/components/item.ts
export type Element = (typeof elements)[number];
```

## Material

```ts src/engine/components/item.ts
export type Material = (typeof materials)[number];
```

## Weapon

```ts src/engine/components/item.ts
export type Weapon = (typeof weapons)[number];
```

## Offhand

```ts src/engine/components/item.ts
export type Offhand = (typeof offhands)[number];
```

## Spell

```ts src/engine/components/item.ts
export type Spell = (typeof spells)[number];
```

## Ranged

```ts src/engine/components/item.ts
export type Ranged = (typeof ranged)[number];
```

## Rechargables

```ts src/engine/components/item.ts
export type Rechargables = (typeof rechargables)[number];
```

## Skill

```ts src/engine/components/item.ts
export type Skill = Ranged | Rechargables;
```

## Tool

```ts src/engine/components/item.ts
export type Tool = (typeof tools)[number];
```

## Consumable

```ts src/engine/components/item.ts
export type Consumable = (typeof consumables)[number];
```

## Materialized

```ts src/engine/components/item.ts
export type Materialized = (typeof materialized)[number];
```

## Craftable

```ts src/engine/components/item.ts
export type Craftable = (typeof craftables)[number];
```

## ResourceItem

```ts src/engine/components/item.ts
export type ResourceItem = typeof resourceItem;
```

## Reloadable

```ts src/engine/components/item.ts
export type Reloadable = (typeof reloadables)[number];
```

## Stackable

```ts src/engine/components/item.ts
export type Stackable = (typeof stackables)[number];
```

## ConditionableStats

```ts src/engine/components/item.ts
export type ConditionableStats = { absorb: number };
```

## ItemStats

```ts src/engine/components/item.ts
export type ItemStats = Attributes &
  ProcStats &
  ConditionableStats &
  AbilityStats &
  BuffStats &
  HarvestStats &
  Pick<Castable, DamageType | EffectType>;
```

## Item

```ts src/engine/components/item.ts
export type Item = {
  carrier: number;
  amount: number;
  material?: Material;
  element?: Element;
  accessory?: Accessory;
  weapon?: Weapon;
  offhand?: Offhand;
  spell?: Spell;
  skill?: Skill;
  tool?: Tool;
  stat?: keyof UnitStats;
  consume?: Consumable;
  stackable?: Stackable;
  bound: boolean;
};
```
