# NPC

Identifies an NPC type and its behavior data.

`Npc`

| Field | Type |
| --- | --- |
| `type` | `NpcType` |

Attach with `world.addComponentToEntity(entity, NPC, data)`. Query with `world.getEntities([NPC])`.

Systems: `ai`, `ballistics`, `consume`, `damage`, `drop`, `harvest`, `magic`, `movement`, `trigger`.
<!-- source-types -->

## NpcType

```ts src/engine/components/npc.ts
export type NpcType = (typeof npcTypes)[number];
```

## Npc

```ts src/engine/components/npc.ts
export type Npc = { type: NpcType };
```
