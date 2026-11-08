# Soul

Links death, ghost travel, and the tombstone.

[Fate](../systems/fate.md) preserves revival stats and the optional tombstone ID while the player travels as a ghost.
<!-- source-types -->

## Soul

```ts src/engine/components/soul.ts
export type Soul = {
  stats: Pick<UnitStats, "level" | "maxHp" | "maxMp" | "maxXp">;
  ready: boolean;
  tombstoneId?: number;
};
```
