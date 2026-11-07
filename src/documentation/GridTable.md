# Grid Tables

All tables use one shared component with inner vertical rules, a double header separator and single row separators. Outer edges are omitted. Widths use whole character cells, favor full header words and compact body content, and stop growing when the content fits. Overflow stays inside the table.

Lists of items use separate lines. Header labels stay white; body mentions use the same sprite and link styling as prose.

The font atlas opts into compact cells and a frame for the 16-by-16 CP437 grid. All ordinary data tables omit their outer border.

Large tables scroll inside their own area. The header and first column stay visible while comparing values. The first column uses row headers by default; stat and equipment labels reuse the game icons. Empty and `None` cells are blank, and rows without data are omitted. A zero value remains visible.
