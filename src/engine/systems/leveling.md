# leveling.ts

Applies experience thresholds and class progression.
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
