# Sprites

A sprite is an ordered stack of colored characters. Facing replaces those layers for an orientation. Items can add quantity dots. HTML and Three.js use the same font and palette of [[data:16]] colors.

```widget
sprite-layers
```

The native Sword sprite uses two layers. Facing changes the blade from diagonal to vertical or horizontal.

```ts src/game/assets/sprites/equipments.ts
export const woodStickAir2: Sprite = {
  name: "Sword",
  layers: [
    { char: "/", color: colors.maroon },
    { char: "∙", color: colors.white },
  ],
  facing: {
    up: [
      { char: "|", color: colors.maroon },
      { char: "∙", color: colors.white },
    ],
    right: [
      { char: "-", color: colors.maroon },
      { char: "∙", color: colors.white },
    ],
    down: [
      { char: "|", color: colors.maroon },
      { char: "∙", color: colors.white },
    ],
    left: [
      { char: "-", color: colors.maroon },
      { char: "∙", color: colors.white },
    ],
  },
};
```

## Sprite Builder

```scene
sprites
```

## Existing sprites

```widget
sprite-gallery
```
