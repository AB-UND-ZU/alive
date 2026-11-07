# Layer

Draws a single colored font glyph at the correct game height.

```tsx
Layer({
  layer,
  offsetZ,
  props,
}: {
  props: LayerProps;
  layer: LayerType;
  offsetZ: number;
})
Glyph({
  char,
  receiveShadow,
  position,
  children,
}: {
  char: string;
  receiveShadow: boolean;
  position: [number, number, number];
  children: React.ReactNode;
})
InstancedGlyph({
  char,
  lambert,
  color,
  darkness,
  position,
}: {
  char: string;
  lambert: boolean;
  color: THREE.Color;
  darkness?: SpringValue<number>;
  position: [number, number, number];
})
```
<!-- source-types -->

## LayerProps

```ts src/components/Entity/Layer.tsx
export type LayerProps = {
  isTransparent: boolean;
  opacity?: SpringValue<number>;
  darkness?: SpringValue<number>;
  animatedOrigin?: Point;
  receiveShadow: boolean;
  colorFactor?: number;
  duration?: number;
};
```
