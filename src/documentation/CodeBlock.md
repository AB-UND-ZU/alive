# Code Blocks

Fences accept a language and optional filename. The filename uses the game tab renderer. Copy uses the game's green button and returns the original source.

Syntax tokens come from the TypeScript scanner at build time. Identifiers link to source types. The number gutter and popup frame are outside the selectable code region and use `user-select: none`.

A transparent semantic text layer provides native code selection. The composited glyphs are the only visible text; frame and gutter characters are excluded from selection.

Only the source viewport scrolls horizontally. The line numbers touch the left frame. The filename tab, side walls and bottom border remain fixed; Copy sits on the bottom right border.

The body and horizontal borders use the same whole-cell width, including the gutter. Linked identifiers use the credits link style over their syntax color.
