# Cached static local transforms

`updateLocalMatrix` runs through R3F's `onUpdate` after React applies props to known static objects. Their `matrixAutoUpdate` is disabled, so Three.js reuses the local matrix on subsequent frames. World matrices still update normally when parents move.

This applies to opaque instance anchors, static sprite groups, fixed glyph meshes, boxes and non-animated entity containers. Animated entity groups, animated particles, cameras, swimming meshes and other spring-driven transforms retain automatic updates.

There is no global Three.js patch, scene-wide interception or transform scan. Changes to position, orientation, dimensions or geometry flow through the existing React props and recompute the affected local matrix. Code that manually mutates one of these static object's transforms must call `updateMatrix`, as required by Three.js when automatic local updates are disabled.

Renderer tests cover resized/oriented shadow casters, moving parents and updated sprite offsets. Existing animation tests and browser comparisons cover moving particles, fading, camera motion and pause/resume.
