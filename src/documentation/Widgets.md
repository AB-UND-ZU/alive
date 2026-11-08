# Data Widgets

Widgets import current classes, units, items, recipes, constructions, harvest yields, food effects and fishing distributions. Category indexes remain complete and link to canonical entries. Recipe ingredients and other lists occupy separate lines inside table cells.

Catalog indexes use a shared `Frame` with equal-width columns and a preferred width chosen to make the frame roughly square. Same-page references use native fragments; other references use their canonical page.

Catalog families render comparison tables through `CatalogEntry`. Class columns use `getLevelStats` for levels 1–10 and the original class sprites and backdrops. One progression row aligns two-character padded values before native HP and MP icons, with one blank character between the two stats. Extra stats come from class balancing data. Resource and food indexes group all canonical entries by use, and enemy columns group related native units. Animals includes the chick unit, worm bait, and catch item representations from the fishing data. Fish item art does not imply a distinct ambient creature sprite.

The damage calculator lives in `Damage`. The command builder uses `completeCommand`; Run sends the command to the real engine preview.
<!-- source-types -->

## CatalogIndexEntry

```ts src/documentation/Widgets.tsx
type CatalogIndexEntry = {
  key: string;
  sprite: Sprite;
  color?: string;
  redirected?: boolean;
  kind?: "item" | "unit";
  group?: string;
};
```
