# Viewport Styles

`ScrollLock` renders the outer div and publishes measured dimensions as CSS variables. `useResizeListener` updates them on the initial layout and on browser resize.

| Variables | Used for |
| --- | --- |
| `--cell-width`, `--cell-height`, `--pixel-size` | Character and sprite size |
| `--left-offset`, `--right-offset`, `--top-offset`, `--bottom-offset` | Align the terminal with partial viewport cells |
| `--terminal-width`, `--terminal-height`, `--hud-rows`, `--100vh` | Terminal and HUD bounds |

The div also registers with `body-scroll-lock` through `enableBodyScroll`.
