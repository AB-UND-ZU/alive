# BURNABLE

Tracks active fire, simmering, combustion, and decay.

`Burnable`

| Field | Type |
| --- | --- |
| `burning` | `boolean` |
| `eternal` | `boolean` |
| `simmer` | `boolean` |
| `combusted` | `boolean` |
| `decayed` | `boolean` |

Attach with `world.addComponentToEntity(entity, BURNABLE, data)`. Query with `world.getEntities([BURNABLE])`.

Systems: `burn`, `drop`, `harvest`, `homing`, `magic`, `water`.
<!-- source-types -->

## Burnable

```ts src/engine/components/burnable.ts
export type Burnable = {
  burning: boolean;
  eternal: boolean;
  simmer: boolean;
  combusted: boolean;
  decayed: boolean;
};
```
