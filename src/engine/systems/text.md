# Text

Chooses nearby tooltips and advances their displayed messages after contextual interactions update.

| Source                   | Use                              |
| ------------------------ | -------------------------------- |
| Nearby target            | Select its available name/dialog |
| Tooltip override         | Force a visible or hidden state  |
| Dialog or quest sequence | Queue the next message effect    |

[Tooltip](../components/tooltip.md) stores text and timing state. Selection depends on the hero's position, sight and current spawn/interaction state. [Sequence](sequence.md) advances the resulting message animation.

A changed visible player message bypasses the tooltip generation cache so its sequence starts on the next engine frame. The dialog sequence handles its three-second expiry and normal untyping, then clears the player override. Multiplayer clients animate these confirmed sequences locally.
