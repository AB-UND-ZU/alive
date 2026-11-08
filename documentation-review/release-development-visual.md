# Development Visual Review

All 221 Development routes were captured and visually inspected at 1440 × 1000: Engine 28, Entities 2, Systems 36, Components 76, Types 1, UI 31 and Docs 47. Another 31 representative routes were inspected at 390 × 1000, covering every group.

The desktop review includes every one of 556 page-scroll bands and 58 local table/code endpoints. The phone review includes every one of 148 page-scroll bands and 75 local endpoints. The 252 redundant full-page overviews remain available as evidence but were not counted as separate inspection. No runtime errors or unsupported glyphs were recorded. Desktop documents had no page-wide horizontal overflow.

Capture roots are `/tmp/alive-release-development/` and `/tmp/alive-release-development-phone/`. Complete routes, source paths, dimensions, scroll positions, screenshot paths and reviewers are recorded in [release-development-coverage.json](release-development-coverage.json). The independent review of desktop IDs110–220 is recorded in [release-development-tail-visual.md](release-development-tail-visual.md).

## Findings

| ID | Severity | Scope | Finding and evidence | Resolution |
| --- | --- | --- | --- | --- |
| DV01 | Medium | Shared technical inline text | World Snapshots turned the JavaScript constant `Infinity` into the game's bounded-count display. Source `src/engine/snapshot.md`; evidence `/tmp/alive-release-development/002/view-001.png`. | Root separated source-code text from native count formatting. Implementation codespans retain literal constants; actual game amounts retain native count rendering. |
| DV02 | Medium | Shared phone inline code | Docs App grew to 630 pixels in a 390-pixel viewport because `development/<group>/<source>.html` was atomic. Preview Scenes grew to 396 pixels because `Dimensions.topHudRows` was ordinary unbreakable prose. Evidence `/tmp/alive-release-development-phone/021/view-002.png` and `/tmp/alive-release-development-phone/028/view-003.png`. The other 29 sampled phone routes had no page-wide overflow. | Root added copy-safe break opportunities at source-path punctuation and corrected the identifier's Markdown formatting. Root reported both overflow examples and the copy check passing. |
| DV03 | Low | Local source documentation | Character Pixels claimed stacked drawings retained transparent selectable fallback text. Current `Cell` renders only the composite image; the adjacent Character Rows description was already accurate. Source `src/components/Row/characters.md`; evidence `/tmp/alive-release-development/168/view-000.png`. | Root corrected the stale clause to say stacked drawings have no selectable fallback text. |
| DV04 | Medium | Shared phone table rules | Mobile table vertical rules appeared at the outer left instead of their inner column boundary. The mobile `position: static` override removed the containing block of each absolute native rule. Evidence `/tmp/alive-release-development-phone/000/view-001.png`; also visible in the other phone table samples. | Root retained a relative edge cell at mobile widths, moved the desktop frozen offset to a table CSS variable and reset the mobile offset. Root added an alignment regression before and after horizontal scrolling while preserving the desktop sticky-column check. |

These findings describe the captured baseline. The coordinated fixes happened afterward; the complete 252 route/viewport visits were not recaptured after those fixes. Root reported 16 targeted text/visual browser checks passing (`/tmp/alive-release-render-browser.log`), 238 fast tests plus type checking and lint passing (`/tmp/alive-release-fast.log`), and the 270-page documentation build passing (`/tmp/alive-release-docs-build.log`). Root inspected the six desktop/phone rechecks in `/tmp/alive-release-inline-after/` and confirmed exact copied source text. The divider regression verifies native rule alignment before and after horizontal panning; its after screenshot is `/tmp/alive-release-phone-audit/hooks-divider.png`. These checks were run by root, not repeated by this reviewer.

## Layout Inspection

Desktop source declarations, field tables and adjacent explanations remain in a consistent row grid. Code-frame tabs, outer gutters, Copy buttons and bottom borders remain aligned at their local scroll endpoints. Wide source lines move inside their frames. Long component pages retain separate named declarations; their end sections were inspected rather than stopping at the first screen.

The Types index was inspected through its final rows and horizontal endpoint. Type names and source paths occupy separate columns. Duplicate names such as Layer and Level remain distinct rows. Full-size crops confirmed the top, middle and bottom of the tall endpoint image.

Phone headings preserve whole words, with local horizontal scrolling for a single word wider than the available columns. Wide tables and source declarations also retain local horizontal scrolling. Their necessity is separate from the document overflow and mobile rule defects above. Rich text, diagrams, native controls, syntax colors, route selection and Back/Next actions remained legible in the inspected samples.

Some contact-sheet thumbnails trim a few pixels from the left edge. Full-size Bumpable, Inventory and Position captures confirmed that their original content is intact. Tall element-only endpoint captures can include the fixed header; the overlapping ordinary viewport bands show the underlying text. These capture effects were not classified as product defects.

This review inspected display and content consistency. It did not repeat every interactive game feature test or exhaustively validate every implementation claim against source history. No product source files were changed by this inspection.
