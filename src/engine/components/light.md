# LIGHT

Defines rendered light, fog visibility, darkness, and half-cell orientation.

`Light`

| Field | Type |
| --- | --- |
| `brightness` | `number` |
| `visibility` | `number` |
| `darkness` | `number` |
| `orientation?` | `Orientation` |

Attach with `world.addComponentToEntity(entity, LIGHT, data)`. Query with `world.getEntities([LIGHT])`.

Systems: `consume`, `enter`, `fate`, `text`, `trigger`, `visibility`.
<!-- source-types -->

## Light

```ts src/engine/components/light.ts
export type Light = {
  brightness: number; // for rendered light
  visibility: number; // for fog of war
  darkness: number;
  orientation?: Orientation // for half blocks
};
```
