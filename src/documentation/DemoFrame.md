# Demo Frame

Draws a character-cell boundary over the game terminal. Feature scenes use a stationary viewpoint that yields to open dialogs at `(6, 4)` and hidden collision walls at `x = -5 / 17`, `y = -3 / 11`. The 23-column, 15-row frame occupies those same cells. Boundary walls cannot be harvested; normal scenes keep the small map clear as dialog cameras move, while Light and Movement retain interior fog and clears only its edges. Building layers still use the game's normal indoor hiding. Focus changes its color from silver to green. The action row starts half a cell below the frame line.

The Interface reference uses the game's native Terminal edges and does not mount this overlay.
