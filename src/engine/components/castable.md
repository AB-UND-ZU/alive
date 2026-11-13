# Castable

Describes a spell’s damage, effects, range, caster, and hit tracking.

[Trigger](../systems/trigger.md) creates casts. [Magic](../systems/magic.md) applies them to targets; [Damage](../systems/damage.md) supplies damage and relationship checks.

| Field      | Meaning                                                                     |
| ---------- | --------------------------------------------------------------------------- |
| `caster`   | Entity ID used for ownership and faction checks.                            |
| `affected` | Per-target hit history for this cast; shared by its area cells.             |
| `trigger`  | Optional contact trigger with a delay, active duration and reference frame. |

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
    trigger?: { delay: number; duration: number; frame?: number };
    affected: Record<
      string,
      { generation: number; delta: number; frame?: number }
    >;
  };
```
