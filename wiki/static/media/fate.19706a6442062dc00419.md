# Fate

Handles player death, ghost travel, tombstones and revival after effects and sequences have updated.

| State       | Work                                                         |
| ----------- | ------------------------------------------------------------ |
| Dead player | Preserve revival data and create the death/tombstone effects |
| Ghost       | Keep the reduced ghost view and return state                 |
| Revival     | Restore the saved class appearance, stats and spawn view     |

[Soul](../components/soul.md) holds revival data; [Spawnable](../components/spawnable.md) holds the return point and appearance. This runs before [Drop](drop.md), so the tombstone and respawn state exist before inventory cleanup.
