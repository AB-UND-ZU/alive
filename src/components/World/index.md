# World

Creates a level, owns pause and suspension state, and provides the world context. `createInitialWorld` injects a composed preview world; ordinary play still generates the menu.

```tsx
World({
  createInitialWorld,
  children,
}: React.PropsWithChildren<{ createInitialWorld?: () => GameWorld }>)
```

Pausing saves playable worlds to [local storage](../../game/saves/storage.md). Returning to the menu also saves. Continue restores a snapshot, connects UI callbacks, installs systems and preloads the world before remounting children. Save status is exposed through the world context.

Injected `createInitialWorld` scenes skip storage reads and writes by default. The `persistent` prop enables normal saving for Play presets; feature snippets leave it off so they cannot create or overwrite real saves.
