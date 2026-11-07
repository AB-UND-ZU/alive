# RENDERABLE

Stores a generation counter used to invalidate rendering.

`Renderable`

| Field | Type |
| --- | --- |
| `generation` | `number` |

Attach with `world.addComponentToEntity(entity, RENDERABLE, data)`. Query with `world.getEntities([RENDERABLE])`.

Systems: `action`, `ai`, `ballistics`, `build`, `burn`, `click`, `collect`, `consume`, `damage`, `drop`, `enter`, `fate`, `fishing`, `focus`, `freeze`, `harvest`, `homing`, `immersion`, `interact`, `leveling`, `magic`, `map`, `movement`, `needle`, `popup`, `push`, `renderer`, `sequence`, `spike`, `text`, `tick.test`, `trigger`, `vessel`, `visibility`, `water`.
<!-- source-types -->

## Renderable

```ts src/engine/components/renderable.ts
export type Renderable = {
  generation: number;
};
```
