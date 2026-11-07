# AFFECTABLE

Tracks damage over time, burn and freeze effects, and per-cast proc application.

`Affectable`

| Field | Type |
| --- | --- |
| `dot` | `number` |
| `burn` | `number` |
| `freeze` | `number` |
| `procs` | `Record<string, number>` |

Attach with `world.addComponentToEntity(entity, AFFECTABLE, data)`. Query with `world.getEntities([AFFECTABLE])`.

Systems: `ai`, `burn`, `damage`, `fate`, `freeze`, `magic`, `water`.
<!-- source-types -->

## Affectable

```ts src/engine/components/affectable.ts
export type Affectable = {
  dot: number;
  burn: number;
  freeze: number;
  procs: Record<string, number>;
};
```
