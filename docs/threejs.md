# ThreeJS

ThreeJS draws the world as layered character sprites. The camera follows the active viewpoint while React renders the surrounding controls.

```text
World → Systems → Entity instances
                       ↓
                  Camera + Canvas
```

| Part | Rendering |
| --- | --- |
| Camera | Orthographic view following the viewpoint |
| Entity | Character geometry, materials and layers |
| Instances | Shared instance buffers for repeated glyphs |
| Shadows | Cached shadow geometry and world lighting |

[Renderer](../src/engine/systems/renderer.md) controls generations; [Camera](../src/components/Camera/index.md) follows the game viewpoint.
