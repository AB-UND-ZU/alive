# Docs visuals

All visible UI uses game sprites and `Row`. `Cell` composites character layers on the native pixel grid before display. Body cells are 18 × 32 pixels; headings compose three rows of character cells.

Text is grouped by word and remains selectable. Code and oversized tables scroll horizontally rather than split words. Buttons, keyboard keys, tabs, frames, hover, and portrait art reuse the game helpers and assets.

Content links use the credits description style: blue glyphs with blue underscore layers. `LinkStyleContext` applies that style to link text, including visible code references, without changing menu selections or the header brand.

Inline keys use one character row. Between words, native whitespace collapses at line breaks; code and shaded menu rows preserve their spacing.

Named sprite links keep dialog text colors. Gray names use silver underscores; other names use their text color. Underscore layers sit behind the glyph so descenders remain visible. Only the linked name changes to aqua on hover; counts and icons keep their original colors. Native CSS selects prebuilt game button states and menu highlights.

`Frame` uses `pixelFrame` for its horizontal edges and side characters. Its width is a whole number of character cells; the content keeps native HTML layout and selectable text. Catalog overviews and selectable variants share this frame.

Frames and inputs use the same column measurement. Input borders fit the available whole columns; long values scroll within the visible character row instead of clipping the right border.

`StatLabel` renders the game stat icon, name and color. `SlotLabel` renders the empty equipment slot used by the gear menu. Inputs accept visible `labelContent` while preserving their text label for keyboard and screen reader access; compact inputs use one game button row.

A frame can set a preferred `columns` width for a compact overview. The measured width still fits the available space. Multiword links underline their normal, collapsible spaces with the same font glyph used behind each word.
