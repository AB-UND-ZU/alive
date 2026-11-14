# Restorable

Stores state specific to the load dialog: `saves` is the last displayed summary list and `saveId` identifies the save confirmed for deletion. Reordering summaries cannot change that target.

[Popup](../systems/popup.md) initializes this component when creating a load dialog, or opening an older one without it. The load display checks summary replacement and cancels confirmation if its target disappeared. Ordinary dialogs do not need this component.
<!-- source-types -->

## Restorable

```ts src/engine/components/restorable.ts
export type Restorable = {
  saves?: SaveSummary[];
  saveId?: string;
};
```
