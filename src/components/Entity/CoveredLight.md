# CoveredLight

Draws light for covered terrain.

```tsx
InvertedRingGeometry({
  width,
  height,
  innerRadius,
  segments = 64,
}: InvertedRingProps)
CoveredLight({ brightness }: { brightness: number })
```
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
