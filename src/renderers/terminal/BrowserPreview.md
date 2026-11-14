# Terminal browser preview

`BrowserPreview` displays the native terminal cell grid through the existing Row component. The engine clock, screen projection and keyboard handler are shared with the terminal client. The DOS font's private control glyphs are restored after native Unicode projection.

The surrounding preview controls focus and visibility. A paused preview stops native movement and simulation without showing a second pause overlay. It writes no terminal output or saves. Native keyboard input remains keyboard-only; the browser view does not add touch controls to the terminal client.
