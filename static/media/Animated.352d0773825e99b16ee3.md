# Animated

Moves a Three.js group toward its world position with a spring. It pauses with the world and updates the spring when its configuration changes.

A new `bumpGeneration` with a `bumpOrientation` first offsets the group in that direction, then returns it to the supplied position. Generation tracking prevents the same bump from replaying on an unrelated render. Child rendering props pass through to the animated group.
