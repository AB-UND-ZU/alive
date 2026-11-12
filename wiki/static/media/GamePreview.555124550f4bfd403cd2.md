# Game Previews

Loads a scene when it reaches the viewport and pauses it when hidden. When visibility notifications arrive in a batch, the most recent entry controls the final state, so a resize or full-page capture cannot leave a visible scene paused. Feature demos follow the page's reference material. A single scene-specific instruction sits beside the frame, or below it on a narrow screen. Beside the frame, GridCenteredNote centers it on whole 32-pixel rows. Feature viewports use 576 pixels without a stat row and 608 pixels with HP or MP. Their frames keep 23 by 15 cells at the same two-pixel glyph size. Clicking inside gives the iframe normal keyboard focus; Escape releases focus after any dialog has closed.

Autoplay resumes when focus leaves. The red Reset button shares the game footer with the required action control. Reset reloads the scene and returns to autoplay while visible. The Sprite Builder reloads its saved localStorage pack. The Interface page uses a native `StaticInterface` instead of a game frame.

The parent validates messages against the frame and page origin. Chat uses the game keyboard, command suggestions and submission directly inside the frame. The Sprite Builder reports its selected sprite through the same state channel, and SpriteCode renders it below the preview.

Unloaded frames show the game's `Loading map...` dialog. Play can pass a level preset and Test Mode flag; ordinary snippets always use test controls.

The Chat frame fits narrow pages with CSS aspect ratio and maximum width. The game sizes its own cells to the available viewport, keeping the keyboard and Send button visible. Other feature previews keep their fixed scene height.

Every feature preview uses the same controls layout, regardless of which scene opens chat. The keyboard sits one row above Reset so the extra preview action cannot cover a key. Controls and the keyboard cover the world frame where they overlap.

Feature previews supply the terminal center to the shared controls using `--controls-center-y`. It includes the scene’s retained stat rows, aligning interaction prompts and all popup hit areas after unused HUD rows are removed. The normal game keeps its existing window-center default.

Visible autoplay is silent. A pointer, touch or keyboard interaction enables the frame audio activity gate and resumes its AudioContext. Blur, pause and page unload disable the gate. This is separate from the player's Sound FX setting, so refocusing never overrides a muted game.

The Light scene exposes a Shadows lever. It updates native lighting in the existing frame without resetting exploration or changing fog of war.
