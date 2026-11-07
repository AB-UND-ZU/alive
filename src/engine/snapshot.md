# World snapshots

`snapshot.ts` copies every entity of a world into plain data and restores a world from it. Saved games use it, see [saving](../game/saves/index.md).

## What a snapshot holds

A snapshot lists each entity ID with its components, the next free ID, the playtime and the IDs of the game, sequence and render entities in world metadata. Systems, listeners and React callbacks are not part of it.

Only one level exists at a time, because warping removes the old level. The level component, including its cell matrices and position map, is stored like any other component.

## References

Components keep shared objects and references to other entities. The copy keeps both:

- Exported sprites are stored as `{ $sprite: "exportName" }`. Game code compares sprites by identity, such as `entity[SPRITE] === none`, so loading returns the same exported object. Generated sprites, such as recolored ones, are stored as data.
- Objects that are entities, such as NPC memories or the level's position map, are stored as `{ $entity: id }` and point to the restored entity.
- Other objects shared within the world stay shared within the snapshot.

The result must be stored with structured cloning, as IndexedDB does, to keep shared objects and values like `Infinity`. JSON would lose both.

## Restoring

`restoreSnapshot` creates a world and recreates the entities in their original order with `restoreEntity`, so IDs and query order stay the same. Afterwards, install systems with `createSystems` and call `preloadLevel`, as for a generated level. Systems start with fresh internal state and lazily initialize cells around the hero again.

Renaming or removing an exported sprite makes older snapshots fail to load unless a save upgrade maps the name.
