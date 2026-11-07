# hooks.ts
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
