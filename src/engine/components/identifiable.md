# IDENTIFIABLE

Names an entity for quests, commands, and lookups.

`Identifiable`

| Field | Type |
| --- | --- |
| `name` | `string` |

Attach with `world.addComponentToEntity(entity, IDENTIFIABLE, data)`. Query with `world.getEntities([IDENTIFIABLE])`.

Systems: `ai`, `collect`, `damage`, `drop`, `homing`, `interact`, `trigger`.
<!-- source-types -->

## Identifiable

```ts src/engine/components/identifiable.ts
export type Identifiable = {
  name: string;
};
```
