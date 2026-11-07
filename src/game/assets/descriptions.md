# descriptions.ts
<!-- source-types -->

## PartialDescriptionTemplate

```ts src/game/assets/descriptions.ts
export type PartialDescriptionTemplate = Partial<
  Record<Material | "default", Partial<Record<Element | "default", Sprite[][]>>>
>;
```

## SpriteDefinition

```ts src/game/assets/descriptions.ts
export type SpriteDefinition = {
  sprite: Sprite;
  resource?: Sprite;
  display?: Sprite;
  descriptions?: PartialDescriptionTemplate;
  getDescription?: (
    stats: ItemStats,
    item: Omit<Item, "carrier" | "amount" | "bound">
  ) => Sprite[][]; // lazily initialized to avoid circular references
};
```

## SpriteTemplateDefinition

```ts src/game/assets/descriptions.ts
export type SpriteTemplateDefinition = {
  sprite: PartialSpriteTemplate;
  resource?: PartialSpriteTemplate;
  display?: PartialSpriteTemplate;
  descriptions?: PartialDescriptionTemplate;
  getDescription?: (
    stats: ItemStats,
    item: Omit<Item, "carrier" | "amount" | "bound">
  ) => Sprite[][]; // lazily initialized to avoid circular references
};
```

## StatSprite

```ts src/game/assets/descriptions.ts
export type StatSprite = Partial<
  Record<Material, Partial<Record<keyof UnitStats, Sprite>>>
>;
```

## SpriteStatDefinition

```ts src/game/assets/descriptions.ts
export type SpriteStatDefinition = {
  sprite: StatSprite;
  resource?: StatSprite;
  display?: StatSprite;
  descriptions?: PartialDescriptionTemplate;
  getDescription?: (
    stats: ItemStats,
    item: Omit<Item, "carrier" | "amount" | "bound">
  ) => Sprite[][]; // lazily initialized to avoid circular references
};
```
