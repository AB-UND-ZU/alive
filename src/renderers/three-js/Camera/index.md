# Camera

Positions the orthographic camera from the highest-priority active viewpoint. World x coordinates use the cell aspect ratio; world y is inverted for the renderer. Zoom follows the current cell height.

The camera shares [the simulation motion clock](../../../engine/motion.md) with entities. Every simulation update records the current viewpoint target, including updates processed during a slow frame. Rendering samples its position directly instead of advancing a frame-limited spring.

| Input | Effect |
| --- | --- |
| Viewpoint position and fraction | Target cell and partial-cell offset |
| Viewpoint spring | Existing duration or physics movement configuration |
| Level change or a new world | Move immediately to the initial viewpoint |
| Pause or suspension | Freeze the camera |
