# ATTACKABLE

Marks a target as attackable and configures its scratch effect.

`Attackable`

| Field | Type |
| --- | --- |
| `scratchColor?` | `string` |

Attach with `world.addComponentToEntity(entity, ATTACKABLE, data)`. Query with `world.getEntities([ATTACKABLE])`.

Systems: `ai`, `damage`, `fate`, `homing`, `magic`, `spike`, `trigger`.
<!-- source-types -->

## Attackable

```ts src/engine/components/attackable.ts
export type Attackable = {
  scratchColor?: string;
};
```
