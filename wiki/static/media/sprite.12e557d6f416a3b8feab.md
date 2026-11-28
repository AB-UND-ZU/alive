# Sprite

The ECS component stores `{ id }` for named game artwork. Compare the IDs to identify sprites. The optional name labels artwork. Sprites in the same family can share a name, which the terminal can also use when choosing a glyph.

Generated artwork has a stable snake_case ID based on its layers, label and alternate views. A custom component stores the drawing instructions in a separate `definition` field. `spriteDefinition` writes the explicit DOS colors and characters, and `parseSprite` reads them back. The same artwork keeps its ID across save loads and worker handoffs.

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

## SpriteLayers

```ts src/engine/components/sprite.ts
export type SpriteLayers = {
  layers: Layer[];
  facing?: Partial<Record<Orientation, Layer[]>>;
  amounts?: Partial<Record<Amount, Layer[]>>;
};
```

## SpriteArtwork

```ts src/engine/components/sprite.ts
export type SpriteArtwork = SpriteLayers & {
  name?: string;
  terminal?: SpriteLayers;
};
```

## Sprite

```ts src/engine/components/sprite.ts
export type Sprite = SpriteArtwork & {
  id: string;
};
```

## SpriteRef

```ts src/engine/components/sprite.ts
export type SpriteRef =
  | { id: string; custom?: false }
  | { id: string; custom: true; definition: string };
```
