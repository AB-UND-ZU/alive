# Dimensions

Wraps its children in `DimensionsProvider` and `ScrollLock`. React rendering and the container's CSS therefore use the same cell size and viewport bounds.

Pass ordinary div props to set the outer game container. `useDimensions` reads the calculated values. `isTouch` records the coarse-pointer media query used by the touch UI.
