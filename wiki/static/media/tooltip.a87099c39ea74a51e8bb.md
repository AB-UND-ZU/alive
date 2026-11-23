# Tooltip

Stores proximity text and dialog timing.

[Text](../systems/text.md) selects and advances messages. `override` can force visibility independently of the usual nearby-target choice. Use `"idle"` to show a warning sprite in place of the name when the player stands next to the unit.
<!-- source-types -->

## Tooltip

```ts src/engine/components/tooltip.ts
export type Tooltip = {
  idle?: Sprite;
  dialogs: Sprite[][];
  nextDialog: number;
  persistent: boolean;
  override?: "visible" | "hidden" | "idle";
  changed?: boolean;
  enemy?: boolean;
  lastTooltip?: number;
};
```
