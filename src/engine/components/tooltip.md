# Tooltip

Stores proximity text and dialog timing.

[Text](../systems/text.md) selects and advances messages. `override` can force visibility independently of the usual nearby-target choice.

Player speech uses the dialog sequence's elapsed time. A new line replaces the active sequence. After three seconds the ordinary expiry path untypes its characters, then clears the override and message. There is no separate countdown or particle deletion timer.
<!-- source-types -->

## Tooltip

```ts src/engine/components/tooltip.ts
export type Tooltip = {
  idle?: Sprite;
  dialogs: Sprite[][];
  nextDialog: number;
  persistent: boolean;
  override?: "visible" | "hidden";
  changed?: boolean;
  enemy?: boolean;
  lastTooltip?: number;
};
```
