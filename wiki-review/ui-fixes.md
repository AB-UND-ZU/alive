# UI, Wiki and Types verification

The final review covers all 58 Development UI, Wiki and Types routes, including the new World Plants page. All routes loaded and scrolled to the bottom; full-page screenshots and overflowing code/table states were captured. All 65 captures were inspected through content contact sheets, with overflow captures and the mobile heading inspected separately.

Evidence stays outside the repository:

- Final screenshots and 20 contact sheets: `/tmp/alive-review-ui-final/`.
- Per-route coverage, dimensions and semantic/pixel-link checks: [ui-after-coverage.json](ui-after-coverage.json).
- Baseline report: [ui.md](ui.md); baseline screenshots: `/tmp/alive-review-ui/`.
- Additional component screenshots: `/tmp/alive-shared-code.png`, `/tmp/alive-shared-callout.png`, `/tmp/alive-shared-symbols.png`, `/tmp/alive-shared-punctuation.png`.

## Findings

| Finding | Status | Change and evidence |
| --- | --- | --- |
| F1: lost type-index destinations | Resolved by root | Explicit type links retain their full anchor. Root checked all 247 destinations. The refreshed AbilityStats row contains both the type anchor and an actual `src/engine/components/castable.ts` module link. See `typeSourceCheck` in the coverage file. |
| F2: visible code without an active link | Resolved | Code glyph faces follow the actual semantic anchor for each occurrence. CSS selects a precomposed linked face only when that anchor exists. The final scan found zero semantic/pixel-link mismatches. |
| F3: inferred game concepts inside technical text/code | Resolved with root | Development references use exact source/import context. CodeBlock accepts only build-resolved identifier metadata and ignores hrefs on comments, strings and keywords. Commands now retains green string literals and gray comments. Root owns exact-path resolution and the separate item/unit registries. |
| F4: signature-only UI pages | Resolved | All 31 UI sidecars now explain concrete responsibilities, callers, important inputs or rendering constraints. Repeated bare function-call/signature fences were removed; generated type references remain. App/entity/cell diagrams and a usable Row example replace several uninformative signatures. |
| F5: missing geometry/model explanation | Resolved | Geometry Cache documents keys, ownership and lifetime. Document Types explains WikiToken, WikiPage and WikiManifest with a data-flow diagram and field responsibilities. |
| F6: stale UI descriptions/contracts | Resolved | Cursor describes its fixed scaled body cursor; Shadow Cache describes shadow-map invalidation; Swimming describes the water overlay. World documents persistence, Controls its compact/children contract, and Debug the FPS/AVG controls and enable flag. |
| F7: removed catalog-selection behavior | Resolved | Wiki App describes native anchor navigation, not selected portraits. Wiki Visuals no longer claims selectable variants use its frame. Interface Labels identifies its legacy direct-preview path and distinguishes the current static diagram. |
| F8: unsupported glyphs | Resolved with root validation | Authored multiplication signs became “by”. `glyphAliases.json` is shared by rendering, the ordered atlas and build validation. DOS control-symbol aliases include the female symbol; the live symbol table was inspected. |
| F9: clipped mobile headings | Resolved | Three-row letters remain intact and use native balanced wrapping between letter groups. The 390-pixel test checks every letter's bounds and 96-pixel height. `/tmp/alive-review-ui-final/mobile-heading.png` shows the final layout. |
| F10: unnecessary code width | Resolved | Source width comes only from its lines. Filename tabs use a basename while the full path remains accessible. Frames fit their useful content and available columns; Copy has room for its confirmation label. Source-only selection and copying passed. |
| F11: prose-only renderer wiki | Resolved | Code Blocks, Grid Tables and Callout contain real rendered specimens. Wiki Visuals has a shared-component API table; UI rendering pages use concrete tables, diagrams and a Row example where useful. |

Additional shared fixes include `UnitView` using the game's name/sprite helper, stat labels linking through explicit stat keys, and rich description words grouping their colored runs so trailing punctuation cannot become an isolated line. The Elements sample had no isolated punctuation groups after this change.

## Checks

- Repository type checking and scoped ESLint passed.
- Nine focused Jest tests passed across CodeBlock, code-page aliases and GridTable behavior.
- Two focused Chromium tests passed for whole-letter mobile headings and compact code selection/Copy.
- The final 58-route capture recorded zero app runtime errors and zero semantic/pixel-link mismatches. Types/App were refreshed after root's final source-path metadata update.
- Root separately reported the consolidated 37-test browser suite passing; its final combined validation covers subsequent semantic registry corrections.

## Limits

The complete visual pass used Chromium at 1440 by 1000. Mobile rendering was sampled at 390 and 600 pixels rather than repeated on every route. Native Range selection verifies selected content; Copy uses the real button, but this is not a mouse-drag hit-testing audit of every code character. Long declarations intentionally retain local horizontal scrolling.

Audit contexts disabled EventSource to keep snapshots stable while the normal dev server rebuilt. This did not change repository code or the application's hot-reload behavior. Screenshots retain their absolute temporary paths in the coverage file; no image archive is added to the repository. The type table's 98-position baseline traversal was not repeated: the final pass captures its viewport and overflow extreme, while root's link check covers every index entry.

Root's final specimen inspection found a duplicated paragraph margin inside Markdown callouts: the Saved line left two blank rows before its code example. The shared callout now removes its last child's bottom margin, retaining one row of separation. The baseline image is `/tmp/alive-shared-callout.png`; the final specimen is captured in `screenshots/callout-after.png`.

## G34: punctuation and inferred word boundaries

Resolved the Gear introduction's isolated period (`/tmp/alive-gameplay-after/26-000-page.png`). Gameplay matching now uses a filtered feature dictionary for both the expression and lookup; implementation identifiers and generic world/player/element aliases cannot create arbitrary word boundaries. Explicit item, unit and stat references retain their own keys.

Inline Markdown passes immediate punctuation into the final native word of a link, emphasis or code span. Multiword labels can still wrap between words, and punctuation keeps its surrounding text color. There are no invisible joining characters or additional anchors.

Two focused Chromium tests passed, including `item.`, inline `World.`, and linked `Savegames.` at paragraph widths 270, 306 and 342 pixels. Type checking and scoped ESLint passed. Manually inspected `/tmp/alive-g34/gear.png` and `gear-mobile.png` at 1440 and 390 pixels, plus `explicit-narrow.png`, `light.png` and `terrain.png`. Gear punctuation stays attached; the verbs “block sight” and “blocks walking” remain plain text. These targeted checks supplement, rather than repeat, the complete route capture above.

## Native font and shared layout

Single-layer cells now use the bundled DOS font. Overlapping sprite layers, underlines and count dots retain one composed SVG cell. The font's cmap includes the existing DOS control-symbol aliases. Table rules use native glyph columns, measured by the table's existing layout pass; frame sides reuse the same column component with their actual layered frame sprites. Link spaces use font underscores rather than SVG masks.

All tables, including the character atlas, have inner rules only. They retain their full height and scroll sideways with a fixed first column; header rows move with the page. Header cells also accept actual sprite/name elements. Three-row headings wrap between complete words with one 32-pixel row between lines. Long individual words scroll within the heading. Keyboard keys retain both native rows and show their full 48-pixel shape. Callouts repeat a white greater-than glyph on every content line and keep prose white while preserving sprite colors.

Stat labels support native amount/icon/name order, compact count/icon labels, percentages and the Level exception. Buttons use the selected native palette's text color.

Thirteen focused Jest tests passed for native cells, stacked pixels, tables and stat labels. Seven distinct focused Chromium checks passed across the final runs, covering table scrolling, frame geometry, complete-word headings, native glyphs/callouts/keys, sprite-link colors and punctuation. Type checking, scoped ESLint and the whitespace diff check passed. One earlier catalog-frame browser attempt was interrupted by a dev-server reload; its isolated repeat passed.

Inspected desktop and phone screenshots in `/tmp/alive-shared-native/`, using `/tmp/alive-g34/` as the preceding rendering reference. The final native-border evidence is `native-atlas.png`, `native-frame.png` and `native-code.png`; the other captures include `welcome-mobile.png`, `heading-mobile.png`, `gear.png` and `interface.png`. This is a focused shared-rendering check, not another complete route audit. Root's consolidated checks cover the final application and wiki builds.

## Map and Levels

The Map page now uses the portal factory's original map rows and the same `getWarpMap` composition used by `displayWarp`. The helper moved to `game/assets/warp.ts` because every export from `sequences.ts` is registered as a sequence. Frame colors, offsets, lock state, blinking marker and the GO! button's state retain their existing game behavior.

A native portal/vortex preview accompanies a connection table from `levelConfig.warps`. Levels shows the Menu, Dungeon and Island regions from that map beside their current level data. The Island schematic moved to Levels: its biome/ocean names remain inside the diagram, while all landmark names moved to the linked icon legend on its right. Large native sprite rows now contribute their actual row width to table measurement, rather than the concatenation of every row.

Six focused Jest tests passed, including the existing real warp transition. Two Chromium checks passed for native map content, all current portal connections, linked landmarks, five-row level regions and phone overflow. Type checking, scoped lint and the whitespace diff check passed. Inspected `/tmp/alive-map-levels/map.png`, `connections.png`, `levels-compact.png`, `island.png`, `map-mobile.png` and `island-mobile-legend.png`. At desktop width the Levels table fits its 1026-pixel content area; the phone keeps map/legend scrolling local to the figure. The portal map retains its game's existing coming-soon region as drawn data, without describing it as a playable destination.

## Complete Development review and native font persistence

The current native layout was reviewed on all 203 Development routes, including every full page and each captured code/table overflow endpoint. The route record and findings are in `development-native-coverage.json` and `development-native.md`. Evidence remains under `/tmp/alive-development-native/`.

A normal-GPU Chromium probe exposed disappearing gray/white native glyphs that GPU-disabled regression tests could not detect. Direct cell glyphs with bitmap font smoothing disabled retain the actual WOFF font and remove the reproduced rasterization failure. Repeated navigation and scrolling still painted correctly after 15 seconds; inspected `/tmp/alive-font-probes/stable-15s.png`, `stable-code.png` and `stable-mobile.png`. SVG remains limited to stacked sprites.

The same batch fixes transient code-frame width measurement, resets only the code scroll area for a new sample, restores gray labels for sprite-less stats, adds explicit native frame titles, and permits multiword sprite names to wrap between whole words in narrow frozen table columns. Eighteen focused Jest tests passed. The final source is frozen for consolidated verification.

The palette's first native separator and its rule joins now stay attached to the frozen first column during horizontal scrolling. The focused table check passed, as did type checking and scoped lint. Inspected `/tmp/alive-last-checks/welcome-phone-palette-divider-fixed.png` against `welcome-phone-palette-end.png`.

That fresh normal-GPU phone capture also showed the header version and Wiki text missing while body glyphs remained. The earlier 15-second font probe passed, but this second reproduction means native glyph painting is not yet fully resolved; root was notified before final verification.

The fixed header now paints its three plain labels as continuous native font runs. Seven scoped component tests, type checking and lint passed. Four delayed full-viewport normal-GPU captures at phone and desktop sizes retain all header and body text; the normal-window phone checks agree. A subsequent first-capture full-viewport check also reproduced missing glyphs; the intermittent browser raster issue is explicitly recorded in `development-native.md`; no universal fix is claimed for that screenshot path.

Final capture investigation: root reproduced missing SVG/native controls and the Three.js hero with unchanged DOM/state; an immediate full-page screenshot restored them at the same viewport dimensions. Treat the evidence as a screenshot raster-path limitation, rather than proof that a CSS change universally fixes native rendering. The continuous native header is retained as a font/DOM simplification. Source is frozen; no opacity/filter/background workaround was added. All agent browsers are closed.

## Portal, level and shared text updates

Map now composes all three native level-selection layers over the original portal map. `getWarpMap` exposes its existing selection layer while retaining the game's ordinary selected-level `content` behavior. Levels includes a seven-room Dungeon diagram derived from `tutorialRooms`, with the east pond branch and actual wave units; the right legend aligns to the rooms on whole character rows. The Island schematic puts Oak at the central passage, Ilex inside the jungle, Haven by the northeast desert shore, Boat beyond that beach, Nomad near the rim and Worm southeast. These positions illustrate one rotation; generated shorelines and rotations vary.

Sprite-name links retain their native color without an underline until hover or keyboard focus. The hover underline uses the actual underscore glyph behind the name; count and sprite colors remain unchanged. Page links stay blue and underlined. Callout markers are lime and their prose stays white. Keyboard/Mouse has an explicit heading break after the slash. Scene instructions center on complete 32-pixel rows beside the frame and return below it on narrow layouts.

`Literal` renders actual sample/current values as white bracketed text. Responsive dimensions, timer intervals, level dimensions/vision and class level limits use it. Native stats, item quantities and command syntax keep their game formats.

Eighteen focused Jest tests passed. Five distinct focused Chromium checks passed across the final runs: both map checks, item-name hover, callout/native-key geometry and preview camera/centering. Scoped ESLint and diff checks passed. Global type checking at this point was blocked only by the in-flight `DialogSnapshot` optional-POPUP errors outside this batch; root owns the final aggregate check.

Inspected desktop and phone evidence in `/tmp/alive-map-refresh/`: original `map-*` captures, final level diagrams and right-scroll phone legends, forced Keyboard/Mouse heading, preview alignment and white bracketed current values. The note measured a 320-pixel offset beside a 704-pixel frame with 64-pixel text, exactly ten rows. The hover capture exhibits the previously recorded browser raster artifact in unrelated glyphs, while the Spear name's aqua underscore and unchanged sprite are visible; DOM color/underline assertions passed. No additional rendering workaround was added.

## Native popup and command browser coverage

Updated the general browser checks for the new native popup specimens and isolated command builder. Three affected checks passed: all ten command examples and native help/give usage, gray completion and Tab, item search, Run changing HP, Enter creating a pin followed by a named teleport in the same world; native specimens on Gear, Savegames, Chat, Dialogs and Signs with the Tips redirect and bracketed timestamp; and complete phone input borders with both Command and Search fields present.

The command checks read the native table's text content rather than its letter-spaced accessibility name. Completion color is checked on the actual stacked sprite glyphs. The removed duplicate Give examples and Chat iframe are no longer asserted. No product code changed in this test-maintenance batch. Remaining inline, reference, cell and map expectations were reviewed against the current source; root owns the full consolidated run.

## Unnamed visible units

UnitView now keeps the native icon and uses a readable source-key label when a visible unit's native name is empty. Rock1 and Rock2 acquisition references therefore retain their labels; intentionally empty sprites such as Rotten do not gain an invented icon/name. Added two rock regressions and an invisible-unit regression. Updated the Welcome browser expectation for its white `[256]` value.

The complete `npm run check:fast` passed: type checking, lint, 30 test suites and 181 tests. The first attempt stopped on a naming-only lint issue in CellReference's new test; renaming its local render result resolved it. No browser ran in this final shared-fallback batch; root owns the fresh visual capture.

## Final Markdown fact and data audit

Read all 48 player Markdown files. Existing bracketed values cover the concrete class limits, character/palette counts and save timestamp/date example. Native item quantities, enemy hunt counts, stat amounts, formulas and command syntax retain their required formats.

Corrected the Signs controls against `createSign`'s default info tabs and `popupActions.info`: the nearby action is READ and the window title is TIP, not an Info prompt. Keyboard and Quests descriptions now separate reading a Sign from a character's QUEST action. Controls maps Enter to the nearby interaction, B to the Bag/inspect tab, and T to the hero's stats; Dialogs and Stats now describe those actions precisely. The Bag title comes from `popupActions.inspect`; world tooltip names/actions are a separate display.

Quest table rewards now use the supported standard `<br>` breaks, with one entry per line and native `[[stat:xp]]` for unquantified XP. Requested alternatives retain their meaning; accessory choices do not imply receiving both items. Reward quantities and progression stages were preserved.

The Island's southeast marker now uses the actual carried Worm bait sprite and destination. `wormArea` places `W`/`w`; creation maps them to worm_bait/worm_sign, and the bait creates one carried Worm. That generated area does not place worm_boss. This corrects the previously inferred boss marker without changing the diagram's geometry.

UnitView also normalizes underscores/capitalization through the same displayName helper as HarvestTarget. Two regressions cover Hedge One and Hedge Two; all 13 scoped visuals tests passed, including empty-name rocks and deliberately invisible Rotten. Scoped lint passed. Root's in-flight DialogSnapshot edit briefly blocked type checking; a subsequent complete typecheck passed. No browser ran for this final narrow content batch; root owns final captures and the new line-break regression.

## Native Interface, Touch and Feature Previews

The Interface now uses the real island start, equipped Compass, vertical HP/MP/XP labels in their native colors, and all five yellow quick actions. Skill, Spell and Gear arrows share a row and point to the actual controls. Removed Terminal, movement/inspection and hotkey captions. Keyboard/Mouse documents B for the Bag and E for Quick actions, with native interaction buttons and generic SPELL/SKILL examples.

Feature dimensions now subtract only the displayed top HUD rows. Spells retain MP; food retains HP and the native Use button; other feature examples omit top stats. The native game keeps its four-row default. Stats category wrappers identify the native rows without depending on per-letter DOM. The extracted preview-engine stylesheet is documented beside its source.

Movement uses a real collision maze with a native Apple drop at its endpoint. The terrain scene contains native ice, snow, grass, paths, beach, sand, shallow/deep water, mountain, rubble and soils, with terrain extending to the fixed frame. The transient-message specimen equips an actual Iron Sword and renders the resulting native Equipped Sword feedback above the actual hero.

Removed Hammer Touch Emulator and its declaration. Only the Touch example installs a small native mouse-to-touch adapter. The game handles its actual touch events and joystick; release, leaving, blur and hidden-document cancellation stop movement. Real touch devices receive no desktop adapter or cursor. The reference joystick shows all four native directions without following mouse hover.

A focused regression found that the first automatic Enter could be consumed before the native popup opened, even with a visible interaction prompt. For actual POPUP targets, autoplay now retries the opening interaction until the player's native popup state confirms it, then advances. House-entry interactions remain ordinary actions. No game rule or recipe is copied into the example.

Verification: type checking and scoped lint passed before the final retry change; the retry's scoped lint passed. A subsequent global typecheck encountered another agent's in-flight optional SPAWNABLE/MentionStyle changes, so that run is not claimed as passing. All 59 tests across scenes, TouchControls, Dimensions sizing and DialogSnapshot passed. Current focused browser runs passed the native crafting autoplay regression, static joystick reference, desktop release/leave/blur, native mobile touch, Interface navigation and Escape closing a real dialog before releasing focus. The movement focus/reset/replay test passed separately and reached the Apple's actual coordinates. Root owns consolidated checks.

Inspected desktop and phone captures in `/tmp/alive-preview-final/`: Interface, Touch, Movement, Terrain, Spells, Skills, Consumables and Dialogs. Also inspected Touch idle/held and native crafting autoplay states. Confirmed Compass placement, native colored stat labels, yellow quick actions, compact HUD rows, fixed scene geometry, 32-pixel note alignment, native joystick held origin/direction, natural terrain coverage, and equipped-Sword feedback/hero. Narrow layouts retain horizontal access to the native-width interface and scene. The known cropped/fullpage screenshot paint inconsistencies remain documented; a missing top-frame line in some captures was sent to root for final font/frame inspection rather than hidden with a replacement border.

The final global typecheck and scoped lint passed after the concurrent source changes settled. The visible native crafting autoplay regression passed with the popup-state readiness fix. The two corrected Interface navigation and Escape regressions passed together (12.7 seconds); desktop release/leave/blur, native mobile touch and the static reference also passed. All local Chromium instances are closed. The missing frame top edge remains assigned to root's final geometry/font inspection; a possible cause is the native Stats negative margin combined with a zero-row top HUD, rather than glyph replacement.

## Native Structure Comparisons

Structures now compares Wood House and Desert Fort exterior/interior media, locations, actual Door/Port sprites and matching Keys. A small native WFC solve selects one connected building; the existing Earth Town and Fire Haven tile mappings feed createCell, then preloadLevel and assignBuilding provide the native fragments and door. No building outline or rules are copied into the page. The mapping exports are read-only and leave both world generators' behavior unchanged. worldRows can pass the native inside flag to getSegments for the interior specimen.

Portal and Lever specimens use their actual factories and enlarged sprites, with concise interaction descriptions. Tests verify native locked Door versus Port types, different exterior/interior views, and Portal/Lever interactions without ATTACKABLE components. The existing Sign catalog remains below these world fixtures, followed by the real house-entry demo.

Five focused structure/diagram tests passed; typecheck and scoped lint passed. wiki:build produced 270 Markdown routes. The Structures browser regression passed at desktop and phone widths, with no page overflow. Inspected `/tmp/alive-structures-final/structures-1440.png`, `structures-390.png` and `structures-right-390.png`: both native palettes/geometries are legible, inside views hide their roofs, actual access/key sprites match, device media remains readable, and the phone table can scroll to the Desert Fort column. Both capture pages reported no runtime errors. Browsers are closed and source is uncommitted.

Root resolved the preview top-edge clipping by removing the native negative Stats bottom margin in compact previews. The first frame row is now within native pixel overscan, with the full horizontal line visible; canvas and frame centers stay aligned. This was a genuine geometry issue rather than a missing glyph.

## Maze Fog, Native Path and Touch References

Movement now keeps native unfixed fog. The maze's right wall has an opening beyond the Apple, with native grass outside it. Both normal walking and the native pathfinder reach the Apple and the exit at `(14, 1)`. Autoplay uses the actual LEVEL.walkable matrix with findPath and relativeOrientations, sending ordinary short arrow taps through Controls. It switches from the Apple goal only when the identified item's native carrier is the hero. This handles a pickup consuming an action, ignored input, extra movement while a key is held and manual movement before blur; the fixed camera, full 23-by-15 frame and trimmed HUD geometry are preserved.

The desktop joystick reference again follows the cursor using the native direction helpers. On a real touch device the reference remains static with all four arrows. The actual Touch preview keeps its native gesture origin and held directions, desktop idle center cursor, release/leave/blur cancellation and real mobile input.

Preview notes explicitly wrap within their grid column, and their ResizeObserver also watches the parent grid. At 1440, 1110, 1050, 768 and 390 pixels and back to desktop, notes remain disjoint from their frame and start on complete 32-pixel offsets. Stacked notes retain a full-row gap. The previously reported Touch overlap did not reproduce in the current bundle; these bounds and screenshots verify the resulting layout rather than attributing it to an unconfirmed cause.

Slots now opens with the native GEAR specimen. Its native popup title regression passed, and both desktop and phone screenshots show the equipped Sword view and populated slot table.

Verification: 16 scene tests passed, including fog, actual Apple collection, a walkable exit and all native path waypoints. All 41 DialogSnapshot tests passed, including GEAR rather than EQUIP. Four browser checks passed for frame/camera bounds, responsive note separation, desktop cursor directions and native-touch reference/input. The focus/blur/manual-move/reset/exit regression passed in 39.5 seconds. The phone path regression passed in 20.5 seconds while deliberately ignoring one Up input and interrupting initial movement with a full-page screenshot. Scoped lint passed. Global type checking is currently blocked by another agent's bound-property errors in itemSources and MinimapData; it is not claimed as passing for this final batch.

Inspected `/tmp/alive-preview-followup/touch-{1440,1050,390}.png`, `reference-{left,right,native-touch}.png`, `slots-{1440,390}.png`, and the phone maze start/exit artifacts in `/tmp/alive-native-path-tests/`. Native fog hides the unexplored maze, walking reveals its corridors, the Apple is collected, and the hero reaches the grass beyond the opening. The joystick directions match their respective desktop/native-touch modes, Gear is legible at both sizes, and notes do not overlap the frame. Some repeated whole-page captures still exhibit the previously recorded unrelated native-text paint omission; the native scene details and fresh Gear captures are clear. All local browsers are closed; no commits were made.

Final source review confirmed native cursor-direction helpers, real touch dispatch, focus/blur and Escape behavior match their tested outcomes. The maze's first waypoint requires the actual identified Apple to belong to the hero; its exit uses native pathfinding from the current position. Preview notes remain separate from the frame on the row grid. Corrected two stale adjacent-doc claims: movement demonstrations can turn through the maze, and Maze arrows use short native taps rather than the ordinary held-key duration. Generated wiki sections were preserved; these prose corrections require only the consolidated wiki build, which root owns. No new browser ran during this final review.
