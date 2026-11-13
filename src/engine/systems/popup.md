# Popup

Processes the active dialog using the hero's action reference, selection stack and tab state.

| Input                    | Result                                                      |
| ------------------------ | ----------------------------------------------------------- |
| Vertical direction       | Change the current row                                      |
| Confirm / back           | Enter a selection or return from it                         |
| Tab direction            | Change tabs while preserving per-tab selections             |
| Transaction confirmation | Check stock, funds or other requirements before applying it |

Create dialogs with `createPopup`: it initializes selection arrays and a priority-90 camera viewpoint. The viewpoint is registered immediately so closing before the next world update is safe. Replacing an existing popup removes its old viewpoint and discovery sequence. `closePopup` and `removePopup` handle the matching cleanup. [Popup data](../components/popup.md) describes the state shape.

[Trigger](trigger.md) queues input before this system. The generation and `lastInteraction` checks prevent the same action from also moving the hero. [Interact](interact.md) maintains the active contextual target later in the update.

Chat edits use `typeChat(world, hero, keyIndex)` immediately, without sharing the pending movement/action slot. Omit the index to delete a character.

`submitChat(world, hero, line)` sends text, records history and executes slash commands through the same path as chat confirmation. It returns the command response, if any, and closes an open chat. Sequences can import it to make the player speak without opening a dialog. Keyboard selections may also be passed as an array to preserve layered special characters. The normal UI still requires test mode to submit chat.

An omitted or empty line clears the speech bubble without adding history.

`completeChat(world, hero)` appends the current command suggestion to the chat buffer. Desktop Tab and a right swipe use this function. Suggestions are display-only until accepted; history still contains only submitted text.

`navigateChat(world, hero, direction)` cycles suggestions for a draft. From an empty line it reads localStorage and browses submitted history. Browsing continues until the empty entry is reached or the line is edited. Text edits reset the suggestion selection.

Removing an active completed quest may close and remove it in the same operation. Cleanup checks whether that nested close already removed the popup before disposing its viewpoint.

Held navigation is consumed once per player reference tick. Redrawing hero stats within that tick cannot repeat the initial Up or Down step.

`getPopupLength` supplies the same row bounds to input handling and display. `updatePopupSelection` runs before reading display data when the [popup view inputs](../../game/assets/popupView.md) change, so a purchase, sale, consumption or tab change cannot leave the cursor outside the current list. Idle frames do not repeat that validation. If a quest loses its gathered requirements while choosing a reward, the dialog returns to its requirements instead of displaying an empty choice screen.

Forge choices are inventory indexes. `removeFromInventory` calls `updateInventorySelections` before splicing the inventory: later choices move with their items, and removing a chosen item cancels that choice and subsequent steps. Insufficient forging ingredients return the dialog to ingredient selection. Yielding marks the completed stage before consuming its inputs, and checks the current deal again.

The [Restorable component](../components/restorable.md) stores the confirmed save ID and the last displayed save summaries. `createPopup` attaches it to load dialogs; `openPopup` also initializes it for older restored dialogs. Shared popup and sequence types contain no save-specific state. Save deletion uses the confirmed ID. A reordered list cannot change the deletion target; a missing target cancels confirmation. The load dialog also redraws when the save summary list is replaced.

Scrollbar input queues a `scroll` action with its percentage in `contentTriggered`. The next player tick maps it to the renderer's `scrollMax`, so selected lists and plain text use the same bounds as the drawn handle. New drag positions replace the queued percentage before processing.
