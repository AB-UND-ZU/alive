# SOUL

Links death, ghost travel, and the tombstone.

`Soul`

| Field | Type |
| --- | --- |
| `stats` | `Pick<UnitStats, "level" \| "maxHp" \| "maxMp" \| "maxXp">` |
| `ready` | `boolean` |
| `tombstoneId?` | `number` |

Attach with `world.addComponentToEntity(entity, SOUL, data)`. Query with `world.getEntities([SOUL])`.

Systems: `fate`.
<!-- source-types -->

## Soul

```ts src/engine/components/soul.ts
export type Soul = {
  stats: Pick<UnitStats, "level" | "maxHp" | "maxMp" | "maxXp">;
  ready: boolean;
  tombstoneId?: number;
};
```
