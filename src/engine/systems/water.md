# Water

Advances splash, drop and bubble effects and updates neighboring water or sand terrain.

| Helper group   | Work                                                           |
| -------------- | -------------------------------------------------------------- |
| Liquid effects | Timestamp the effect, advance its stage and finish it          |
| Water cells    | Recompute the connected water appearance                       |
| Sand cells     | Update the shoreline after terrain changes                     |
| Weather        | Calculate rain/snow intensity |

The elapsed clock advances every update. On restore it starts at the latest existing liquid timestamp, so saved bubbles can finish instead of waiting on a clock reset. See [saved games](../../game/saves/index.md). Water terrain uses [Immersible](../components/immersible.md); its animated effects use [Liquid](../components/liquid.md).
<!-- source-types -->

## Weather

```ts src/engine/systems/water.ts
export type Weather = "rain" | "snow";
```
