# Liquid

Tracks splash, drop and bubble effects.

Each effect owns a `bubbleSplash` sequence. Its elapsed time advances the visual stages and removes the effect, including after saving and loading. Water terrain itself uses [Immersible](immersible.md).

| Field       | Meaning                                                          |
| ----------- | ---------------------------------------------------------------- |
| `timestamp` | Legacy start time; retained when reading older saves. |
| `amount`    | Current visual stage of the splash, drop or bubble.              |
<!-- source-types -->

## Liquid

```ts src/engine/components/liquid.ts
export type Liquid = { type: "splash" | "drop" | "bubble", timestamp?: number, amount: number };
```
