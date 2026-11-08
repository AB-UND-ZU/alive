# Stats

Stores current and maximum resources, combat attributes, caps, and bar modifiers.

[Consume](../systems/consume.md) applies equipment changes; [Damage](../systems/damage.md) changes health; [Leveling](../systems/leveling.md) grows class stats.

| Field      | Meaning                                                   |
| ---------- | --------------------------------------------------------- |
| `hp`       | May be fractional even when the HUD shows a whole number. |
| `maxHpCap` | Limit when increasing maximum health.                     |
| `maxMpCap` | Limit when increasing maximum mana.                       |
| `maxXpCap` | Stored cap field; current XP thresholds come from the class level table.           |
<!-- source-types -->

## Countable

```ts src/engine/components/stats.ts
export type Countable = {
  hp: number;
  maxHp: number;
  maxHpCap: number;

  mp: number;
  maxMp: number;
  maxMpCap: number;

  xp: number;
  maxXp: number;
  maxXpCap: number;

  level: number;
};
```

## Attributes

```ts src/engine/components/stats.ts
export type Attributes = Pick<Countable, "maxHp" | "maxMp"> & {
  power: number;
  wisdom: number;
  armor: number;
  resist: number;
  haste: number;
  vision: number;
  damp: number;
  thaw: number;
  spike: number;
};
```

## BarModifier

```ts src/engine/components/stats.ts
export type BarModifier = {
  scale?: number;
  offsetX?: number;
  offsetY?: number;
};
```

## UnitStats

```ts src/engine/components/stats.ts
export type UnitStats = Countable & Attributes;
```

## Stats

```ts src/engine/components/stats.ts
export type Stats = UnitStats & BarModifier;
```

## UnitStat

```ts src/engine/components/stats.ts
export type UnitStat = (typeof unitStats)[number];
```
