# Harvest

Handles tool work, bucket refills, crop growth and kettle recipe queues.

| Work                      | Gate                                                 |
| ------------------------- | ---------------------------------------------------- |
| Harvest or repair terrain | Active tool condition and a free actor action        |
| Refill a bucket           | A compatible refill source                           |
| Grow a crop               | Its scheduled world generation and growth conditions |
| Finish brewing            | The queued recipe's progress and kettle state        |

[Harvesting data](../../game/balancing/harvesting.md) supplies tools, durability and yields. [Farmable](../components/farmable.md) stores crop stages; [Brewable](../components/brewable.md) stores pending recipes. The actor's `lastInteraction` prevents work from sharing an action with movement or combat.
