# Reference

Stores a clock interval, elapsed time, and suspension state.

[Tick](../systems/tick.md) advances the clock. [Movement](../systems/movement.md) and other action systems read its render generation to run once per action interval.

| Field               | Meaning                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `tick`              | Action interval in milliseconds.                                                                  |
| `delta`             | Accumulated elapsed milliseconds.                                                                 |
| `suspensionCounter` | -1: keep ticking; 0: suspend at the next ready tick; positive: remaining ticks before suspension. |
<!-- source-types -->

## Reference

```ts src/engine/components/reference.ts
export type Reference = {
  tick: number;
  delta: number;
  suspended: boolean;
  suspensionCounter: number;
};
```
