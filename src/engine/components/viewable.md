# VIEWABLE

Defines camera activation, priority, spring, and fractional position.

`Viewable`

| Field | Type |
| --- | --- |
| `active` | `boolean` |
| `priority` | `number` |
| `spring?` | `SpringConfig` |
| `fraction?` | `Position` |

Attach with `world.addComponentToEntity(entity, VIEWABLE, data)`. Query with `world.getEntities([VIEWABLE])`.

Systems: `ai`, `enter`, `fate`, `initialize`, `interact`, `popup`, `trigger`.
<!-- source-types -->

## Viewable

```ts src/engine/components/viewable.ts
export type Viewable = {
  active: boolean;
  priority: number; // 10 - hero, 30 - spawn, 50 - buildings, 90 - popups
  spring?: SpringConfig;
  fraction?: Position;
};
```
