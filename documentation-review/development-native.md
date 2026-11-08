# Development page review

All 203 Development routes were loaded and scrolled completely at 1440 × 1000. The review includes 24 Engine, 2 Entities, 36 Systems, 76 Components, 1 Types, 31 UI and 33 Docs pages. Their 255 page and internal-overflow screenshots were inspected as 348 bands in 87 contact sheets. The per-route record is in `development-native-coverage.json`; images remain in `/tmp/alive-development-native/`.

The browser recorded no runtime errors or document-width leaks. Tables retained natural height. The code-link audit found no visible link styling without its corresponding semantic anchor. These checks do not replace manual review: some punctuation detections were nested word fragments rather than visible orphan lines.

| Finding | Source and evidence | Resolution |
| --- | --- | --- |
| Native gray and white glyphs disappeared after GPU rasterization | Normal Chromium, `/tmp/alive-native-normal-before-late.png`; root reproduced this with clipped font cells outside React | Native glyphs render directly on the cell; stacked sprites remain SVG. A first normal-GPU probe retained all text, but later capture paths omitted it again. This was not a universal fix. Inspected `/tmp/alive-font-probes/stable-15s.png`, `stable-code.png` and `stable-mobile.png`. |
| Code frames could briefly shrink to six columns while changing routes | Component captures including Affectable, Collidable and Coverable | Measure the container before paint and ignore zero-width observer events. A focused observer test covers the failure. Root's settled-frame checks found normal widths. |
| A new source sample could inherit the previous sample's horizontal scroll offset | Shared code dialog | Remount only the source scroll area when its filename or text changes. The frame observer remains mounted. |
| Font notes described all cells as HTML composition | `src/game/assets/font.md`, contact sheet006 | Distinguish native WOFF single-layer glyphs from layered JSON sprite composition. |
| Harness notes named controls that no longer exist | `src/testing/harness.md` | Describe focus and dialog controls. |
| Cell creation notes omitted unknown-character behavior | `src/bindings/creation.md`; implementation defaults to air and logs unknown characters unless override is enabled | State this behavior directly. |
| Font atlas notes still claimed an outer frame | `src/documentation/TextGallery.md`, contact sheet086 | Describe hexadecimal labels and compact cells without an outer frame. |
| Generic frame labels did not create visible native tabs | Respawn and probability dialogs reported by the catalog review | Add an explicit `title` for native tab composition; accessible `label` remains separate. |
| Empty stat sprites could hide both value and label | Knock and Proc Delay | Use a plain gray amount and source label when no native sprite exists. |
| Multiword sprite names made frozen phone columns too wide | Terrain and Harvesting, catalog phone captures | Keep count/icon with the first word, permit whole-word wrapping after it, and measure the widest rendered word instead of the whole name. |
| Typed effect references used missing inventory templates | Bolt and Blast references | Resolve the native effect sprite before the inventory display sprite. |

The capture issue is not covered by the usual GPU-disabled browser configuration. Additional normal-GPU probes used the same local app and native WOFF font. Early smoothing experiments appeared to help, but repeated captures disproved a reliable CSS fix. Opaque backgrounds and compositor changes were investigated without adding them to the product.

After the final shared changes, 18 focused Jest tests passed across Row, character composition, tables, stat labels and code dialogs. Type checking and scoped lint passed before the last small stat fallback correction; the consolidated root checks cover the frozen source afterward. No claim is made here that the entire route screenshot set was regenerated after those final focused fixes. Fresh shared, catalog and consolidated browser checks supply that follow-up evidence.

## Fixed header follow-up

The three fixed header labels now use continuous native DOS-font text runs. Body cells keep their existing cell renderer; layered sprites still use the compositor. This avoids unnecessary per-character header paint fragments without introducing a second font or an SVG text fallback.

The scoped component tests passed (7 tests), as did type checking and lint. Four delayed normal-GPU full-viewport captures show the complete header and body on Welcome and Enemies at 390 and 1440 pixels: `/tmp/alive-font-probes/productionauto-{390,1440}-{palette,enemies}-body.png`. Repeated scrolling preceded each five-second wait. A normal window repeated the phone checks with the same full-viewport result.

A separate first-capture full-viewport check still omitted header glyphs on Welcome. Element-only header screenshots can also omit glyphs while an immediate full-viewport screenshot shows them correctly. The native header simplification is therefore not evidence of a universal rendering fix. Opaque cell backgrounds, header compositing transforms, removing cell clipping and switching to the bundled WOFF encoding did not reliably eliminate that capture artifact, and none of those workarounds was added to the product.

Root subsequently confirmed unchanged DOM, white SVG rectangles, player position and fog visibility during missing-content captures. An immediate `fullPage: true` screenshot restored the native controls and Three.js hero at the same viewport dimensions. This supports a browser screenshot raster-path limitation; the probes do not establish that users see the same failure in the live UI. Source is frozen. No opacity, filter or opaque-background workaround was installed, and no universal browser paint fix is claimed.
