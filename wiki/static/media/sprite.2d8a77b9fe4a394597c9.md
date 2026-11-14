# Sprite

Stores ordered colored character layers and directional or quantity variants.

[World rendering](../../renderers/three-js/Systems/index.md) and the [HTML compositor](../../components/Row/index.md) draw the same ordered layers.

| Field     | Meaning                                                                    |
| --------- | -------------------------------------------------------------------------- |
| `layers`  | Later layers are drawn over earlier layers.                                |
| `facing`  | Directional replacements; missing directions fall back to the base layers. |
| `amounts` | Layer variants for single, double and multiple quantities.                 |

An optional `terminal` variant uses the same layers, facing and amount fields for a simpler character display. It does not replace the browser sprite or change game rules.
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
  terminal?: Pick<Sprite, "layers" | "facing" | "amounts">;
};
```
