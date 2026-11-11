# Portal Map

`portalMap` creates the game's portal through `createAreaWorld` and selects its Warp tab. The map comes from the portal's original `POPUP.lines`; `getWarpMap` applies the same selection frame, offsets, lock color and player marker used by `displayWarp`.

`WarpMap` composes the native map background and every native selection frame in green for the Portals overview. `getWarpSelection` supplies the same geometry as gameplay; this overview does not change destination availability. Its table reads each level's size and onward connections from `levelConfig`. `PortalPreview` combines the portal and vortex sprites as the game does.

Level references use the green warp-map icon and link to the dedicated Menu, Dungeon or Island page.
