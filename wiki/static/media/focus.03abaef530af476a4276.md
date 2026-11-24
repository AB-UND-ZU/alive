# Focus

Maintains quest, enemy and grave highlights, including transitions between targets.

[Focusable](../components/focusable.md) holds current and pending target IDs. On world load, the highlight starts at the hero. An active target uses the usual movement animation from there. Missing or removed targets clear the highlight; a changed target starts its transition. The compass target can follow its carrier after a drop. [Needle](needle.md) turns that target into a direction after focus has been updated.
