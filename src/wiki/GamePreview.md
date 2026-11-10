# Game Previews

Loads a scene when it reaches the viewport and pauses it when hidden. Feature demos follow the page's reference material. A single scene-specific instruction sits beside the frame, or below it on a narrow screen. Beside the frame, GridCenteredNote centers it on whole 32-pixel rows. Feature viewports use 576 pixels without a stat row and 608 pixels with HP or MP. Their frames keep 23 by 15 cells at the same two-pixel glyph size. Clicking inside gives the iframe normal keyboard focus; Escape releases focus after any dialog has closed.

Autoplay resumes when focus leaves. The red Reset button shares the game footer with the required action control. Reset reloads the scene and returns to autoplay while visible. The Interface page uses a native `StaticInterface` instead of a game frame.

The parent validates messages against the frame and page origin. Chat uses the game keyboard, command suggestions and submission directly inside the frame.

Unloaded frames show the game's `Loading map...` dialog. Play can pass a level preset and Test Mode flag; ordinary snippets always use test controls.

The Chat frame fits narrow pages with CSS aspect ratio and maximum width. The game sizes its own cells to the available viewport, keeping the keyboard and Send button visible.

In Chat, the keyboard sits one row above Reset so the extra preview action cannot cover a key. The keyboard covers the world frame where they overlap.
