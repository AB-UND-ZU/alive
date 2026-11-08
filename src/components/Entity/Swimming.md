# Swimming

Draws the water overlay over an immersed unit. Entry and exit animate its horizontal offset, height and opacity using the unit's movement spring and facing direction.

`active` selects immersion and `isVisible` controls the fade. Once an inactive overlay is fully hidden, the component stops rendering it. The water material receives shadows and sits at `immersibleHeight` in the sprite stack.
