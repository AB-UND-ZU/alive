# COLLECTABLE

Configures how an entity collects nearby drops.

Attach with `world.addComponentToEntity(entity, COLLECTABLE, data)`. Query with `world.getEntities([COLLECTABLE])`.

Systems: `collect`, `fate`.
<!-- source-types -->

## Collectable

```ts src/engine/components/collectable.ts
export type Collectable = {};
```
