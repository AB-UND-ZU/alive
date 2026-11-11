# Spikable

Legacy cactus data retained in entity definitions.

Cactus creation still writes this legacy component, but the current [Spike](../systems/spike.md) system reads `getEntityStats(...).spike` instead of `SPIKABLE.damage`. Attaching it does not enable contact damage.
<!-- source-types -->

## Spikable

```ts src/engine/components/spikable.ts
export type Spikable = {
  damage: number;
};
```
