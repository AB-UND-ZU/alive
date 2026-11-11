# Ballistics

Resolves projectile collisions and impact effects after reference generations change.

| Hit                          | Result                                       |
| ---------------------------- | -------------------------------------------- |
| Shootable target             | Apply damage and record a stuck arrow        |
| Structure fragment           | Resolve the fragment/root relationship       |
| Obstacle or completed flight | End the projectile and leave its drop/effect |

[Shootable](../components/shootable.md) belongs to targets, not shooters. Its arrow count is recovered by [Drop](drop.md). Projectile travel state is shared with the running [Sequence](sequence.md).
