# Character Rows

Lays out fixed-size cells using the width and height supplied by the dimensions provider. Adjacent font characters with the same foreground, background and selection behavior form one text run. Solid backgrounds and native text shading do not split words into letter elements. Genuine stacked sprites and count dots use one composed drawing. Icons contain no fallback text, so copying text never includes a sprite glyph.

Complementary upper/lower pixel blocks use the upper block glyph over the lower color as a solid background. The native masks produce the same pixels, while enlarged portraits can batch adjacent pairs instead of adding an SVG for each pair.

```tsx row-example.tsx
import Row from "./index";
import { createText } from "../../game/assets/ui";
import { colors } from "../../game/assets/colors";

<Row cells={createText("Alive", colors.lime)} />
```

`characters.ts` combines sprite layers on their native pixel grid before display. Wiki uses whole 18 by 32 pixel cells. The game picks a whole source-pixel scale from the viewport. Cell ink is not individually clipped, so adjacent glyphs can meet at the shared pixel boundary.
<!-- source-types -->

## CellSprite

```ts src/components/Row/index.tsx
export type CellSprite = Sprite & { stackableAmount?: number };
```

## FontCell

```ts src/components/Row/index.tsx
type FontCell = {
  text: string;
  color: string;
  background?: string;
  selectable: boolean;
  underlay?: { char: string; color: string };
  mask?: { char: string; color: string };
};
```
