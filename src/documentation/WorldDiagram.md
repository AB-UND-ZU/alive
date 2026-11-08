# World Diagrams

`worldRows` uses the renderer's `getSegments` order, facing and amount variants. It includes native backdrops, equipment, carried loot and sequence particles at their actual cell positions. Layer heights order overlapping entities.

`WorldDiagram` displays those cells at normal documentation font size. Its bounds select a room or fragment group; it does not move entities or invent room geometry.

Bounds may cross the world edge. Cell lookup wraps using the native level size, so a diagram centered on a teleported hero includes neighboring cells on both sides.

Building specimens can request the native inside view through `bounds.inside`. It passes directly to getSegments so roofs and facades use their actual ENTERABLE sprite. Other diagrams keep their ordinary exterior view.
