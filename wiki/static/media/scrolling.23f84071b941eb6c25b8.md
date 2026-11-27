# Viewport Styles

`ScrollLock` renders the outer div and publishes measured dimensions as CSS variables. `useResizeListener` updates them on the initial layout and on browser resize.

| Variables | Used for |
| --- | --- |
| `--cell-width`, `--cell-height`, `--pixel-size` | Character and sprite size |
| `--left-offset`, `--right-offset`, `--top-offset`, `--bottom-offset` | Align the terminal with partial viewport cells |
| `--terminal-width`, `--terminal-height`, `--hud-rows`, `--game-height` | Terminal and HUD bounds |

On iOS, the game container cancels the native selection gesture across the playfield, stats and controls. Releasing a tap delivers its click with the original pointer ID and coordinates so the controls can still distinguish taps from steering and scrollbar drags.
