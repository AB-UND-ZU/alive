# Homing

Tracks an effect following a target.

[Homing](../systems/homing.md) advances the stored path and target state. [AI](../systems/ai.md) creates the boss and projectile patterns that use it.
<!-- source-types -->

## Homing

```ts src/engine/components/homing.ts
export type Homing = {
  type:
    | "fireDisc"
    | "fireOrbit"
    | "healDisc"
    | "wormTower"
    | "oakTower"
    | "oakHedge"
    | "oakLily"
    | "ilexTulip"
    | "ironDisc"
    | "goldDisc"
    | "ironOrbit";
  target?: number;
  positions: Position[];
  ttl?: number;
  generation: number;
  decayedGeneration?: number;
};
```
