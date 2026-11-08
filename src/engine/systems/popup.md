# Popup

Processes the active dialog using the hero's action reference, selection stack and tab state.

| Input                    | Result                                                      |
| ------------------------ | ----------------------------------------------------------- |
| Vertical direction       | Change the current row                                      |
| Confirm / back           | Enter a selection or return from it                         |
| Tab direction            | Change tabs while preserving per-tab selections             |
| Transaction confirmation | Check stock, funds or other requirements before applying it |

Create dialogs with `createPopup`: it initializes selection arrays and a priority-90 camera viewpoint. `closePopup` and `removePopup` handle the matching cleanup. [Popup data](../components/popup.md) describes the state shape.

[Trigger](trigger.md) queues input before this system. The generation and `lastInteraction` checks prevent the same action from also moving the hero. [Interact](interact.md) maintains the active contextual target later in the update.
