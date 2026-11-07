# REFERENCE

Stores a clock interval, elapsed time, and suspension state.

`Reference`

| Field | Type |
| --- | --- |
| `tick` | `number` |
| `delta` | `number` |
| `suspended` | `boolean` |
| `suspensionCounter` | `number` |

Attach with `world.addComponentToEntity(entity, REFERENCE, data)`. Query with `world.getEntities([REFERENCE])`.

Systems: `action`, `ballistics`, `build`, `burn`, `click`, `collect`, `consume`, `damage`, `drop`, `enter`, `fate`, `fishing`, `focus`, `freeze`, `harvest`, `homing`, `immersion`, `interact`, `leveling`, `magic`, `movement.test`, `movement`, `needle`, `popup`, `push`, `renderer`, `sequence`, `spike`, `text`, `tick.test`, `tick`, `trigger`, `vessel`, `visibility`.
<!-- source-types -->

## Reference

```ts src/engine/components/reference.ts
export type Reference = {
  tick: number;
  delta: number;
  suspended: boolean;
  suspensionCounter: number;
};
```
