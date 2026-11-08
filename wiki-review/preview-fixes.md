# Preview and Touch verification

Feature previews use the game's sizing, camera, renderer, controls and dialogs. The frame is 23 columns by 15 rows, centered on the actual Terminal box. Its collision boundary occupies the same world cells (`x = -5 / 17`, `y = -3 / 11` around camera `(6, 4)`). Boundary walls cannot be harvested. Dialog viewpoints retain their normal priority and can move the camera.

`Dimensions` accepts optional `visibleColumns` and `visibleRows` targets. Defaults remain 21 and 20 for the game. Feature frames pass 23 and 22; a 414×704 viewport therefore retains 18×32 cells and the two-pixel source glyph size. The context and CSS-variable writer receive the same options.

Each scene supplies one instruction beside its frame; narrow layouts place it below. Phone frames retain their native 414px width inside a local horizontal scroller. The page itself does not overflow.

The Touch page includes the actual Joystick as its reference illustration. Its engine scene provides a real workbench and materials. [Hammer Touch Emulator](https://github.com/hammerjs/touchemulator), bundled only for wiki, translates desktop mouse gestures into touch events. Its own circular indicators are hidden. The game renders the cursor/arrows and handles taps, dragging, dialogs and movement release. Native touch devices retain native events. Touch interaction explicitly focuses the scene and turns its boundary green.

## Checks

- Focused Jest: 15 tests passed across sizing and scene composition. These include default game dimensions, preview grid dimensions, equipment/dialog setup, fixed camera behavior, exact collision edges, preserved Light fog, nonharvestable boundaries, clear dialog backdrops and normal building layers.
- Initial preview browser regression: two tests passed. They verify actual Canvas/frame center alignment within 0.1px, native 32px cells, scene instructions, mouse-generated touchstart/move/end events, real workbench opening/closing, movement, release and green focus.
- TypeScript, targeted ESLint and the wiki build passed; the focused HUD and Escape/dialog browser regressions also passed (2 tests, 7.1s).
- `npm run build` passed. The existing Browserslist/CRA dependency notices and missing MediaPipe source-map warning remain.
- Desktop and phone Touch gestures were captured and inspected. The desktop run uses mouse emulation; the phone run uses Chromium's native touch input. Both reported zero runtime errors and document widths matching their 1440px/390px viewports.

## Visual evidence

Captures are local review artifacts, not checked-in images:

- `/tmp/alive-touch-desktop-reference.png`, `/tmp/alive-touch-phone-reference.png`: native Joystick reference and page flow.
- `/tmp/alive-touch-desktop-drag.png`, `/tmp/alive-touch-phone-drag.png`: actual movement, white direction cursor, green frame and native pixel size.
- `/tmp/alive-touch-desktop-dialog.png`: real crafting dialog and camera movement.
- `/tmp/alive-preview-movement-desktop.png`, `/tmp/alive-preview-light-desktop.png`, `/tmp/alive-preview-crafting-desktop.png`: representative frame, fog and dialog states.

An initial dialog screenshot revealed background fog when the popup camera moved beyond the scene's original rectangle. Ordinary small maps now initialize and reveal their air backdrop fully. Layered structures still retain normal indoor/outdoor hiding; Light retains its documented interior fog. The complete 13-route Controls/World/Rendering review is recorded in [the route report](controls-world-rendering-fixes.md). Refreshed fog/HUD/reference screenshots follow the shared final suite.

The native HUD is now scoped by the demonstrated mechanic: Abilities shows MP, Food shows HP and its real USE action, while Combat and Skills hide the unrelated hero bars. Skills uses arrows/charges or free actions rather than MP; the stationary target cannot attack the hero. The shared browser suite includes a dedicated HUD regression.

Forging popup arrow input releases after 60ms, below its native 175ms menu tick, so Down advances once to Iron. Action keys and world movement retain a 240ms hold. Autoplay waits for the real interaction prompt before consuming Enter; a busy renderer can no longer lose the one crafting action during startup. The focused source test opens the real forge menu, selects the first Sword and next Iron resource, and verifies the resulting Iron Sword is forgeable.

Final captures in `/tmp/alive-last-checks/` were inspected: a valid Iron Sword upgrade with START; clean, green-focused Craft dialog edges; hidden Combat/Skills Stats; MP-only Abilities; Light interior fog; current Classes levels and Rogue sprite; Containers drops fully within the right rule; Welcome desktop/phone font atlas and palette; and the end of every overflowing phone heading. All 23 visits had zero runtime errors. The native and frozen Interface match geometry, but the frozen reference omitted hero/action labels in this capture; this was sent to the Interface owner. The phone palette sticky Color headers overlap at horizontal end; this was sent to the table owner.

The final isolated native Touch release regression passed (1 test, 6.6s). It allows a queued grid step and the 200ms parent position report to settle, then verifies the position remains unchanged. Native movement rules were not changed.
