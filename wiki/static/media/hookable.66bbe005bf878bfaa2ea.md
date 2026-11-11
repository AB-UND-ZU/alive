# Hookable

Stores fishing-hook attachment and escape state.

[Fishing](../systems/fishing.md) moves between hooked, catching and escaping states. [Trigger](../systems/trigger.md) changes a hooked fish into the reeling state.

| Field      | Meaning                                    |
| ---------- | ------------------------------------------ |
| `hooked`   | Bait entity ID while attached to the hook. |
| `catching` | Caster entity ID while being reeled in.    |
<!-- source-types -->

## Hookable

```ts src/engine/components/hookable.ts
export type Hookable = {
  hooked?: number;
  catching?: number;
  escaping: boolean;
};
```
