# Terminal browser renderer

`BrowserPreview` displays the native terminal cell grid as text in the game's DOS font. Adjacent cells with the same foreground and background share one span; rows use normal newlines. The font's private control glyphs are restored after native Unicode projection. This keeps selection and copying ordinary text without a DOM element or SVG for each cell.

The clock, screen projection and keyboard handler are shared with the terminal client. React redraws when the fixed-step clock advances, rather than on every browser animation frame.

The default preview lets its parent control focus and visibility. Pausing stops native movement and simulation without adding another pause overlay. `interactiveSession` enables the native pause menu, save actions and browser deactivation handling through the shared world context. Recognized game keys prevent browser scrolling; browser shortcuts remain available. The renderer stays keyboard-only.
