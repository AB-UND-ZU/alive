# ORIENTABLE

Stores the direction used for attacks and directional sprites.

`Orientable`

| Field | Type |
| --- | --- |
| `facing?` | `Orientation` |

Attach with `world.addComponentToEntity(entity, ORIENTABLE, data)`. Query with `world.getEntities([ORIENTABLE])`.

Systems: `ai`, `ballistics`, `build`, `burn`, `click`, `collect`, `damage`, `drop`, `fate`, `fishing`, `freeze`, `harvest`, `homing`, `interact`, `leveling`, `magic`, `movement`, `needle`, `popup`, `push`, `spike`, `trigger`, `vessel`.
<!-- source-types -->

## Orientation

```ts src/engine/components/orientable.ts
export type Orientation = (typeof orientations)[number];
```

## Orientable

```ts src/engine/components/orientable.ts
export type Orientable = {
  facing?: Orientation;
};
```
