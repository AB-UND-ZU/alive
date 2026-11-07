# BLOCKABLE

Marks a cell as blocking movement or interaction.

Attach with `world.addComponentToEntity(entity, BLOCKABLE, data)`. Query with `world.getEntities([BLOCKABLE])`.

Systems: `action`.
<!-- source-types -->

## Blockable

```ts src/engine/components/blockable.ts
export type Blockable = {};
```
