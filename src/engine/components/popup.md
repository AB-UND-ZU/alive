# POPUP

Stores dialog tabs, selection, deals, recipes, and focus.

`Deal`

| Field | Type |
| --- | --- |
| `item` | `Omit<Item, "carrier" \| "bound">` |
| `stock` | `number` |
| `prices` | `Omit<Item, "carrier" \| "bound">[]` |
| `carrier?` | `number` |

`Ingredients`

| Field | Type |
| --- | --- |
| `item` | `Omit<Item, "carrier" \| "bound">` |
| `parts` | `Omit<Item, "carrier" \| "bound">[]` |

`Recipe`

| Field | Type |
| --- | --- |
| `item` | `Omit<Item, "carrier" \| "bound">` |
| `options` | `Omit<Item, "carrier" \| "bound">[][]` |
| `duration` | `number` |

`Target`

| Field | Type |
| --- | --- |
| `unit` | `UnitKey` |
| `identifier?` | `string` |
| `amount` | `number` |

`Focus`

| Field | Type |
| --- | --- |
| `identifier?` | `string` |
| `targetId?` | `number` |
| `position?` | `Position` |
| `highlight` | `NonNullable<Focusable["highlight"]>` |
| `quadrant?` | `Position` |

`Popup`

| Field | Type |
| --- | --- |
| `active` | `boolean` |
| `verticalIndezes` | `number[]` |
| `horizontalIndex` | `number` |
| `selections` | `number[][]` |
| `deals` | `Deal[]` |
| `ingredients` | `Ingredients[]` |
| `recipes` | `Recipe[]` |
| `lines` | `Sprite[][][]` |
| `targets` | `Target[]` |
| `focuses` | `Focus[]` |
| `choices` | `Omit<Item, "carrier" \| "bound">[]` |
| `viewpoint` | `number` |
| `tabs` | `(typeof popups)[number][]` |

Attach with `world.addComponentToEntity(entity, POPUP, data)`. Query with `world.getEntities([POPUP])`.

Systems: `action`, `build`, `consume`, `drop`, `harvest`, `interact`, `map`, `popup.test`, `popup`, `trigger`.
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
