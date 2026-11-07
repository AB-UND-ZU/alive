# index.ts
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
