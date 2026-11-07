# MOVABLE

Stores directional input, movement timing, reference frame, and travel state.

`Movable`

| Field | Type |
| --- | --- |
| `orientations` | `Orientation[]` |
| `pendingOrientation?` | `Orientation` |
| `momentum?` | `Orientation` |
| `reference` | `number` |
| `spring?` | `SpringConfig` |
| `lastInteraction` | `number` |
| `flying` | `boolean` |
| `swimming` | `boolean` |

Attach with `world.addComponentToEntity(entity, MOVABLE, data)`. Query with `world.getEntities([MOVABLE])`.

Systems: `action`, `ai`, `ballistics`, `build`, `click`, `collect`, `consume`, `damage`, `drop`, `enter`, `fate`, `fishing`, `freeze`, `harvest`, `homing`, `magic`, `map`, `movement.test`, `movement`, `needle`, `popup`, `push`, `renderer`, `spike`, `trigger`, `vessel`.
<!-- source-types -->

## Movable

```ts src/engine/components/movable.ts
export type Movable = {
  orientations: Orientation[];
  pendingOrientation?: Orientation;
  momentum?: Orientation;
  reference: number;
  spring?: SpringConfig;
  lastInteraction: number;
  flying: boolean;
  swimming: boolean;
};
```
