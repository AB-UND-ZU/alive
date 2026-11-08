# DOS Code Page

`codePage437` lists all 256 character positions in byte order. The atlas groups them into sixteen rows and columns; its hexadecimal labels identify each byte.

| Byte | Symbol | Font key |
| --- | --- | --- |
| 03 | ♥ | U+0102 |
| 0B | ♂ | U+010A |
| 0C | ♀ | U+010B |
| 18 | ↑ | U+0117 |
| 7F | ⌂ | U+011F |

The font stores graphical controls at U+0100 through U+011E. `glyphAliases.json` maps their normal Unicode symbols, including the female symbol, to those keys. Byte zero is blank; printable ASCII and extended characters keep their Unicode equivalents.

The same alias data is used by text rendering and build validation.

The documentation build adds these Unicode aliases to the bundled WOFF character table without changing its glyphs or widths. Prose and code can then keep readable Unicode in their actual text nodes and clipboard content. Native game sprites keep their original font keys.
