# NPC

Identifies an NPC type and its behavior data.

[Unit data](../../game/balancing/units.md) resolves this key into stats, equipment and behavior. [Damage](../systems/damage.md) and abilities can apply NPC-specific equipment values.
<!-- source-types -->

## NpcType

```ts src/engine/components/npc.ts
export type NpcType = (typeof npcTypes)[number];
```

## Npc

```ts src/engine/components/npc.ts
export type Npc = { type: NpcType };
```
