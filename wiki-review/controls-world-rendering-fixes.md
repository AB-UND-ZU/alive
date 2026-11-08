# Controls, World and Rendering review

Coverage: all 13 routes in Play, Controls, World and Rendering, at 1440×1000 and 390×844. The 26 visits produced 107 screenshots, including full window scrolling and 14 overflowing internal regions. All 14 contact sheets were visually inspected. Every visit completed without a runtime error or horizontal document overflow. [Coverage](controls-world-rendering-coverage.json) records routes, sizes, previews, scroll positions and image paths.

The screenshot directory is `/tmp/alive-controls-world-rendering-after/`. Images remain local rather than being checked in.

## Findings and corrections

| Finding | Correction / status |
| --- | --- |
| Popup camera movement exposed air fog outside the original preview rectangle. | Ordinary small maps initialize and reveal their air backdrop fully. Layered structures retain normal indoor/outdoor hiding. Light preserves interior fog and clears its exact boundary. A real crafting-dialog regression covers this. |
| Touch movement did not highlight the frame. | Native and emulated touch starts activate window/preview focus. The native Joystick appears and the frame turns green. |
| Preview overlay used dimensions that omitted the Terminal's pixel overscan. | The 23×15 overlay centers on the actual Terminal/Canvas. Browser geometry agrees within 0.1px. Collision walls use the same outer cell positions. |
| Full Play inherited the feature frame's 414px minimum. | Full Play retains its original 378px minimum and default game sizing. Feature frames remain 414px wide. Fresh phone Play capture fits the 390px document. |
| Abilities displayed unrelated HP/XP and pause/use controls. | Preview CSS hides the native third HUD row; Food restores only its last five USE cells and Quick target. Abilities retains MP while hiding HP. Combat and Skills hide hero bars entirely because their stationary target never attacks; Skills costs are already shown by native Controls. No Stats API or game rules changed. |
| Light repeated the same demonstration description above and beside the scene. | Removed the two redundant sentences above the scene. The scene-specific instruction remains beside/below it. |
| The class scene still offered Scout. | Choices now import `displayedClasses`, preserving the actual `???` key. |
| Legacy live Interface comparison drew annotations over the HUD and added an overlay frame. | The legacy reference now uses clean native HUD/Terminal edges, without annotations or DemoFrame. The wiki's static Interface keeps its own correctly placed labels. Fresh clean captures match geometry and have no legacy labels/frame; the earlier frozen-reference startup problem was corrected by using native World startup. Current annotated desktop and phone captures show the hero and action labels. |
| Forging autoplay held Down across two menu ticks and selected a second Sword. | Popup arrow keys now release after 60ms, while action keys and world movement retain 240ms. The fixture's first Sword and next Iron resource produce a valid Iron Sword upgrade preview. The source regression exercises the real forge menu; the final START-state screenshot shows a valid Iron Sword preview. |

Two observations were sent to the source owners: the generic Key token in the keyboard action table appears as a missing sprite; the Sprite facing description's long compound word unnecessarily widens its phone table. These are not claimed fixed here until verified.

## Content and interaction checks

- Controls: keyboard/mouse mappings, native key/button representations, dialog navigation, pause/save behavior and Touch gesture meanings were reviewed. Each real demo has one specific instruction beside it on desktop and below it on a phone.
- World: portal direction, level names, level modifiers, map legend, save/load/delete behavior and clock measurements are drawn from native data/helpers. Tables and maps can scroll locally on a phone; the page width stays within the viewport.
- Rendering: sprite composition, sight/fog/shadows, orthographic camera behavior, viewport sizing and animation examples were inspected. Light's interior fog remains part of the demonstrated feature.
- Live Play: Test Mode was enabled, Dungeon loaded through its actual preset button, the iframe URL retained `?test`, and arrow input moved the hero from `(0, 0)` to `(0, 2)`. The full game contains no wiki DemoFrame.
- Native/frozen Interface geometry at 576×640 matched exactly: Canvas `(-2,110,580,417.328125)`, Stats `(-2,0,580,128)`, Controls `(-2,480,580,160)`, native cell height 32px. The original live comparison still contained legacy labels, so these measurements establish geometry rather than a clean visual match; the legacy path has since been corrected.

Long single-word page titles and 414px feature scenes retain local horizontal scrolling on a phone to preserve complete words and native glyph size. All eight overflowing phone heading ends were captured and inspected in `/tmp/alive-last-checks/heading-*.png`. Abilities and Light were refreshed at both sizes. Live Play was checked at 390px after restoring its native minimum width.

## Final follow-up

The 23-visit final batch in `/tmp/alive-last-checks/results.json` had zero runtime errors. It covers clean live/frozen Interface references, actual forge upgrade state, a touch-opened native crafting dialog, current HUDs, Classes, Containers, Welcome and phone heading ends. Each saved screenshot was visually inspected. The Welcome desktop callout is visible in its top capture; the phone top capture reaches its beginning, rather than covering the full callout. Palette/atlas views include their local horizontal ends. The phone palette end revealed colliding sticky Color headers; the table owner was notified.

The two final focused browser regressions passed (7.1s). Autoplay now waits for a real native prompt before consuming Enter, and action keys retain a longer hold than popup navigation. The HUD regression creates a fresh preview document for each scene rather than keeping the first scene alive through hash-only navigation. Food's transparent Quick input now uses the restored USE action's matching specificity.

The later Interface/Touch corrections and verification are recorded in [Input fixes](input-fixes.md), including SPA iframe URLs and a native touch release case discovered while dragging away from CRAFT.
