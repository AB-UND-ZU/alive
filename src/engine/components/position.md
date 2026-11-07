# POSITION

Stores wrapped grid coordinates.

`Position`

| Field | Type |
| --- | --- |
| `x` | `number` |
| `y` | `number` |

Attach with `world.addComponentToEntity(entity, POSITION, data)`. Query with `world.getEntities([POSITION])`.

Systems: `action`, `ai`, `ballistics`, `build`, `burn`, `click`, `collect`, `consume`, `damage`, `drop`, `enter`, `fate`, `fishing`, `focus`, `freeze`, `harvest`, `homing`, `immersion`, `initialize`, `interact`, `leveling`, `magic`, `map`, `movement.test`, `movement`, `needle`, `popup.test`, `popup`, `push`, `spike`, `text`, `trigger`, `vessel`, `visibility`, `water`.
<!-- source-types -->

## Position

```ts src/engine/components/position.ts
export type Position = {
  x: number;
  y: number;
};
```
