# PROJECTILE

Stores projectile travel and impact data.

`Projectile`

| Field | Type |
| --- | --- |
| `damage` | `number` |
| `material` | `Material` |
| `moved` | `boolean` |
| `shadow` | `boolean` |

Attach with `world.addComponentToEntity(entity, PROJECTILE, data)`. Query with `world.getEntities([PROJECTILE])`.

Systems: `ballistics`.
<!-- source-types -->

## Projectile

```ts src/engine/components/projectile.ts
export type Projectile = {
  damage: number;
  material: Material;
  moved: boolean;
  shadow: boolean;
};
```
