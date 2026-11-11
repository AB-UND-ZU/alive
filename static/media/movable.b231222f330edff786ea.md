# Movable

Stores directional input, movement timing, reference frame, and travel state.

[Movement](../systems/movement.md) consumes directional input when the referenced clock advances. Other actions set `lastInteraction` to prevent a second action in that generation.

| Field             | Meaning                                                     |
| ----------------- | ----------------------------------------------------------- |
| `orientations`    | Ordered movement input; the first direction is tried first. |
| `reference`       | Entity ID of the action clock.                              |
| `lastInteraction` | Last action generation already consumed, not a timestamp.   |
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
