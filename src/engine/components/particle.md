# PARTICLE

Configures a temporary visual particle.

`Particle`

| Field | Type |
| --- | --- |
| `offsetX` | `number` |
| `offsetY` | `number` |
| `offsetZ` | `number` |
| `animatedOrigin?` | `Point` |
| `amount?` | `number` |
| `duration?` | `number` |

Attach with `world.addComponentToEntity(entity, PARTICLE, data)`. Query with `world.getEntities([PARTICLE])`.

Systems: `sequence`.
<!-- source-types -->

## Particle

```ts src/engine/components/particle.ts
export type Particle = {
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  animatedOrigin?: Point;
  amount?: number
  duration?: number
};
```
