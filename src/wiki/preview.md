# Game Frame

Mounts the real `Dimensions`, `World`, `Stats`, `Terminal` and `Controls`. An iframe isolates window-level game controls and CSS from the page. The full Play page follows the normal world lifecycle; feature scenes inject a small world and skip storage.

| State | Behavior |
| --- | --- |
| Visible, unfocused | Run the scene's short keyboard sequence, then retain its result |
| Focused | Stop autoplay and accept normal game input |
| Blur | Resume any remaining demonstration actions |
| Hidden or offscreen | Release held keys and pause simulation |
| Escape | Close a dialog first; otherwise return focus to the page |
| Reset | Recreate the scene and its demonstration |

The URL carries `?test#scene/option`. Feature scenes use a stationary viewpoint that yields to dialogs. Their 23-by-15 frame is centered on the actual Terminal box, including its native pixel overscan. Touch starts also activate focus, so both native and emulated gestures highlight the boundary. Audio is muted. Navigation keys are captured inside the frame so they cannot scroll the wiki. Position, health and dialog messages report preview state to the parent. Test-mode frames expose `window.aliveChat` through the game world.

Autoplay waits for the native interaction prompt and controllable player before opening a dialog. For a native popup target, it retries Enter until the player actually owns the popup, then advances the sequence. Maze actions use the native findPath and relativeOrientations helpers against the current walkable matrix, first reaching the Apple and then the exit. Recomputing from the actual player position preserves the route when a pickup consumes an action, input is ignored or a held key travels farther. Popup arrow holds stay below the menu repeat interval so one scripted direction selects one row. Maze arrows use the same short taps as popup navigation. Other action keys and world movement retain their ordinary hold duration.
