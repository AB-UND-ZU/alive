# Liquid

Tracks splash, drop and bubble effects.

[Water](../systems/water.md) advances these effects using its elapsed clock. Water terrain itself uses [Immersible](immersible.md).

| Field       | Meaning                                                          |
| ----------- | ---------------------------------------------------------------- |
| `timestamp` | Start time on the water system's elapsed clock, in milliseconds. |
| `amount`    | Current visual stage of the splash, drop or bubble.              |
<!-- source-types -->

## Liquid

```ts src/engine/components/liquid.ts
export type Liquid = { type: "splash" | "drop" | "bubble", timestamp?: number, amount: number };
```
