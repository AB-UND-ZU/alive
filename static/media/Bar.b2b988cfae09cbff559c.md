# Bar

Renders a counter against the maximum returned by `getMaxCounter`. Positive fractional values display at least one unit; scale and offsets come from the entity's stats.

| Entity | Color |
| --- | --- |
| Enemy | Red |
| Player or friendly unit | Lime |
| Neutral unit or building | Silver |

A full neutral bar is hidden. `isVisible` fades the bar, and a zero scale suppresses it. The mesh height is one source pixel.
