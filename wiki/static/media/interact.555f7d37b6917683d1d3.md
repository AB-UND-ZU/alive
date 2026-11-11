# Interact

Carries out contextual interactions selected for the hero and maintains their active dialog or target state.

| Target                      | Work                                               |
| --------------------------- | -------------------------------------------------- |
| Popup                       | Open the selected dialog and maintain its position |
| Lock                        | Consume a matching key and unlock                  |
| Refillable or Farmable cell | Apply the supported item interaction               |
| Mountable                   | Board or leave the vessel                          |

[Action](action.md) discovers targets before this system runs. Stale interactions are cleared when their target disappears or becomes invalid. Dialog selection itself is handled by [Popup](popup.md).
