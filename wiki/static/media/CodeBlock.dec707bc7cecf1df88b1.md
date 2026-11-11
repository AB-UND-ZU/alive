# Code Blocks

Fences accept a language and an optional filename. The tab shows its basename; the full path remains available as the dialog's accessible name and title.

```ts example.ts
const ready = 1;
```

The source surface is only as wide as its longest line. The frame fits the content or available columns, and only the source scrolls horizontally. Copy returns the original text. The number gutter, tab and borders stay outside selection.

Prism supplies syntax colors in the browser. Identifier links use the generated source-reference index. Comments, strings, keywords and unresolved names keep their syntax color. A visible blue underline appears only when that exact occurrence has a semantic anchor; CSS supplies aqua hover without mouse state.

One selectable code tree provides syntax colors and keyboard links. Copy reads the original fence text.
