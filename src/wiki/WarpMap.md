# Portal Map

`portalMap` creates the game's portal through `createAreaWorld` and selects its Warp tab. The map comes from the portal's original `POPUP.lines`; `getWarpMap` applies the same selection frame, offsets, lock color and player marker used by `displayWarp`.

`WarpMap` composes the native map background and every native selection frame in green for the Levels overview. `getWarpSelection` supplies the same geometry as gameplay; this overview does not change destination availability. Its table reads each level's size and onward connections from `levelConfig`. `PortalPreview` combines the portal and vortex sprites as the game does.

`LevelMap` crops five rows around a level's native frame. The Island specimen uses Dungeon as its current level so its actual destination frame is available. These are static views of game data, not separate travel controls.

The game still shows only its selected level. `getWarpMap` keeps current/locked checks, state colors and blinking markers; its separate `background` and `selection` layers let the overview reuse native drawing without copying it.
