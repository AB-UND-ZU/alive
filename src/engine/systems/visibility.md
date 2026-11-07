# visibility.ts

Updates sight, fog and remembered terrain.
<!-- source-types -->

## PendingChanges

```ts src/engine/systems/visibility.ts
type PendingChanges = Record<
  number,
  Record<
    number,
    Record<string, { from: Fog["visibility"]; to: Fog["visibility"] }>
  >
>;
```
