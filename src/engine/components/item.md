# ITEM

Describes an item’s kind, material, element, quantity, and carrier.

`ConditionableStats`

| Field | Type |
| --- | --- |
| `absorb` | `number` |

`Item`

| Field | Type |
| --- | --- |
| `carrier` | `number` |
| `amount` | `number` |
| `material?` | `Material` |
| `element?` | `Element` |
| `accessory?` | `Accessory` |
| `weapon?` | `Weapon` |
| `offhand?` | `Offhand` |
| `spell?` | `Spell` |
| `skill?` | `Skill` |
| `tool?` | `Tool` |
| `stat?` | `keyof UnitStats` |
| `consume?` | `Consumable` |
| `stackable?` | `Stackable` |
| `bound` | `boolean` |

Attach with `world.addComponentToEntity(entity, ITEM, data)`. Query with `world.getEntities([ITEM])`.

Systems: `action`, `ai`, `ballistics`, `build`, `burn`, `collect`, `consume`, `damage`, `drop`, `fate`, `focus`, `harvest`, `leveling`, `magic`, `needle`, `popup`, `trigger`, `vessel`.
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
