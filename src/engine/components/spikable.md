# SPIKABLE

Configures contact damage.

`Spikable`

| Field | Type |
| --- | --- |
| `damage` | `number` |

Attach with `world.addComponentToEntity(entity, SPIKABLE, data)`. Query with `world.getEntities([SPIKABLE])`.
<!-- source-types -->

## Spikable

```ts src/engine/components/spikable.ts
export type Spikable = {
  damage: number;
};
```
