# Particle

Configures a temporary visual particle.

[Sequence](../systems/sequence.md) owns particle lifetime through its sequence state. Remove sequence particles with the sequence disposal helpers.
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
