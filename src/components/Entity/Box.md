# Box

Builds a cell-sized mesh or directional half-cell mesh from shared geometry.

```tsx
Box({
  height,
  offset = 0,
  children,
  orientation,
  ...props
}: ThreeElements["mesh"] & {
  height: number;
  offset?: number;
  orientation?: Orientation;
})
```
