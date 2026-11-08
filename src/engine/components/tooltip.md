# Tooltip

Stores proximity text and dialog timing.

[Text](../systems/text.md) selects and advances messages. `override` can force visibility independently of the usual nearby-target choice.
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
