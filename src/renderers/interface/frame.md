# Scene frame

`getSceneFrame` projects the shared viewport entities into ordered sprite cells for the HTML and terminal renderers. It reads the world without advancing simulation.

`SceneSprite` contains viewport coordinates, depth, resolved facing layers and the source entity. Facing is taken from each segment or particle, including an unspecified facing. Optional health-bar and stack-dot data can be displayed according to renderer capabilities.

Fog, interior visibility, equipment, unit backdrops, loot and sequence particles use the game's existing data and helpers. Movement and camera positions are sampled from engine motion at `metadata.renderTime`.

`SceneState` retains spell quadrants across frames so a spell stays in its chosen wrapped copy of the world. Create a new state when switching worlds.
The optional fifth argument `{ includeHidden: true }` retains hidden body, fog and health entries for opacity transitions. Their `hidden` flag controls visibility. Keys distinguish wrapped copies while remaining stable during movement. `{ instant: true }` uses current engine positions and the current viewpoint without actor movement interpolation or bumps. All animated particles still sample their motion, including spawn, level-up and popup effects. Terminal transient messages appear above their owner, with newer lines pushing earlier lines up without changing their lifetime. Invisible terminal messages do not displace visible rows. Inactive dialog particles are omitted immediately. `fog` marks cells whose world colors should be dimmed or inverted. `{ fogCells: true }` also supplies a visibility marker for every viewport cell, using the sight already computed by the engine.

`loot` marks item sprites; hidden loot remains available with `includeHidden`, and its key uses the item identity. `particle` identifies the source particle without replacing its parent entity. Instant frames also expose its sequence `particleName` and `particleSequence`, so the terminal can omit scratches and place UI above world effects. `terminalLayers` selects an optional sprite terminal display using the same facing and amount as its normal layers. Homing body sprites follow their sampled travel direction until they reach a corner.

`swimming` marks the lower water overlay; renderers can omit it.
<!-- source-types -->

## SceneSprite

```ts src/renderers/interface/frame.ts
export type SceneSprite = {
  key: string;
  x: number;
  y: number;
  z: number;
  layers: Layer[];
  terminalLayers?: Layer[];
  sprite: Sprite;
  amount?: number;
  entity: Entity;
  particle?: Entity;
  particleName?: string;
  particleSequence?: string;
  hidden?: boolean;
  fog?: boolean;
  loot?: boolean;
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
