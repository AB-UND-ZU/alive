# Minimap Snapshot

Builds the four native minimap popup views from one seeded Island, using `MinimapData`. The source hash covers game, engine, bindings and snapshot preparation; unchanged sources reuse the stored rows. Browser pages import the generated JSON instead of generating an Island on navigation.

A temporary DOM supplies the browser objects expected by the game modules. Its audio context stays suspended. Terrain, exploration, pathfinding and popup composition remain in native game code.
