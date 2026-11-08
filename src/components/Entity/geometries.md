# Geometry Cache

Shares geometry across all entities. `getGlyphGeometry` caches one flat font shape per character at the glyph elevation; the orthographic camera only sees its top face. `getBoxGeometry` caches boxes by width, height and depth.

| Resource | Ownership |
| --- | --- |
| `fontUrl` | Bundled DOS shape font loaded by the renderer |
| Glyph and box cache | Shared for the renderer's lifetime |
| Returned geometry | Reuse it; individual entities do not dispose it |

This avoids repeated triangulation and GPU-buffer allocation when entities mount.
<!-- source-types -->

## Font

```ts src/components/Entity/geometries.ts
type Font = {
  generateShapes: (text: string, size: number) => THREE.Shape[];
};
```
