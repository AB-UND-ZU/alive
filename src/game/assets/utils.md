# utils.ts
<!-- source-types -->

## StepAnimations

```ts src/game/assets/utils.ts
type StepAnimations = QuestSequence | NpcSequence;
```

## QuestStage

```ts src/game/assets/utils.ts
export type QuestStage<T extends StepAnimations> = {
  world: World;
  entity: Entity;
  state: SequenceState<T>;
  updated: boolean;
  finished: boolean;
};
```

## PopupSelection

```ts src/game/assets/utils.ts
export type PopupSelection = "blocked" | "selected" | "active";
```
