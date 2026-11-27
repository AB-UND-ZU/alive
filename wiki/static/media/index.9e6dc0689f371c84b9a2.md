# Character Rows

`Row` lays out one cell per sprite. Letters and spaces are HTML text, including dialog text on a solid background. Box and block characters use their DOS bitmap so adjacent strokes meet. Stacked characters and stack dots share one cached 9×16 SVG image of the visible pixels. The cell keeps its logical size at every zoom level. Wiki prose is selectable. Game surfaces leave dragging to the controls.

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
