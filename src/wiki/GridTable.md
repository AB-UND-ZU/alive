# Grid Tables

Uses inner vertical rules, a double header separator and single row separators. The first column is a row header by default.

| State | Value |
| ----- | ----- |
| Ready | 1     |
| Empty | 0     |

| Prop              | Meaning                                           |
| ----------------- | ------------------------------------------------- |
| `headers`, `rows` | Header labels or React elements, and cell content |
| `rowHeaders`      | Mark the first body cell as a row header          |
| `compact`         | Dense cells, used by the font atlas               |

Widths use whole character cells and keep words intact. Large tables retain their natural height and scroll sideways with sticky first-column labels. Header rows scroll with the page. On narrow phone layouts, the whole table scrolls so a wide row label cannot obscure the data. Dividers stay positioned within their own cells when the frozen column is disabled. Sprite/name groups and preview widths are measured as units; hidden button faces do not inflate a column. The existing layout pass measures vertical rules too, so single-glyph rules use the font without adding an observer per cell.

Empty, `None` and zero cells are blank. Rows without data are omitted; literal command values such as `none` remain visible. Item lists occupy separate lines. Key combinations stay horizontal.

`noWrap` measures the full text as the column minimum and keeps each cell on one line. Keyboard control tables use it so captions remain complete, with normal table scrolling on smaller screens.
