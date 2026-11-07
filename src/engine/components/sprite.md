# SPRITE

Stores ordered colored character layers and directional or quantity variants.

`Layer`

| Field | Type |
| --- | --- |
| `char` | `string` |
| `color` | `string` |

`Sprite`

| Field | Type |
| --- | --- |
| `name` | `string` |
| `layers` | `Layer[]` |
| `facing?` | `Partial<Record<Orientation, Layer[]>>` |
| `amounts?` | `Partial<Record<Amount, Layer[]>>` |

Attach with `world.addComponentToEntity(entity, SPRITE, data)`. Query with `world.getEntities([SPRITE])`.

Systems: `ai`, `ballistics`, `burn`, `collect`, `consume`, `damage`, `drop`, `fate`, `freeze`, `harvest`, `homing`, `immersion`, `leveling`, `magic`, `movement`, `sequence`, `text`, `trigger`, `water`.
<!-- source-types -->

## Amount

```ts src/engine/components/sprite.ts
export type Amount = "single" | "double" | "multiple";
```

## Layer

```ts src/engine/components/sprite.ts
export type Layer = {
  char: string;
  color: string;
};
```

## Sprite

```ts src/engine/components/sprite.ts
export type Sprite = {
  name: string;
  layers: Layer[];
  facing?: Partial<Record<Orientation, Layer[]>>;
  amounts?: Partial<Record<Amount, Layer[]>>;
};
```
