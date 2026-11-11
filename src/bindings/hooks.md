# World Hooks

Connects React UI to the current ECS world, render notifications and camera selection. Consumers must be under `WorldProvider`.

| Export            | Contract                                                             |
| ----------------- | -------------------------------------------------------------------- |
| WorldProvider     | Provides the current world and stable UI callbacks                   |
| useWorld          | Reads the context, including pause and save state                    |
| useRenderable     | Subscribes to matching renderable entities, optionally by identifier |
| useHero           | First rendered player with a position, or null                       |
| useGame           | Current game entity, subscribed to reference changes                 |
| getActiveViewable | Highest-priority active viewpoint from a supplied list               |
| useViewable       | Render-subscribed active viewpoint                                   |
| useViewpoint      | Camera position, spring, radius, fraction and level-jump state       |
| useOverscan       | Tracks the extra area needed while the viewpoint moves               |

`useRenderable` compares combined entity generations through [Renderer](../engine/systems/renderer.md). Mutating component data without a generation change will not notify a subscriber.

```tsx src/bindings/hooks.ts
const positioned = useRenderable([POSITION]);
```

`useViewpoint` reads the new world directly before subscriptions catch up. A new or loaded level starts at its actual viewpoint; later movement uses the shortest wrapped displacement.
<!-- source-types -->

## SaveStatus

```ts src/bindings/hooks.ts
export type SaveStatus = { saving: boolean; name?: string; failed?: boolean };
```

## WorldContext

```ts src/bindings/hooks.ts
export type WorldContext = {
  ecs: WorldType | null;
  initial: boolean;
  setInitial: React.Dispatch<React.SetStateAction<boolean>>;
  loadingSounds?: boolean;
  suspended: boolean;
  setSuspended: React.Dispatch<React.SetStateAction<boolean>>;
  paused: boolean;
  setPaused: React.Dispatch<React.SetStateAction<boolean>>;
  flipped: boolean;
  setFlipped: React.Dispatch<React.SetStateAction<boolean>>;
  saveStatus?: SaveStatus;
  saveGame: () => void;
  openMenu: () => void;
};
```
