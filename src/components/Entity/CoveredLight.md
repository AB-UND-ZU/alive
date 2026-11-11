# Covered Light

Adds a shadow-casting point light and a dark cover outside its radius. `brightness` sets the radius after the quarter-cell adjustment used by this renderer.

`InvertedRingGeometry` creates a plane with a circular hole. It rebuilds only when its dimensions or radius change and disposes replaced geometry. The oversized cover remains clipped by the camera, so ordinary movement does not rebuild it.
<!-- source-types -->

## InvertedRingProps

```ts src/components/Entity/CoveredLight.tsx
type InvertedRingProps = {
  width: number;
  height: number;
  innerRadius: number;
  segments?: number;
};
```

`LightingContext` controls whether native entities receive shadows and draw circular light covers. It defaults to enabled.
