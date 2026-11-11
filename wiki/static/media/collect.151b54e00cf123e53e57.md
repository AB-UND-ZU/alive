# Collect

Transfers nearby drops into a collector's inventory or applies stat pickups.

A collector needs [Collectable](../components/collectable.md), inventory, stats and movement. Work runs on its action generation, and is skipped while another collection or interaction is already using that action.

| Drop                  | Result                                   |
| --------------------- | ---------------------------------------- |
| Carried item          | Transfer the item and update its carrier |
| Stat pickup           | Apply the corresponding resource change  |
| Empty disposable loot | Leave cleanup to Drop                    |

[Inventory](../components/inventory.md) and the [Item](../components/item.md) carrier must agree. [Drop](drop.md) creates the loot entities that this system consumes.
