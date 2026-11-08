# World Context

Owns level creation, pause/suspension state and the world context used by the HUD, controls and renderer.

| Prop | Behavior |
| --- | --- |
| `createInitialWorld` | Inject a composed world instead of generating the menu |
| `persistent` | Enable storage; defaults off for injected worlds and on for ordinary play |
| `children` | UI mounted inside the world context |

Pausing a playable world and returning to the menu save to [local storage](../../game/saves/storage.md). Continue restores a snapshot, reconnects UI callbacks and systems, preloads the world, then remounts its children.

Play presets enable persistence. Feature snippets leave it off, so their experiments cannot overwrite a real save.
