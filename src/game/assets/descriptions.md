# Descriptions

Resolves item sprites and the description rows shown by game dialogs. Material, element and stat variants share the same registries.

| Registry        | Contents                                   |
| --------------- | ------------------------------------------ |
| entitySprites   | Plain stackables and stat pickups          |
| materialSprites | Material-based equipment and resources     |
| elementSprites  | Element-based variants                     |
| statSprites     | Material/stat combinations such as potions |

| Function             | Contract                                                                              |
| -------------------- | ------------------------------------------------------------------------------------- |
| getEntityDescription | Return a configured description, derive and cache it, or fall back to the sprite name |
| getItemDescription   | Resolve the item's configuration and return its description rows                      |

Description callbacks are evaluated lazily to avoid circular initialization between sprite and balancing modules. Derived descriptions use current equipment and [consumption rules](../../engine/systems/consume.md), rather than a separate text copy of their values.

Use [item helpers](utils.md) for the normal icon/name format. Unknown item configurations return an empty description.
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
