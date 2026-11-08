# Gameplay Items, Interactions And Rendering Review

Inspected every stored capture for route indices 25–48: 24 desktop routes at 1440 × 1000 and seven phone samples at 390 × 1000. All 91 contact sheets were inspected:214 ordinary scroll bands,98 local horizontal endpoints, four focused scenes and four Escape states,320 images in total. The range covers Elements through Animations. No runtime errors or document-wide horizontal overflow were recorded in these visits.

Evidence is under `/tmp/alive-release-gameplay/`. [release-gameplay-tail-coverage.json](release-gameplay-tail-coverage.json) records each route, viewport, capture and inspected sheet. The same sheet paths are in `/tmp/alive-release-gameplay/inspected-items.json`.

## Findings

**GT01 — browser focus outline, low severity; shared.** Returning focus from the Spells or Animations iframe with Escape draws Chromium's blue rounded outline around the entire main content. The focused scene itself correctly uses the native green frame. Evidence:`28-1440-018.png` and`48-1440-003.png`. Suggested fix: suppress the browser outline only on the main focus-return target; retain the native scene and link keyboard indicators. Reported to root; no source changed by this reviewer.

**GT02 — native-size preview panning requires a targeted endpoint check.** Phone Gear, Forging and Farming initially show only the left portion of their 23-cell scene; the right frame edge and Reset button extend beyond the visible content width. Evidence:`26-390-033.png`,`39-390-024.png`,`42-390-007.png`. Source `GamePreview.tsx` places the iframe inside `.PreviewScroll`, whose native `overflow:auto` preserves whole game cells. There is no document overflow. The baseline capture script covered table and code scrollers but omitted this iframe wrapper, so these images cannot prove its rightmost controls are reachable. Root is checking local horizontal panning separately. If panning exposes the complete frame and Reset, this is an intentional native-size width limitation, not a confirmed clipping defect.

## Native Popup Capture Limit

The stored Trading, Crafting, Brewing and Forging demos sometimes show their native frame, tabs, scrollbar and action buttons without the list or description particles. This persists across their final ordinary bands: Trading`35-1440-002/003.png`, Crafting`37-1440-001/002.png`, Brewing`38-1440-008/009.png`, Forging`39-1440-020/021.png`. Their static native snapshots earlier on each page contain the expected text.

Root reproduced Trading, Crafting and Brewing after a 5.5-second wait and captured populated lists and descriptions at idle and focus. Native ECS state contains 19 shop deals, nine crafting ingredients and ten brewing recipes. Recheck evidence is `/tmp/alive-live-dialog-probe/{trading,crafting,brewing}-{idle,focus}.png` and`state.json`. This is recorded as a screenshot/compositor limitation, rather than an empty game-data defect. No game-rendering workaround was added from this observation.

## Display Inspection

Item comparison tables retain their inner grid, native stat colors, amount/icon/name format and common preview alignment through the final material and element variants. Every captured horizontal endpoint was inspected. Acquisition frames expose their complete lists at the captured endpoints; empty sources stay blank rather than inventing rewards. The long Forging table was followed through its final Boots rows on desktop and phone.

The command reference, command search, native static dialogs, quest-stage lists, crafting and brewing ingredient lines remain readable. Multiple ingredients occupy separate table lines. Native sign content retains its source colors, text wrapping and scrollbar. Growing Wheat shows its successive native soil/plant sprites. Rendering pages retain readable source frames, native light/fog media and viewport data.

Phone table-rule displacement visible in these baseline captures is the same shared defect found in the Development review. Root fixed it centrally and added before/after-pan alignment checks; it is not a separate local finding. Some locally scrolling headings and tables require panning to preserve native whole-word glyph widths.

This was a review of stored captures, with root's separate popup reproduction noted explicitly. No browser was launched, no product source was edited and no commits were made by this reviewer.
