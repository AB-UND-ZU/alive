# App

Mounts `Dimensions` around the game's `World`, then renders the HUD, terminal and controls. The terminal owns the Three.js canvas; the other UI rows use character cells.

```text app-tree.txt
Dimensions
  World
    Stats
    Terminal
    Controls
```
