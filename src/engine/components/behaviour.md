# Behaviour

Stores queued AI behavior patterns.

[AI](../systems/ai.md) dispatches each pattern by name. Its `memory` belongs to that pattern; it is not shared between all units.
<!-- source-types -->

## Pattern

```ts src/engine/components/behaviour.ts
export type Pattern = {
  name:
    | "passive"
    | "chase"
    | "chase_slow"
    | "prism"
    | "eye"
    | "orb"
    | "fairy"
    | "archer"
    | "rose"
    | "violet"
    | "clover"
    | "tulip"
    | "ilex"
    | "tutorial_boss"
    | "oak_boss"
    | "oak_tower"
    | "oak_lily"
    | "golem"
    | "worm_boss"
    | "worm_tower"
    | "chest_boss"
    | "wave_tower"
    | "wait"
    | "action"
    | "invincible"
    | "vulnerable"
    | "move"
    | "kill"
    | "heal"
    | "dialog"
    | "shout"
    | "lock"
    | "unlock"
    | "collect"
    | "drop"
    | "sell"
    | "enrage"
    | "soothe"
    | "tumbleweed"
    | "worm"
    | "fish"
    | "chick"
    | "spawner"
    | "habitat"
    | "dummy"
    | "guard"
    | "gate"
    | "watch";
  memory: any;
};
```

## Behaviour

```ts src/engine/components/behaviour.ts
export type Behaviour = {
  patterns: Pattern[];
};
```
