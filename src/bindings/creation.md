# World creation

`creation.ts` maps cell names and ASCII area characters to game entities. It also creates characters, inventories, doors, terrain, buildings, and multi-cell structures.

## Areas and cells

`insertArea` translates a character map through its legend. For example, `♀` creates a player, `█` a mountain, `■` a tutorial crate, `~` shallow water, and `≈` deep water. Unrecognized characters leave air and log an error unless `override` is enabled.

Coordinates wrap using the active level size. `createCell` can create several entities for one cell, including background and structure pieces. Multi-cell objects use fragments that refer back to a root structure.

## Initialization

Levels store a cell matrix and an initialized matrix. Some areas create entities lazily; others initialize the complete layout. Keep the cell matrix, map registration, and visible entities in agreement when changing terrain.

The fixed tutorial inserts named rooms and locks. The Island combines terrain noise, placement rules, paths, and town generation. `src/engine/wfc/town.ts` constrains neighboring town tiles; it is not a general replacement for all terrain generation.

## Feature tests and examples

Use `createAreaWorld` for a small feature test. It parses bordered area rows, installs the real systems, inserts the area, initializes the hero, and preloads the map. The documentation's walking, water, and pushing examples reuse that path.

Test the resulting behavior, such as a mountain stopping a hero or a crate moving into free space. Avoid asserting every entity in a generated world when a small area can demonstrate the rule.
<!-- source-types -->

## CellType

```ts src/bindings/creation.ts
export type CellType = (typeof cellNames)[number];
```
