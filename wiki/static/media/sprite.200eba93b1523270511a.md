# Sprite

The ECS component stores `{ id }` for named game artwork. Compare the IDs to identify sprites. The optional name labels artwork. Sprites in the same family can share a name, which the terminal can also use when choosing a glyph.

Generated artwork uses `{ id, custom: true }`. Its ID is the sprite definition, starting with an explicit DOS color. `spriteDefinition` writes it and `parseSprite` reads it. Simple stacks use color switches and characters. A suffix preserves labels, alternate views and non-palette layers when needed. Renderers resolve the reference before selecting layers.

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
export type SpriteRef = { id: string; custom?: boolean };
```
