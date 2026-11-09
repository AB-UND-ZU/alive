# Character Rows

`Row` renders one `Cell` per sprite. Each cell draws its facing layers as positioned font characters, followed by stack dots when needed. Cell spacing and font size use the shared dimensions.

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
