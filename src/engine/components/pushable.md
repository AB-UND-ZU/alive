# PUSHABLE

Allows an entity to initiate pushes.

Attach with `world.addComponentToEntity(entity, PUSHABLE, data)`. Query with `world.getEntities([PUSHABLE])`.

Systems: `fate`, `push`.
<!-- source-types -->

## Pushable

```ts src/engine/components/pushable.ts
export type Pushable = {};
```
