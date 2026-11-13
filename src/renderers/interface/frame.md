# Scene frame

`getSceneFrame` projects the shared viewport entities into ordered sprite cells for the HTML and terminal renderers. It reads the world without advancing simulation.

`SceneSprite` contains viewport coordinates, depth, resolved facing layers and the source entity. Facing is taken from each segment or particle, including an unspecified facing. Optional health-bar and stack-dot data can be displayed according to renderer capabilities.

Fog, interior visibility, equipment, unit backdrops, loot and sequence particles use the game's existing data and helpers. Movement and camera positions are sampled from engine motion at `metadata.renderTime`.

`SceneState` retains spell quadrants across frames so a spell stays in its chosen wrapped copy of the world. Create a new state when switching worlds.
The optional fifth argument `{ includeHidden: true }` retains hidden body, fog and health entries for opacity transitions. Their `hidden` flag controls visibility. Keys distinguish wrapped copies while remaining stable during movement. `swimming` marks the lower water overlay; renderers can omit it.
<!-- source-types -->

## SceneSprite

```ts src/renderers/interface/frame.ts
export type SceneSprite = {
  key: string;
  x: number;
  y: number;
  z: number;
  layers: Layer[];
  sprite: Sprite;
  amount?: number;
  entity: Entity;
  hidden?: boolean;
  swimming?: boolean;
  dots?: number;
  hp?: {
    value: number;
    maximum: number;
    color: string;
    scale: number;
    x: number;
    y: number;
  };
};
```

## SceneState

```ts src/renderers/interface/frame.ts
export type SceneState = { stickyCastables: Record<number, Position> };
```
