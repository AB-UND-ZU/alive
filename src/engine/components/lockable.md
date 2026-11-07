# LOCKABLE

Describes a lock and the key material needed to open it.

`Lockable`

| Field | Type |
| --- | --- |
| `locked` | `boolean` |
| `material?` | `Material` |
| `element?` | `Element` |
| `sprite?` | `Sprite` |
| `type` | `Materialized` |

Attach with `world.addComponentToEntity(entity, LOCKABLE, data)`. Query with `world.getEntities([LOCKABLE])`.

Systems: `action`, `freeze`, `harvest`, `interact`, `trigger`.
<!-- source-types -->

## Lockable

```ts src/engine/components/lockable.ts
export type Lockable = {
  locked: boolean;
  material?: Material;
  element?: Element;
  sprite?: Sprite;
  type: Materialized;
};
```
