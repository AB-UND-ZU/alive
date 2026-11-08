# Sprite Templates

Builds material and element variants from a sprite's placeholder colors. The output uses the same layers and palette as ordinary game sprites.

| Export          | Contract                                                        |
| --------------- | --------------------------------------------------------------- |
| TEMPLATE_COLORS | Placeholder keys for transparent, material and element channels |
| colorPalettes   | Primary and secondary colors for every material and element     |
| createTemplate  | Replace the placeholders for each material/element combination  |

`createTemplate` accepts an optional separate element sprite and material/element sprite. `invertWoodIron` swaps the material channels for those two tiers. The `default`/`default` entry is the missing sprite; a pure element lives under `default` and its element key.

Use [UI recoloring helpers](../ui.md) for a single sprite, and [item configuration](../utils.md) to choose a generated variant.
<!-- source-types -->

## SpriteTemplate

```ts src/game/assets/templates/index.ts
export type SpriteTemplate = Record<
  Material | "default",
  Record<Element | "default", Sprite>
>;
```

## PartialSpriteTemplate

```ts src/game/assets/templates/index.ts
export type PartialSpriteTemplate = Partial<
  Record<Material | "default", Partial<Record<Element | "default", Sprite>>>
>;
```
