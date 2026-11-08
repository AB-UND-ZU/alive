# Native rendering review

This pass follows the native-font, preview and reference requests. Changes remain uncommitted on top of `767e346`.

Single-layer cells use the bundled DOS font; overlapping sprite layers use the shared pixel compositor. Body text, rules and controls retain the same cell dimensions. Keys show their native one-and-a-half-row shape. Callouts repeat a white `>` on each content line. Tables use inner rules, natural height and sideways scrolling with a fixed first column. Headings wrap whole words with one empty row between lines.

The Interface diagram mounts the real Stats, Terminal, Controls and camera with a noninteractive Island fixture. Its annotations sit inside the Terminal. The fixed 32-column figure scrolls locally on phones. A browser check caught its initially incorrect relative iframe URL; the corrected URL resolves from the wiki index and works on nested routes.

Portal maps share the game's `getWarpMap` composition. The Island schematic and linked landmark legend belong to Levels. Classes use the native displayed choices and compact progression; factions use the directional attack rules. Named entity/stat components retain native sprites, names, colors and links. Trading content belongs to Shops; legacy routes resolve there.

Boss diagrams use actual room legends and cell factories. Visual inspection caught a deferred fixture-hero removal and an unoriented Worm with invisible mouth fragments. The hero is now removed immediately, and the Worm's native limb sequence is shown facing right. Golem displays its actual rock body and four segments. Bodies without a generated arena are cropped to their occupied cells; no room is invented.

Feature scenes use 23-by-15-cell frames aligned with collision walls. Instructions sit beside them, moving below on phones. The actual game camera can move for dialogs. Ordinary scene air remains clear when the camera moves; Light keeps its interior fog. Touch emulation forwards desktop gestures to the native touch handlers and Joystick.

## Coverage and evidence

The full rendered-route audit checked 250 routes with no broken internal destinations, duplicate IDs, repeated prose paragraphs, document-wide overflow or application runtime errors. The intentional `???` class label remains. Final route measurements are recorded separately after all source changes settle.

Each review agent also scrolled its assigned pages and exercised horizontal media/table regions. Their final coverage and limits are recorded in the accompanying review files. The production game build passed with the existing Browserslist and MediaPipe source-map notices. Final test totals are recorded in the review index.

## Final verification

Typecheck, lint and all 128 fast tests passed. Both wiki generator tests and the full 52-check browser suite passed. The production game build passed, and wiki builds 250 routes under `build/wiki`. The final route/link measurements are in `route-checks.json`.

The Interface reuses the normal World component. It does not replace the simulation with a hand-written context: native systems maintain render subscriptions, the camera stays on the fixture viewpoint and input is disabled. Native and reference DOM/SVG bounds, action text and sprite data were compared. Captures that omit existing graphics were isolated to the Chromium capture/raster path; full-page evidence includes the centered hero and actual action buttons. This does not claim every crop screenshot is reliable.
