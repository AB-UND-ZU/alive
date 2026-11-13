# Popup views

`displayPopupView` in [utils.ts](utils.md) adapts a pure `(world, entity, state) => PopupView | undefined` builder into a popup sequence handler. A view names its content, details, selection, buttons, icon and optional dimensions. Return `undefined` when the dialog cannot be displayed.

`getPopupInputs` snapshots the mutable inputs used by current dialogs. It includes popup selections and text, hero stats and appearance, inventory item values, equipment, workstation state, save summaries, quest targets and chat completion names. Mutable component identities alone are not sufficient: consuming part of a stack need not increment its owner's render generation.

Animated dialogs also depend on the logical game clock. Map, warp, chat, sprite layers, forging, brewing and credits rebuild at game ticks. The resulting view is compared with its previous value before any repaint. This keeps animation timing with the existing game clock and avoids duplicating blink formulas in the cache. Ordinary dialogs rebuild only when their inputs change.

The map popup keeps one terrain snapshot per open sequence. Opening it again, returning to its tab, changing zoom, moving the player or changing their map item rebuilds that snapshot. Blinking only overlays the existing player sprite. Terrain, discovery and marker changes can remain outdated while it stays open; no simulation systems maintain map-specific revisions or send invalidations.

Views and their snapshots live in a weak map keyed by the popup sequence state. Closing, replacing or restoring a sequence cannot reuse another dialog's view, and no cached view is serialized into a save.

Builders must have no gameplay effects. Forging updates its hammer, hits and progress before reading its cached view. Save-list reconciliation and workstation separator updates also execute outside builders. `renderPopup` continues running each sequence update for opening text and sounds, scrolling, selection, hints and closing. It repaints settled details only when needed and releases opening animation origins once.

When a dialog starts reading a new mutable input or clock, add that dependency to `getPopupInputs` and a feature test that changes it while the dialog remains open.
<!-- source-types -->

## PopupView

```ts src/game/assets/popupView.ts
export type PopupView = {
  icon?: Sprite;
  content: Sprite[][];
  selection?: PopupSelection;
  details?: Sprite[][];
  overscan?: number;
  rightButton?: Sprite[];
  leftButton?: Sprite[];
  windowHeight?: number;
};
```

## ViewState

```ts src/game/assets/popupView.ts
type ViewState = {
  inputs: string;
  view?: PopupView;
  settled: boolean;
  signature?: string;
};
```
