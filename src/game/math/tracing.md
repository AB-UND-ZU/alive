# tracing.ts
<!-- source-types -->

## Interval

```ts src/game/math/tracing.ts
type Interval = { start: number; end: number };
```

## Corner

```ts src/game/math/tracing.ts
type Corner = { start: [Point, Point, Point]; end: [Point, Point, Point] };
```

## Iteration

```ts src/game/math/tracing.ts
type Iteration = {
  orientation: Orientation;
  direction: Point;
  normal: Point;
  corners: Corner;
  orientations: Record<Orientation, Corner>;
};
```
