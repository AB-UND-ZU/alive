# Magic

Applies cast effects to targets and turns received stat changes into their visual effects.

| Input                                  | Work                                                 |
| -------------------------------------- | ---------------------------------------------------- |
| Castable / Exertable                   | Resolve the owning cast and its affected targets     |
| Damage or healing                      | Apply relationship checks and the combat calculation |
| Burn or freeze                         | Start the corresponding effect state                 |
| Received resources or damage over time | Emit the matching markers and effects                |

The cast's target history prevents unintended repeated hits. [Damage](damage.md) supplies shared combat helpers; [Burn](burn.md), [Freeze](freeze.md) and [Sequence](sequence.md) advance the effects.

Initialize received-stat and damage-over-time caches from existing entities on setup. Restoring a [saved world](../../game/saves/index.md) must not replay old damage or pickups.
