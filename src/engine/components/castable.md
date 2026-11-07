# CASTABLE

Describes a spell’s damage, effects, range, caster, and hit tracking.

`ProcStats`

| Field | Type |
| --- | --- |
| `drain` | `number` |
| `knock` | `number` |

`BuffStats`

| Field | Type |
| --- | --- |
| `addHaste` | `number` |
| `addPower` | `number` |
| `addArmor` | `number` |
| `addWisdom` | `number` |
| `addResist` | `number` |

`AbilityStats`

| Field | Type |
| --- | --- |
| `duration` | `number` |
| `range` | `number` |
| `retrigger` | `number` |
| `reproc` | `number` |

Attach with `world.addComponentToEntity(entity, CASTABLE, data)`. Query with `world.getEntities([CASTABLE])`.

Systems: `action`, `ai`, `burn`, `damage`, `drop`, `homing`, `leveling`, `magic`, `movement`, `trigger`.
<!-- source-types -->

## DamageType

```ts src/engine/components/castable.ts
export type DamageType = "melee" | "magic" | "true";
```

## MarkerType

```ts src/engine/components/castable.ts
export type MarkerType = DamageType | "heal";
```

## EffectType

```ts src/engine/components/castable.ts
export type EffectType = "burn" | "freeze" | "heal";
```

## ProcStats

```ts src/engine/components/castable.ts
export type ProcStats = { drain: number; knock: number };
```

## BuffStats

```ts src/engine/components/castable.ts
export type BuffStats = {
  addHaste: number;
  addPower: number;
  addArmor: number;
  addWisdom: number;
  addResist: number;
};
```

## AbilityStats

```ts src/engine/components/castable.ts
export type AbilityStats = {
  duration: number;
  range: number;
  retrigger: number;
  reproc: number;
};
```

## Castable

```ts src/engine/components/castable.ts
export type Castable = {
  [K in DamageType]: number;
} & {
  [K in EffectType]: number;
} & ProcStats &
  BuffStats & {
    caster: number;
    cascade?: number;
    retrigger: number;
    reproc: number;
    forceAffecting: boolean;
    affected: Record<
      string,
      { generation: number; delta: number; frame?: number }
    >;
  };
```
