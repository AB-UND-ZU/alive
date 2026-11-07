# SPAWNABLE

Stores class, appearance, light, and spawn position.

`Spawnable`

| Field | Type |
| --- | --- |
| `classKey` | `ClassKey` |
| `hairColor` | `string` |
| `position` | `Position` |
| `light` | `Light` |
| `viewable` | `Viewable` |
| `compassId?` | `number` |
| `quest?` | `SequenceState<QuestSequence>` |

Attach with `world.addComponentToEntity(entity, SPAWNABLE, data)`. Query with `world.getEntities([SPAWNABLE])`.

Systems: `drop`, `fate`, `leveling`, `text`, `trigger`.
<!-- source-types -->

## Spawnable

```ts src/engine/components/spawnable.ts
export type Spawnable = {
  classKey: ClassKey;
  hairColor: string;
  position: Position;
  light: Light;
  viewable: Viewable;
  compassId?: number;
  quest?: SequenceState<QuestSequence>;
};
```
