# Projectile

Stores projectile travel and impact data.

[Ballistics](../systems/ballistics.md) resolves travel and impact. The running arrow sequence holds its origin, range and caster.
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
