# Character Rows

Ordinary text and button labels remain batched, selectable font runs. Graphics and text backgrounds share one cached bitmap per row. Stacked sprites are resolved to their final pixels before that bitmap is drawn; icons add no characters to copied text.

Separate glyph surfaces can round differently at browser zoom. One image gives the row a shared pixel grid. A one-pixel texture border protects its edges without changing cell dimensions, text size or sprite proportions.

```tsx row-example.tsx
import Row from "./index";
import { createText } from "../../game/assets/ui";
import { colors } from "../../game/assets/colors";

<Row cells={createText("Alive", colors.lime)} />
```

`characters.ts` combines sprite layers on their native pixel grid before display. Wiki uses whole 18 by 32 pixel cells; the game derives its cell size from the viewport.
<!-- source-types -->

## CellSprite

```ts src/components/Row/index.tsx
export type CellSprite = Sprite & { stackableAmount?: number };
```

## FontCell

```ts src/components/Row/index.tsx
type FontCell = {
  text: string;
  backgroundLayers: Layer[];
  color: string;
  background?: string;
  selectable: boolean;
  underlay?: { char: string; color: string };
  mask?: { char: string; color: string };
};
```
