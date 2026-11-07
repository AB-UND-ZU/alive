# FOG

Separates unexplored, remembered, and currently visible cells.

`Fog`

| Field | Type |
| --- | --- |
| `visibility` | `"hidden" \| "fog" \| "visible"` |
| `type` | `"air" \| "terrain" \| "object" \| "unit" \| "float"` |
| `fixed?` | `boolean` |

Attach with `world.addComponentToEntity(entity, FOG, data)`. Query with `world.getEntities([FOG])`.

Systems: `ai`, `damage`, `drop`, `fate`, `freeze`, `harvest`, `homing`, `leveling`, `magic`, `movement`, `popup`, `trigger`, `visibility`, `water`.
<!-- source-types -->

## Fog

```ts src/engine/components/fog.ts
export type Fog = {
  visibility: "hidden" | "fog" | "visible";
  type: "air" | "terrain" | "object" | "unit" | "float";
  fixed?: boolean;
};
```
