# Gameplay Visual Review

All 49 Gameplay routes were visually reviewed on desktop, including every page-scroll band and comparison endpoint. The capture set also includes 18 phone samples. It contains 615 images across 67 route/viewport visits. [Coverage](release-gameplay-coverage.json) lists their source pages, screenshots, scroll positions and scene states.

The catalog reviewer inspected desktop routes 0–22. Root independently inspected all 15 desktop Plants/Slots captures, routes 23–24. The [tail review](release-gameplay-tail-visual.md) covers routes 25–48, including seven phone samples. Additional phone samples receive separate independent handoff reports.

## Findings

| Scope | Finding | Outcome |
| --- | --- | --- |
| Preview focus | Escape left a rounded browser outline around the whole content area. | The page focus target suppresses that outline; native scene focus, dialog closing and Reset checks pass. |
| Stats wording | The introduction still called attack values “Hit rows.” | It now refers to Damage rows and explains that values precede bonuses and defenses. |
| Narrow previews | Native 414-pixel scenes show a partial frame in 354-pixel phone content. | This is a local scroller preserving the requested glyph size. Gear, Forging and Farming endpoint checks expose and activate Reset without page overflow. |
| Dialog capture | Some initial Shop, Craft and Brew captures omitted lists/descriptions and ordinary page text. | Fresh native captures and actual popup data contain the expected content. No scene-rendering workaround was added. |

The media, comparison tables, sprite variants, drop frames, descriptions and final demonstrations were checked as a continuous page flow. Plants includes both body/remains variants and fruit layers; Slots starts with the native Gear dialog and lists slot contents without an empty overview. Long comparisons move within their table scroller. The tail review records the corresponding item and interaction checks.

The [release review](release-visual-review.md) records the shared fixes and verification: 238 fast tests, 80 browser checks, targeted source/focus regressions and the all-route phone overflow audit. Initial baseline captures were not silently replaced with after images; the review distinguishes them from targeted follow-up evidence.
