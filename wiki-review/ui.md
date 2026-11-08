# Development UI, Wiki and Types audit

Baseline: `767e346`. Research only; no repository changes.

All 57 assigned manifest routes were loaded and scrolled from top to bottom in Chromium at 1440 by 1000. Every overflowing code/table area was traversed across its horizontal range; the Types table was also traversed through its entire 17,496-pixel vertical scroll range. There are 233 viewport captures, including 112 internal-scroll captures. All captures were inspected through contact sheets; representative defects were also inspected at full size. Contacts crop the content area only; original screenshots retain navigation and header.

Coverage: `/tmp/alive-review-ui/coverage.json` (also `/tmp/alive-review-ui-coverage.json`). Each route records screenshots, scroll positions, overflow dimensions, visible links and runtime errors. Final coverage has 57 successful routes and zero app runtime errors. The first long-lived renderer crashed after Types and 14 UI pages; all remaining routes were recaptured in fresh contexts. This was not reproduced as an isolated page failure.

Manual checks: `/tmp/alive-review-ui/manual.json`. Native Range selection and the real Copy button returned exactly the source text, excluding frames and numbers, on App, Layer, Doc Types and Commands. Additional screenshots inspect 390-pixel Layer/Doc Types/Wiki Visuals and 600-pixel Commands. These samples had no horizontal document overflow; code overflow stayed internal. Range selection validates selected content, not mouse-drag hit testing.

## Findings, in priority order

### F1 — P1 — Distinct type-index destinations lose their links

Systematic: link policy. The Types table has 247 entries but only 136 main anchors, rather than one link for each type. `DropSequence`, `EffectType`, `EmptyObject`, `Entity`, `Entry`, `Item`, `UnitKey` and many others are plain gray text. They cannot open their specific type declarations.

Evidence: `/tmp/alive-review-ui/00-types_types/015-internal.png`; contacts `types-1.jpg` through `types-8.jpg`. `src/types.md` explicitly links each type to its own `#type-*` anchor. `App.tsx:330` deduplicates other-page links using the page route without its anchor, even for explicit Markdown links.

Fix: limit prose deduplication to automatic mentions. Keep explicit indexes navigable per complete route plus anchor; do not let the first type in a file suppress the others.

### F2 — P1 — Visible code links can be dead links

Systematic: CodeBlock semantic/pixel parity. App's visible `App()` is blue and underlined, but its semantic code contains zero anchors. Layer has 11 visible linked chunks but only 3 semantic anchors; Doc Types has 7 versus 1. Some difference is repeat policy, but the rendered state must agree with the active semantic links.

Evidence: `/tmp/alive-review-ui/01-ui_app/000-window.png`, `/tmp/alive-review-ui/manual.json`, `/tmp/alive-review-ui/ui-app-1440.png`. `CodeBlock.tsx:59` sets `linked: !!reference` independently of the link policy applied by SemanticCode at line 39.

Fix: make actual semantic anchors authoritative for visible blue/underscore/hover state, retaining syntax colors for removed/self/repeated references. Native CSS matching the semantic anchor can preserve efficient hover behavior.

### F3 — P1 — Code strings/comments and technical text infer game concepts

Systematic: reference context and scanner. Commands' comment `// ["/give sword"]` renders `sword` blue and underlined. String arguments also link potion and wood. The Types index decorates the code type `Melee` with a red stat icon. Technical prose links `world` in “world context” to the gameplay Map rather than the UI World component. World Map prose decorates “mountain range” as the Range stat. Wiki Build syntax examples link fragments inside literal `[[item:...]]` notation.

Evidence: `/tmp/alive-review-ui/wiki-commands-600.png`; `/tmp/alive-review-ui/contacts/types-2.jpg`; `/tmp/alive-review-ui/01-ui_app/000-window.png`; `/tmp/alive-review-ui/contacts/rest-8.jpg` and `rest-9.jpg`. App's explicit-link children use the same ordinary Inline/ReferenceText path as prose. CodeBlock splits every scanner token by the global reference pattern, regardless of token kind.

Fix: preserve exact labels for explicit code-target links; do not infer sprites from ordinary prose or literal examples. Inline technical code should resolve a complete module/file or a genuine identifier. Code references should consider identifier tokens only, excluding strings, comments and keywords.

### F4 — P2 — Most UI pages contain signatures instead of useful component wiki

Systematic content pattern. Many UI pages have only 4–15 words of explanation followed by copied function signatures and generated types. The interface is technically present, but purpose, caller, dependencies and important behavior are missing. This is especially noticeable on Animated, Bar, Dots, Layer, Instances, Sprite, Stack, Swimming, Keyboard and Stats. The 33-line Layer signature dominates several screens without explaining when its instanced or animated paths are chosen.

Evidence: all UI contact sheets, especially `/tmp/alive-review-ui/contacts/rest-2.jpg`, `rest-3.jpg`, `rest-5.jpg`; source sidecars under `src/components/`. `Layer.tsx` chooses instanced opaque geometry versus individual animated material; `Bar.tsx` clamps/rounds values, colors factions, hides full neutral bars and respects scale; none of those rules is explained.

Fix: replace bare `Component()` fences and duplicate property dumps with a few concise, source-backed rows: responsibility, caller/context, important inputs and behavior. Retain generated types as reference material. Add a diagram or actual rendered example where it explains a visual component; avoid adding generic prose to every page.

### F5 — P2 — Geometries and document types have no authored explanation

Local content holes within the broader F4 pattern. `geometries.md` is only a title and generated `Font` type. It does not document `fontUrl`, `getGlyphGeometry`, `getBoxGeometry`, caching keys or ownership/disposal. `wiki/types.md` is only generated type declarations and does not explain the manifest/token/page relationship.

Evidence: `/tmp/alive-review-ui/21-ui_entity_geometries/000-window.png`, `/tmp/alive-review-ui/55-wiki_types/000-window.png`. `Entity/geometries.ts` caches flat glyph geometry by character and boxes by dimensions; its comment explains why they are shared and never disposed. History `771873c` introduced that optimization. Wiki types define WikiToken → WikiPage → WikiManifest.

Fix: add the concrete cache/ownership contract and a tiny data-flow diagram or table for the document model. Do not mistake generated declarations for wiki of behavior.

### F6 — P2 — Several UI descriptions and signatures are inaccurate or stale

Local edits, source-backed:

- `Cursor/index.md:3` says contextual pointer/hover state. `Cursor/index.tsx` creates a pixel-scaled global body cursor from a fixed arrow bitmap; it has no contextual entity or hover state.
- `ShadowCache.md:3` says terrain/entity shadow data. `ShadowCache.tsx` caches renderer shadow-map updates, tracks light/caster transforms, geometry and map size, and avoids six point-light shadow passes when unchanged.
- `World/index.md:6–9` omits the `persistent` prop and uses `GameWorld`, while the real signature includes `persistent?: boolean` and `WorldType`.
- `Controls/index.md` shows `Controls()` without its `compact`/children contract, although that is the important integration point used by snippets.
- Debug contains only “Provides optional renderer performance counters.” Its actual export is `ExtendedStats({maxFps=120, rolling=10})`; Terminal enables it via a currently-false internal flag. There is no documented way to enable it or explanation of the AVG panel.

Evidence: screenshots for Cursor, ShadowCache, World and Debug in the coverage directories; corresponding adjacent source files. History `3b6a2d7` explicitly memoizes cursor generation.

Fix: correct these small descriptions/signatures and document the few integration details a caller needs.

### F7 — P2 — Wiki describe removed catalog selection behavior

Local stale implementation claims. `App.md:5` says fragment changes notify catalog selectors and update a selected portrait. `visuals.md:13` says frames are shared by selectable variants. The current CatalogEntry has comparison tables, no variant selection state and no Frame import. Anchors target sprite cells rather than selecting a portrait.

Evidence: `/tmp/alive-review-ui/32-wiki_app/000-window.png`, `/tmp/alive-review-ui/56-wiki_visuals/002-window.png`; `CatalogEntry.tsx` has no selected/useState or Frame path.

Fix: state that fragments scroll to a variant's comparison cell; remove the obsolete selected-portrait/frame description. InterfaceLabels also describes the legacy live interface-preview path; identify that separately from the current static InterfaceDiagram so readers do not confuse the implementations.

### F8 — P2 — Unsupported multiplication characters become question marks

Local authored content; systematic validation opportunity. `Row/characters.md` uses `9 × 16`; `visuals.md` uses `18 × 32`. The font has no × glyph, so those render `9 ? 16` and `18 ? 32`.

Evidence: `/tmp/alive-review-ui/wiki-visuals-390.png`, contacts `rest-4.jpg` and `rest-11.jpg`; `visuals.tsx:71` replaces unsupported characters with `?`. A scan of all assigned Markdown found only × unsupported after accounting for current aliases.

Fix: use “9 by 16” / “18 by 32” or ASCII x. Add a build-time diagnostic for unsupported authored prose glyphs so this does not recur.

### F9 — P2 — Mobile headings silently hide whole letters

Systematic heading layout. At 390 pixels, “VISUALS” is wider than the viewport and is clipped inside the heading's own horizontal scroller. Overall document width remains correct, but the title is incomplete without a visible scroll cue. Many six-or-more-letter heading words have the same geometry.

Evidence: `/tmp/alive-review-ui/wiki-visuals-390.png`; h1's HeadingWord is an unbreakable run of three-row letters. This is distinct from the intended horizontal scrolling of code/data.

Fix: preserve the character size and three-row alphabet, but provide an intentional readable long-heading layout: break only between whole letter groups when a word cannot fit, or show a clear terminal-native horizontal overflow affordance.

### F10 — P2 — Code frames create avoidable empty width and scroll

Systematic CodeBlock sizing. Short API fences such as `App()` occupy almost the full content width. Their source surface is also at least the full filename width even though the filename tab already has independent elision. App's source is five characters, but its surface is 540 pixels wide. At a narrow viewport that minimum can create horizontal scrolling through blank space (inferred from sizing logic, not directly measured for App at 390 pixels).

Evidence: `/tmp/alive-review-ui/01-ui_app/000-window.png`, manual.json (contentWidth 540 for `App()`), `CodeBlock.tsx:101–103`. Large signatures also leave most rows blank when scrolled right, which is expected for unwrapped code but worsened by unnecessary signature-only fences.

Fix: size the source surface from source lines only. Size/elide the filename independently. Consider compact frame width for short examples, while preserving fixed borders and source-only scrolling. The source-only selection and copy behavior already works and should be retained.

### F11 — P3 — Renderer wiki explains appearance without showing it

Systematic wiki format opportunity. Code Blocks, Grid Tables, Callout and Wiki Visuals are almost entirely prose about reusable visual elements. They provide no small rendered specimen on their own implementation pages. Code Blocks has five paragraphs but no fence example; Callout describes a marker but does not show one.

Evidence: `/tmp/alive-review-ui/contacts/rest-6.jpg`, `rest-7.jpg`, `rest-11.jpg`; corresponding sidecars.

Fix: use one small actual component specimen plus a compact authoring/API table, reducing repeated prose. A composed cell/layer diagram would explain the rendering contract better than listing the same styling rules across multiple pages.

## What looked sound

- All assigned routes eventually rendered without app errors; generated type links that remain active point to existing source anchors.
- Frame borders, line-number gutters and fixed Copy placement were visually consistent in the inspected desktop and mobile samples.
- Horizontal code/table scrolling remained local. Types' header and first column stayed in place while scrolling both axes.
- Code selection/copy excluded the frame, numbers and button. Selection and copied content matched the original source on all four manual samples.
- Wiki Build, Catalog, World Map, Game Previews and Scenes contain useful implementation explanations; their main problems are reference inference and a few stale statements rather than a missing overall purpose.

## Route coverage

The following table lists every assigned route. Screenshot directories are under `/tmp/alive-review-ui/`; full capture/scroll detail is in coverage.json. All listed routes were captured completely and their screenshots inspected in contact sheets. This is not a claim that every implementation branch was behavior-tested.

| Route | Captures | Screenshot directory |
| --- | ---: | --- |
| development/types/types.html | 98 | 00-types_types |
| development/ui/app.html | 2 | 01-ui_app |
| development/ui/camera.html | 2 | 02-ui_camera |
| development/ui/controls.html | 2 | 03-ui_controls |
| development/ui/cursor.html | 2 | 04-ui_cursor |
| development/ui/debug.html | 2 | 05-ui_debug |
| development/ui/dimensions.html | 2 | 06-ui_dimensions |
| development/ui/dimensions/scrolling.html | 2 | 07-ui_dimensions_scrolling |
| development/ui/dimensions/sizing.html | 2 | 08-ui_dimensions_sizing |
| development/ui/entity/animated.html | 2 | 09-ui_entity_animated |
| development/ui/entity/bar.html | 2 | 10-ui_entity_bar |
| development/ui/entity/box.html | 2 | 11-ui_entity_box |
| development/ui/entity/coveredlight.html | 2 | 12-ui_entity_coveredlight |
| development/ui/entity/dots.html | 2 | 13-ui_entity_dots |
| development/ui/entity/fogofwar.html | 2 | 14-ui_entity_fogofwar |
| development/ui/entity/instances.html | 3 | 15-ui_entity_instances |
| development/ui/entity/layer.html | 3 | 16-ui_entity_layer |
| development/ui/entity/shadowcache.html | 2 | 17-ui_entity_shadowcache |
| development/ui/entity/sprite.html | 2 | 18-ui_entity_sprite |
| development/ui/entity/stack.html | 2 | 19-ui_entity_stack |
| development/ui/entity/swimming.html | 2 | 20-ui_entity_swimming |
| development/ui/entity/geometries.html | 4 | 21-ui_entity_geometries |
| development/ui/entity.html | 4 | 22-ui_entity |
| development/ui/joystick.html | 2 | 23-ui_joystick |
| development/ui/keyboard.html | 2 | 24-ui_keyboard |
| development/ui/paused.html | 2 | 25-ui_paused |
| development/ui/row/characters.html | 2 | 26-ui_row_characters |
| development/ui/row.html | 4 | 27-ui_row |
| development/ui/stats.html | 4 | 28-ui_stats |
| development/ui/systems.html | 2 | 29-ui_systems |
| development/ui/terminal.html | 2 | 30-ui_terminal |
| development/ui/world.html | 4 | 31-ui_world |
| development/wiki/app.html | 3 | 32-wiki_app |
| development/wiki/callout.html | 2 | 33-wiki_callout |
| development/wiki/catalogentry.html | 2 | 34-wiki_catalogentry |
| development/wiki/codeblock.html | 2 | 35-wiki_codeblock |
| development/wiki/damage.html | 2 | 36-wiki_damage |
| development/wiki/demoframe.html | 2 | 37-wiki_demoframe |
| development/wiki/gamepreview.html | 2 | 38-wiki_gamepreview |
| development/wiki/gridtable.html | 2 | 39-wiki_gridtable |
| development/wiki/interfacediagram.html | 2 | 40-wiki_interfacediagram |
| development/wiki/interfacelabels.html | 2 | 41-wiki_interfacelabels |
| development/wiki/largepreview.html | 2 | 42-wiki_largepreview |
| development/wiki/play.html | 2 | 43-wiki_play |
| development/wiki/textgallery.html | 2 | 44-wiki_textgallery |
| development/wiki/widgets.html | 2 | 45-wiki_widgets |
| development/wiki/worldmap.html | 2 | 46-wiki_worldmap |
| development/wiki/catalog.html | 2 | 47-wiki_catalog |
| development/wiki/codepage.html | 2 | 48-wiki_codepage |
| development/wiki/commands.html | 2 | 49-wiki_commands |
| development/wiki/index.html | 3 | 50-wiki_index |
| development/wiki/presets.html | 2 | 51-wiki_presets |
| development/wiki/preview.html | 2 | 52-wiki_preview |
| development/wiki/references.html | 2 | 53-wiki_references |
| development/wiki/scenes.html | 5 | 54-wiki_scenes |
| development/wiki/types.html | 7 | 55-wiki_types |
| development/wiki/visuals.html | 3 | 56-wiki_visuals |
