# Click

Turns pointer targets into movement or a nearby action on the unit's action generation.

It skips an already consumed generation and units that cannot interact. [Clickable](../components/clickable.md) marks the pending target; [Bumpable](../components/bumpable.md) distinguishes repeated attempts. The resulting action is consumed by [Interact](interact.md), or its direction reaches [Movement](movement.md).
