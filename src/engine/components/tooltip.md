# Tooltip

Stores proximity text and dialog timing.

[Text](../systems/text.md) selects and advances messages. `override` can force visibility independently of the usual nearby-target choice.

`chatRemaining` counts down the three seconds for player speech. Each new line replaces the active dialog sequence and resets this duration. The text system disposes remaining speech particles on expiry, independently of opening chat. Keeping a remaining duration lets single-player saves resume without relying on an unsaved world clock.
<!-- source-types -->

## Tooltip

```ts src/engine/components/tooltip.ts
export type Tooltip = {
  idle?: Sprite;
  chatRemaining?: number;
  dialogs: Sprite[][];
  nextDialog: number;
  persistent: boolean;
  override?: "visible" | "hidden";
  changed?: boolean;
  enemy?: boolean;
  lastTooltip?: number;
};
```
