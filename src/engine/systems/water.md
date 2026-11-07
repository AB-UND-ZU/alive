# water.ts

Updates water cells and their surrounding terrain.

Initialize the bubble clock from restored bubbles so they can finish and burst after loading. See [saved games](../../game/saves/index.md).
<!-- source-types -->

## Weather

```ts src/engine/systems/water.ts
export type Weather = "rain" | "snow";
```
