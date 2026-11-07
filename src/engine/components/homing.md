# HOMING

Tracks an effect following a target.

`Homing`

| Field | Type |
| --- | --- |
| `type` | `"oakTower" \| "oakHedge" \| "oakLily" \| "ilexTulip" \| "ironDisc" \| "goldDisc" \| "ironOrbit"` |
| `target?` | `number` |
| `positions` | `Position[]` |
| `ttl?` | `number` |
| `generation` | `number` |
| `decayedGeneration?` | `number` |

Attach with `world.addComponentToEntity(entity, HOMING, data)`. Query with `world.getEntities([HOMING])`.

Systems: `ai`, `homing`, `magic`.
<!-- source-types -->

## Homing

```ts src/engine/components/homing.ts
export type Homing = {
  type: "oakTower" | "oakHedge" | "oakLily" | "ilexTulip" | "ironDisc" | "goldDisc" | "ironOrbit";
  target?: number;
  positions: Position[];
  ttl?: number;
  generation: number;
  decayedGeneration?: number;
};
```
