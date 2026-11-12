# Sight Tracing

Traces visible grid cells by subtracting angle intervals blocked by opaque terrain. It accounts for the game's character aspect ratio and partial-cell blockers.

| Export                 | Contract                                               |
| ---------------------- | ------------------------------------------------------ |
| iterations             | Outward traversal directions and corner definitions    |
| reversedIterations     | The reversed traversal order                           |
| pointToDegree          | Convert a direction to degrees, with zero pointing up  |
| degreesToOrientations  | Convert an angle to ordered cardinal directions        |
| getOpaqueOrientation   | Resolve full or partial obstruction at an entity       |
| getObstruction         | How a cell blocks sight: not at all, fully or one side |
| traceCircularVisiblity | Visible cells around a point; keep the source spelling |
| cellIntersectsCircle   | Test a cell rectangle against a circle                 |
| pixelCircle            | Grid points on a circle, or inside it when filled      |

A zero sight radius returns no cells. Standing in a fully opaque cell returns only the center. [Visibility](../../engine/systems/visibility.md) applies the returned cells to fog state; this helper does not update fog itself.

Tracing reads cells only through `getObstruction`, and only the center and the cells it returns. Visibility relies on this to reuse a traced sight while those cells report the same obstructions, so keep any new cell reads inside `getObstruction`.
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
