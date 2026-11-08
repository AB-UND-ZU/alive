# Font Aliases

The documentation font keeps every original DOS glyph. Its Unicode character table also maps readable arrows and control symbols to those same glyph indices, so selectable text can contain normal Unicode rather than the font's private control keys. No outlines, widths or drawing data change.

The build reads the bundled WOFF, replaces its Unicode cmap and writes an aliased WOFF beside the original assets. Node's existing zlib handles the WOFF tables; no font dependency or network fetch is needed. Multi-character aliases such as three periods remain ordinary text.
