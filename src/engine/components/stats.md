# STATS

Stores current and maximum resources, combat attributes, caps, and bar modifiers.

`Countable`

| Field | Type |
| --- | --- |
| `hp` | `number` |
| `maxHp` | `number` |
| `maxHpCap` | `number` |
| `mp` | `number` |
| `maxMp` | `number` |
| `maxMpCap` | `number` |
| `xp` | `number` |
| `maxXp` | `number` |
| `maxXpCap` | `number` |
| `level` | `number` |

`BarModifier`

| Field | Type |
| --- | --- |
| `scale?` | `number` |
| `offsetX?` | `number` |
| `offsetY?` | `number` |

Attach with `world.addComponentToEntity(entity, STATS, data)`. Query with `world.getEntities([STATS])`.

Systems: `action`, `ai`, `ballistics`, `build`, `collect`, `consume`, `damage`, `drop`, `fate`, `harvest`, `homing`, `leveling`, `magic`, `popup`, `spike`, `trigger`.
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
