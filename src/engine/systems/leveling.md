# Leveling

Consumes experience thresholds and applies the class's next level stats. It also moves nearby experience drops toward eligible units.

| Helper        | Contract                                              |
| ------------- | ----------------------------------------------------- |
| getInitialXp  | Starting experience for the class                     |
| getLevelStats | Cumulative class stats at a requested level           |
| hasLevelUp    | Whether current experience reaches the next threshold |

[Class data](../../game/balancing/classes.md) defines growth. [Stats](../components/stats.md) contains current resources and maximum caps. Experience drops must be visible and within attraction range before moving toward a unit.
<!-- source-types -->

## Level

```ts src/engine/systems/leveling.ts
export type Level = {
  level: number;
  xp: number;
  maxHp: number;
  maxMp: number;
};
```
