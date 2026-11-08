# Action

Finds the contextual targets available to a movable entity. It advertises actions; [Trigger](trigger.md) and [Interact](interact.md) perform them.

| Target         | Selection                                                  |
| -------------- | ---------------------------------------------------------- |
| Current cell   | Direct actions, including portals and pending interactions |
| Adjacent cells | Reachable locks, doors and other nearby targets            |
| Inventory      | Available spell, skill and tool actions                    |

Refreshes after a reference generation changes and writes target IDs into [Actionable](../components/actionable.md). Blocking entities are checked before targets behind them in the same cell.
