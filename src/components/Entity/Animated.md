# Animated

Samples an entity's movement and bump offsets from [the simulation motion timeline](../../engine/motion.md). Position updates happen before instance uploads and shadow checks, including when several simulation steps occur between rendered frames.

A bump offsets the group in its recorded direction and returns it using the entity's movement configuration. The engine records bump generations when they occur, so React commits cannot restart or delay them. World pause and suspension freeze the position.

React initializes the group's transform once. Later frames update its cached local matrix only when the sampled position changes. Child rendering props pass through to the group.
