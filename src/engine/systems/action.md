# Action

Finds the contextual targets available to a movable entity. It advertises actions; [Trigger](trigger.md) and [Interact](interact.md) perform them.

| Target         | Selection                                                  |
| -------------- | ---------------------------------------------------------- |
| Current cell   | Direct actions, including portals and pending interactions |
| Adjacent cells | Reachable locks, doors and other nearby targets            |
| Inventory      | Available spell, skill and tool actions                    |

Refreshes after a reference generation changes and writes target IDs into [Actionable](../components/actionable.md). Blocking entities are checked before targets behind them in the same cell.

Each neighboring cell is read once for warp, lock, popup and mount candidates. Each predicate still selects its first matching entity in the original cell order, including the existing popup availability check. The array is local to that cell visit; no target survives into the next update through a cache.
