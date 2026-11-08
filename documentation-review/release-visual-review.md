# Release Visual Review

All 270 routes were reviewed on desktop, including every page-scroll band and overflowing table/code endpoint. Another 49 route/viewport samples were captured on phones. The initial review retained 1,704 images; redundant full-page Development overviews were kept as evidence rather than counted as additional inspection.

- [Development review](release-development-visual.md): 221 desktop routes and 31 phone samples, with complete coverage and independent tail inspection.
- [Gameplay review](release-gameplay-visual.md): 49 desktop routes and 18 phone samples, with an independent [tail review](release-gameplay-tail-visual.md).
- [Phone layout audit](release-phone-audit.json): every route checked at 390 pixels after the shared fixes, with no document overflow or runtime errors.

## Fixes

| Scope | Finding | Fix |
| --- | --- | --- |
| Source text | Inline JavaScript `Infinity` appeared as a game count. | Inline code preserves literal source; game amounts keep their native count display. |
| Wrapping | Long source paths, identifiers and generated subheadings overflowed on phones. Atomic plain page-link labels also overflowed. | Copy-safe soft breaks at source separators and camel-case boundaries; normal word wrapping for plain page links; source annotations and one readable link label corrected. Sprite/count/name references stay together. |
| Tables | Disabling the frozen column on phones detached its absolute vertical rule from the cell. | The edge remains positioned within its own cell. Desktop offsets use the table's CSS variable; phone rules follow their columns while scrolling. |
| Focus | Escape from a preview left Chromium's rounded outline around the whole page. | The page focus target suppresses its browser outline; previews and controls keep their native focus indicators. |
| Source notes | Character Pixels still described transparent selectable fallback text. | The note now matches the current composed-sprite renderer. |

Source wrapping and inner-table geometry were fixed in the shared components. The full phone scan then found six further source-text cases; those use the same wrapping changes, plus an explicit code annotation and a natural-language link label. No arbitrary mid-word breaks or font-size changes were added.

## Inspection Limits

Some initial Chromium captures omit native Canvas text and ordinary page text. Fresh Trading, Crafting and Brewing captures show populated lists and descriptions; their actual native popup records also contain their expected deals, ingredients, recipes and particles. This was not treated as an empty-scene defect or hidden with a CSS workaround. Evidence: `/tmp/alive-live-dialog-probe/`.

Feature previews retain their requested 23-cell width and two-pixel font. On a 390-pixel phone, their 414-pixel iframe pans inside the 354-pixel content area. Gear, Forging and Farming endpoint checks expose the complete Reset button, successfully reset the native world and produce no page overflow. This checks layout and the endpoint action; it does not claim an exhaustive mobile gesture review. Evidence: `/tmp/alive-release-final-visual/`.

## Verification

- TypeScript, lint and 238 fast tests passed.
- Documentation generators and all 80 browser checks passed. Sixteen text/visual checks also passed independently; the final focus/source checks passed after the last adjustments.
- All 270 phone routes have no document overflow or runtime errors.
- The documentation build produced 270 static Markdown routes.
- Source-copy checks preserve the exact identifiers despite visual wrapping. Table checks cover phone dividers before/after panning and the existing desktop frozen column. Native movement, focus, dialogs, reset and offscreen pause remain covered by the full browser suite.

Root inspected the after images under `/tmp/alive-release-inline-after/`, `/tmp/alive-release-final-visual/` and `/tmp/alive-release-phone-audit/`. The individual review reports retain the baseline screenshot paths and the exact scope of follow-up inspection.
