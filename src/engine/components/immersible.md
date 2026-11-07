# IMMERSIBLE

Marks terrain that immerses ground units.

`Immersible`

| Field | Type |
| --- | --- |
| `type` | `"water"` |
| `deep` | `boolean` |

Attach with `world.addComponentToEntity(entity, IMMERSIBLE, data)`. Query with `world.getEntities([IMMERSIBLE])`.

Systems: `build`, `freeze`, `immersion`, `water`.
<!-- source-types -->

## Immersible

```ts src/engine/components/immersible.ts
export type Immersible = {
  type: "water";
  deep: boolean;
};
```
