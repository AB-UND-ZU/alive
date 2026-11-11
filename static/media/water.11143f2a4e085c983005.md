# Water

Creates splash, drop and bubble effects and updates neighboring water or sand terrain.

| Helper group   | Work                                                           |
| -------------- | -------------------------------------------------------------- |
| Liquid effects | Create a sequence that owns its stages and lifetime          |
| Water cells    | Recompute the connected water appearance                       |
| Sand cells     | Update the shoreline after terrain changes                     |
| Weather        | Calculate rain/snow intensity |

Liquid effects advance through their own `bubbleSplash` sequences. There is no separate water clock or per-frame liquid cleanup. When restoring older saves, setup attaches a sequence at the existing liquid stage. See [saved games](../../game/saves/index.md). Water terrain uses [Immersible](../components/immersible.md); its animated effects use [Liquid](../components/liquid.md).
<!-- source-types -->

## Weather

```ts src/engine/systems/water.ts
export type Weather = "rain" | "snow";
```
