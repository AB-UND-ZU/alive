# Math Helpers

Shared coordinate, numeric and collection helpers. Wrapped distances use the level size; visual distance also accepts the character aspect ratio.

| Helper           | Contract                                                      |
| ---------------- | ------------------------------------------------------------- |
| id               | Return the supplied value                                     |
| copy             | Copy x/y                                                      |
| add              | Add two points without wrapping                               |
| combine          | Sum points and normalize both coordinates                     |
| sum              | Sum numbers, starting at zero                                 |
| product          | Multiply numbers, starting at one                             |
| normalize        | Positive modulo, including negative input                     |
| directedDistance | Forward wrapped distance                                      |
| signedDistance   | Shortest signed wrapped distance                              |
| getDistance      | Wrapped Euclidean distance, or block distance when requested  |
| within           | Test a wrapped rectangle including its edges                  |
| angledOffset     | Rounded wrapped offset; zero degrees points up                |
| reversed         | Iterate an array from its end                                 |
| chunked          | Split into fixed-size groups                                  |
| random           | Integer from minimum through maximum inclusive                |
| distribution     | Pick an index using supplied weights                          |
| choice           | Pick one argument                                             |
| sorted           | Sorted copy using JavaScript's default lexical ordering       |
| shuffle          | Randomized copy                                               |
| rotate           | Rotated copy at the supplied offset                           |
| range            | Integers from start through end inclusive                     |
| repeat           | Repeat the same value/reference; nonpositive counts are empty |
| padCenter        | Pad text to the requested width                               |
| lerp             | Linear interpolation                                          |
| sigmoid          | Logistic interpolation around a midpoint                      |
| lcg              | Deterministic next numeric seed                               |
| clamp            | Bound a number between low and high                           |

```ts src/game/math/std.ts
normalize(-1, 8); // 7
signedDistance(7, 0, 8); // 1
```

Game randomness uses `Math.random`. Tests replace it with a seeded generator through the [test environment](../../testing/harness.md).
<!-- source-types -->

## Point

```ts src/game/math/std.ts
export type Point = { x: number; y: number };
```
