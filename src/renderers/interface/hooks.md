# React world bindings

`WorldProvider` makes the world and session actions available to React consumers. `useRenderable` reads existing entities when subscribing, including while paused, then follows engine render generations; components query entities through the world instead of copying game state.

`useViewpoint` selects the active viewable and preserves continuous coordinates across map seams. `useOverscan` retains the preceding viewpoint during movement so cells do not disappear while the camera slides. These hooks have no Three.js dependency and can be used by another React host.
<!-- source-types -->

## SaveStatus

```ts src/renderers/interface/hooks.ts
export type SaveStatus = { saving: boolean; name?: string; failed?: boolean };
```

## WorldContext

```ts src/renderers/interface/hooks.ts
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
