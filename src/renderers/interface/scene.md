# Scene enumeration

`collectScene` lists entities around a viewport as `[x, y, inside, id, entity]`. Coordinates preserve wrapped copies of the world. Fractional camera offsets, overscan and flying padding keep cells available during movement.

Projectiles use a retained quadrant record so crossing a map seam does not jump their rendered position. Sticky effects are placed at the viewpoint. The caller owns that record and replaces it when changing worlds. Visibility and sprite projection are handled after enumeration.
<!-- source-types -->

## SceneEntity

```ts src/renderers/interface/scene.ts
export type SceneEntity = [
  number,
  number,
  boolean,
  string | number,
  TypedEntity<"POSITION">
];
```

## SceneViewport

```ts src/renderers/interface/scene.ts
export type SceneViewport = {
  position: Position;
  fraction: Position;
  overscan: Position;
  columns: number;
  rows: number;
  viewable?: { MOVABLE?: { flying?: boolean } } | null;
  structure?: number;
};
```
