# Immersion

Changes swimming state and appearance when an entity enters or leaves immersible ground.

The system compares each entity's combined render generation before repeating its check. [Swimmable](../components/swimmable.md) preserves the original sprite while submerged; [Immersible](../components/immersible.md) describes the cell. [Movement](movement.md) determines whether the destination is reachable before immersion is applied.
