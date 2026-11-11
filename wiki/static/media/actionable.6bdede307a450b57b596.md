# Actionable

Tracks available contextual actions and queued spell, skill, and interaction input.

[Action](../systems/action.md) discovers nearby targets. [Trigger](../systems/trigger.md) consumes queued spell, skill and tool input.
<!-- source-types -->

## Actionable

```ts src/engine/components/actionable.ts
export type Actionable = {
  spellTriggered: boolean;
  skillTriggered: boolean;
  interactTriggered: boolean;
  toolEquipped: boolean;
} & Partial<Record<(typeof actions)[number], number | undefined>>;
```
