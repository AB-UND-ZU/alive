# Popup

Stores dialog tabs, selection, deals, recipes, and focus.

The optional `sprite` field holds the native [Sprite Builder](../../game/assets/spriteBuilder.md) collection, selected sprite and draft color.

[Popup](../systems/popup.md) updates selections and confirms actions. Create dialogs with `createPopup` so their selection arrays, view and sequence are initialized together.

| Field             | Meaning                                            |
| ----------------- | -------------------------------------------------- |
| `verticalIndezes` | Cursor row for each tab; keep the source spelling. |
| `selections`      | Selected path within each tab.                     |
| `chatSuggestion` | Current command suggestion; reset on an edit or close. |
| `viewpoint`       | Entity ID used for the popup camera.               |
<!-- source-types -->

## Deal

```ts src/engine/components/popup.ts
export type Deal = {
  item: Omit<Item, "carrier" | "bound">;
  stock: number;
  prices: Omit<Item, "carrier" | "bound">[];
  carrier?: number;
};
```

## Ingredients

```ts src/engine/components/popup.ts
export type Ingredients = {
  item: Omit<Item, "carrier" | "bound">;
  parts: Omit<Item, "carrier" | "bound">[];
};
```

## Recipe

```ts src/engine/components/popup.ts
export type Recipe = {
  item: Omit<Item, "carrier" | "bound">;
  options: Omit<Item, "carrier" | "bound">[][];
  duration: number;
};
```

## Target

```ts src/engine/components/popup.ts
export type Target = {
  unit: UnitKey;
  identifier?: string;
  amount: number;
};
```

## Focus

```ts src/engine/components/popup.ts
export type Focus = {
  identifier?: string;
  targetId?: number;
  position?: Position;
  highlight: NonNullable<Focusable["highlight"]>;
  quadrant?: Position;
};
```

## Popup

```ts src/engine/components/popup.ts
export type Popup = {
  active: boolean;
  verticalIndezes: number[];
  horizontalIndex: number;
  selections: number[][];
  deals: Deal[];
  ingredients: Ingredients[];
  recipes: Recipe[];
  lines: Sprite[][][];
  targets: Target[];
  focuses: Focus[];
  choices: Omit<Item, "carrier" | "bound">[];
  viewpoint: number;
  tabs: (typeof popups)[number][];
};
```
