# Spawnable

Stores class, appearance, light, and spawn position.

[Fate](../systems/fate.md) restores the saved appearance, vision and viewpoint when respawning. `position` is the return point, not the current [Position](position.md).
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
