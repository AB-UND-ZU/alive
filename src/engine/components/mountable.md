# Mountable

Tracks a vessel and its passenger.

[Vessel](../systems/vessel.md) coordinates the vessel and passenger. [Interact](../systems/interact.md) handles boarding and leaving.
<!-- source-types -->

## Mountable

```ts src/engine/components/mountable.ts
export type Mountable = {
  passenger?: number;
  medium: "water" | "rails";
  spring?: SpringConfig;
};
```
