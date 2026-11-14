# Asset Helpers

`getItemSprite` selects the same facing and amount for both normal and terminal layers. Dialog composition preserves the selected variant through background and crop sprites.

Composes game dialog content and resolves item or unit visuals. These helpers keep names, colors, quantities and layered equipment consistent across UI callers.

| Function              | Contract                                                              |
| --------------------- | --------------------------------------------------------------------- |
| npcSequence           | Start an NPC state at START_STEP with caller-supplied memory          |
| questSequence         | Start a quest state and optional giver reference                      |
| step                  | Run entry once, wait for completion and choose the next stage         |
| scrolledVerticalIndex | Position the selected row in the visible popup window                 |
| renderPopup           | Compose dialog content, details, selection and frame                  |
| getLootDelay          | Compute the delay for a loot movement                                 |
| queueMessage          | Append sprite-based message rows to an entity                         |
| getItemConfig         | Resolve the item's material/element/stat sprite definition            |
| getItemSprite         | Choose a world, resource or display variant and its facing            |
| createItemText        | Quantity followed by icon and optionally the full name                |
| createItemName        | Display icon followed by the normalized item name                     |
| getUnitSprite         | Compose backdrop, shield, body, visible sword and relationship marker |
| createUnitName        | Unit icon and normalized name in the faction's dialog color           |

`step` changes `lastStep` only after entry succeeds. Completing a step selects `onLeave()`; END_STEP finishes the sequence.

`getItemSprite` returns the missing sprite for an unresolved configuration. A zero-amount weapon returns no sprite, preserving the hidden-claw convention. [Descriptions](descriptions.md) and [unit definitions](../balancing/units.md) supply the underlying data. Popup frame dimensions and timing constants stay here so dialogs share one layout.
`displayPopupView` accepts a pure builder returning a named [PopupView](popupView.md). `renderPopup` caches that view against mutable dialog inputs, while continuing to advance text reveal, selection, scrolling and hints each update. Background inventory, equipment and stat changes refresh rows and buttons. Details overwrite their complete rectangle, including blank cells. A change in detail padding also refreshes the separator and scrollbar even when the content keeps the same number of rows. Button particles are updated in place and remain owned by the popup sequence for cleanup.
Terminal item displays use the explicit amount override, or the item amount when none is passed. Browser layers keep the existing explicit-override behavior.
<!-- source-types -->

## StepAnimations

```ts src/game/assets/utils.ts
type StepAnimations = QuestSequence | NpcSequence;
```

## QuestStage

```ts src/game/assets/utils.ts
export type QuestStage<T extends StepAnimations> = {
  world: World;
  entity: Entity;
  state: SequenceState<T>;
  updated: boolean;
  finished: boolean;
};
```

## PopupSelection

```ts src/game/assets/utils.ts
export type PopupSelection = "blocked" | "selected" | "active";
```
