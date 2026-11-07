# COLLIDABLE

Marks a solid obstacle.

Attach with `world.addComponentToEntity(entity, COLLIDABLE, data)`. Query with `world.getEntities([COLLIDABLE])`.

Systems: `ai`, `magic`, `movement`.
<!-- source-types -->

## Collidable

```ts src/engine/components/collidable.ts
export type Collidable = {};
```
