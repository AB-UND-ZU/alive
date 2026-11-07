# BEHAVIOUR

Stores queued AI behavior patterns.

`Pattern`

| Field | Type |
| --- | --- |
| `name` | `\| "passive" \| "chase" \| "chase_slow" \| "prism" \| "eye" \| "orb" \| "fairy" \| "archer" \| "rose" \| "violet" \| "clover" \| "tulip" \| "ilex" \| "tutorial_boss" \| "oak_boss" \| "oak_tower" \| "oak_lily" \| "golem" \| "worm_boss" \| "chest_boss" \| "wave_tower" \| "wait" \| "action" \| "invincible" \| "vulnerable" \| "move" \| "kill" \| "heal" \| "dialog" \| "shout" \| "lock" \| "unlock" \| "collect" \| "drop" \| "sell" \| "enrage" \| "soothe" \| "tumbleweed" \| "worm" \| "fish" \| "chick" \| "spawner" \| "habitat" \| "dummy" \| "guard" \| "gate" \| "watch"` |
| `memory` | `any` |

`Behaviour`

| Field | Type |
| --- | --- |
| `patterns` | `Pattern[]` |

Attach with `world.addComponentToEntity(entity, BEHAVIOUR, data)`. Query with `world.getEntities([BEHAVIOUR])`.

Systems: `ai`, `drop`, `homing`.
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
