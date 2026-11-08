# Spacing Follow-up

Inspected six Chromium screenshots after the shared spacing/frame update: Gear Contents, Resources source frames and Structures at 1440×1000 and 390×844. Compared them with `/tmp/alive-spacing-review/before-*` and the prior catalog captures.

| Check | Desktop | Phone |
| --- | --- | --- |
| Contents title | Full black `CONTENTS` on green; intact green border | Full title fits; intact green border |
| Contents frame width | 1008 px | 354 px |
| Adjacent source-frame box gaps | 0 px, 0 px | 0 px, 0 px |
| Structures Contents frames | 0 | 0 |
| Document overflow / runtime errors | None | None |

The source frames retain their native half-cell border/title positions without an extra blank row between frame boxes. Structures goes from its introduction to the building comparison, without an empty Contents frame. No new issue was found in this scope.

Screenshots: `/tmp/alive-spacing-followup/contents-{1440,390}.png`, `sources-{1440,390}.png`, `structures-{1440,390}.png`. Measurements and visit coverage: `/tmp/alive-spacing-followup/coverage.json`. Reproduction: `/tmp/alive-spacing-followup.cjs`. The supplied before screenshots did not target the Contents frame itself; its final appearance was inspected directly.

The current development server was inspected after the parent confirmed the 270-route static build passed. No source changes were made. Browser closed after capture.

## Layout and Content

- Desktop menu content moved from x=36 to x=18. Its right edge is x=324, leaving one 18-pixel cell before the scrollbar at x=342. Content and the Wiki header moved from x=378 to x=396, two cells after the scrollbar's right edge at x=360.
- Phone content and its Wiki header align at x=18. The menu keeps one cell before its scrollbar. Before/after measurements and reference images are in `/tmp/alive-spacing-review`.
- Contents recolors the native title tab green. Shared Frames reserve enough columns for the complete title rather than truncating it; other frame titles retain their normal native colors.
- Golem and Golem Limb share one comparison, with Limb on the right. Adds excludes Limb and Hedges; existing Hedge details remain available.
- The Damage code is followed by the earlier calculation explanation as five list items, checked against the current damage function. The duplicate fractional-health paragraph was removed.

The built `/wiki` subtree was also inspected on eight desktop/phone visits: Enemies, Damage, Gear and Structures. Golem/Limb columns, the Damage list and Contents were captured; phone comparisons scroll locally. No HTTP/runtime errors or document overflow occurred. Coverage and nine screenshots: `/tmp/alive-layout-built-review`.

## Verification

- TypeScript, lint and all 237 fast tests passed across 39 suites.
- `npm run wiki:test`: all 8 Node checks and all 78 Chromium checks passed.
- Source types: 252 declarations. Wiki build: 270 Markdown routes under `build/wiki`.
- The all-route audit checked 270 pages, 6,716 internal links and 5,809 anchors. No broken destinations, duplicate prose/IDs, document overflow, raw player markup, raw Infinity data or runtime/HTTP errors. The native `???` Class remains valid. [Measurements](current-route-audit.json).
- A final title-width guard also prevents the preferred frame width from being narrower than its complete title. Its focused native-title test passed; all 13 shared layout/browser checks passed again after that adjustment.
- `git diff --check` passed.

The test runner retains its existing dependency notices and timer teardown warning. No native game behavior changed in this follow-up. All edits remain uncommitted; nothing was deployed.
