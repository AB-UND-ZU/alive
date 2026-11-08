# Homing

Advances tracking effects and their paths, including discs and boss-created hazards.

Active effects check hits, lifetime and caster state. Movement waits for the relevant reference generation and is held during appearance effects. [Homing](../components/homing.md) stores the path and optional target; [AI](ai.md) creates its behavior and [Magic](magic.md) applies the cast effects.
