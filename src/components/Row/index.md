# Character Rows

`Row` renders one `Cell` per sprite. Single characters use the font. Layered sprites use the existing pixel compositor to resolve their final colors into one SVG, followed by stack dots when needed. Cell spacing and font size use the shared dimensions. Rows and cells use span elements so native sprites remain valid inside text paragraphs and links; their existing flex layout is unchanged.

```tsx row-example.tsx
import Row from "./index";
import { createText } from "../../game/assets/ui";

<Row cells={createText("Alive")} />
```
<!-- source-types -->

## CellSprite

```ts src/components/Row/index.tsx
export type CellSprite = Sprite & { stackableAmount?: number };
```
