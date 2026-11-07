# LAYER

Stores structure-layer membership for indoor and outdoor rendering.

`Layer`

| Field | Type |
| --- | --- |
| `structure?` | `number` |

Attach with `world.addComponentToEntity(entity, LAYER, data)`. Query with `world.getEntities([LAYER])`.

Systems: `ai`, `drop`, `enter`, `fate`, `magic`, `movement`, `visibility`, `water`.
<!-- source-types -->

## Layer

```ts src/engine/components/layer.ts
export type Layer = {
  structure?: number;
};
```
