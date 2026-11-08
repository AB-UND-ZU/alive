# Interface and Touch

The Interface iframe now uses the wiki base captured when the app starts. Navigating from Welcome to a nested feature route no longer requests the iframe from that route's folder. It mounts the native World, HUD, camera and Controls; current desktop and phone captures show the centered hero, action labels and annotations.

The desktop Touch example imports Hammer only after checking for native touch support. It uses the game's composed Joystick center as its cursor. Pressing starts a gesture; release, leaving the iframe or window blur ends it. Returning with the mouse still held cannot start another gesture. A new press establishes a new origin. The Joystick reference has its own section: its desktop arrows follow the pointer; native touch shows all four directions.

The tests exposed a real game input issue: moving away removes the original CRAFT interaction target, so Chrome could lose its later touchend. Controls now retain that hit area as a hidden DOM node while unavailable. Native touch pointer release/cancellation also clears the held state. Non-passive touch handlers and `touch-action: none` on Controls let the existing game prevent browser gesture takeover while preserving button taps. No game movement rules changed.

## Verification

- Nine focused browser tests passed in 38.5s: native frame geometry/HUD, real desktop touch emulation, Interface SPA navigation, reference direction, mouse release/leave/blur and fresh origins, and native touch release/cancellation after hiding CRAFT.
- TypeScript, targeted ESLint and the scoped whitespace check passed.
- Wiki build passed with 255 Markdown routes.
- Production game build passed. Existing Browserslist and missing MediaPipe source-map warnings remain.
- Ten screenshots in `/tmp/alive-input-current-review/` were inspected individually. These cover desktop and phone Interface, both phone horizontal ends, Joystick references, native/emulated held input and release, and the composed cursor asset. The cursor sample is enlarged only in its review image; the actual cursor uses native cell dimensions.
- The four page visits had no runtime errors or document overflow. Native touch mounted no desktop cursor, and both input modes had zero Joysticks after release.

The blur regression dispatches the window lifecycle event; it does not switch operating-system windows. The aggregate wiki suite is owned by the parent agent.
