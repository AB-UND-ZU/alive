# Equipped Preview

`equippedPortrait` creates an isolated native world, changes the hero to Scout, and equips one item through `createItemInInventory`. It reads the same `getSegments` compositor as the game. Only equipment that adds a visible segment produces a portrait; stat-only equipment leaves the cell empty.

Portraits are cached by item data. The catalog shows these at the normal one-cell size, below the enlarged item sprite.
