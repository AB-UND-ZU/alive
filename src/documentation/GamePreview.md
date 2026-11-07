# Game Previews

Loads a scene when it reaches the viewport and pauses it when hidden. Feature demos follow the page's reference material. Clicking inside gives the iframe normal keyboard focus; Escape releases focus after any dialog has closed.

Autoplay resumes when focus leaves. The red Reset button shares the game footer with the required action control. Reset reloads the scene and returns to autoplay while visible. The Interface page uses a static `InterfaceDiagram` instead of a game frame.

The parent validates messages against the frame and page origin. Commands can request the Chat scene before it has loaded; the command runs when the frame reports ready.

Unloaded frames show the game's `Loading map...` dialog. Play can pass a level preset and Test Mode flag; ordinary snippets always use test controls.
