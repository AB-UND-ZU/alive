# Build

Places construction plans and applies building or repair work on the actor's action generation.

| State                             | Result                                       |
| --------------------------------- | -------------------------------------------- |
| Valid hammer condition and target | Spend one work action                        |
| Plot health below maximum         | Keep the unfinished plot                     |
| Plot health reaches maximum       | Replace it with the cell stored in Buildable |

Checks `lastInteraction` so the same generation cannot also move or attack. [Buildable](../components/buildable.md) stores the finished cell; [Stats](../components/stats.md) stores progress. Plans, costs and ground restrictions come from [building data](../../game/balancing/building.md).
