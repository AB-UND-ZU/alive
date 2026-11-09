# Character Pixels

`composeCharacterPixels` resolves sprite layers and count dots on the font's 9 by 16 grid. `rowImage` puts those final pixels into one cached bitmap. Ordinary text is drawn separately with the font.

The bitmap has a one-pixel sampling border. Cell spacing and internal sprite coordinates stay unchanged. Server rendering uses the existing SVG rectangles from `characterMarkup` as a fallback.
