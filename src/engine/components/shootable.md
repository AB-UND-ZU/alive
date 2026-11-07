# SHOOTABLE

Configures ranged shooting.

`Shootable`

| Field | Type |
| --- | --- |
| `shots` | `number` |

Attach with `world.addComponentToEntity(entity, SHOOTABLE, data)`. Query with `world.getEntities([SHOOTABLE])`.

Systems: `ai`, `ballistics`, `drop`, `fate`, `homing`, `magic`, `sequence`.
<!-- source-types -->

## Shootable

```ts src/engine/components/shootable.ts
export type Shootable = {
  shots: number;
};
```
