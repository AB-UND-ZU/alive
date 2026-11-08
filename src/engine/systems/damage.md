# Damage

Resolves melee attempts and provides the shared combat calculations used by other systems.

An attacker acts once per [Movable](../components/movable.md) reference generation. It must be controllable, have a weapon and an attempted direction, and not have consumed the same action already.

| Check                           | Result                                                    |
| ------------------------------- | --------------------------------------------------------- |
| Target and faction relationship | Damage enemies or heal cooperating targets as appropriate |
| Weapon and entity stats         | Calculate damage against armor or resist                  |
| Health threshold crossed        | Emit a visible hit marker                                 |

`calculateDamage` preserves fractional health. Positive offense minus defense is dealt directly; otherwise damage is `1 / (2 - delta)`. A nonpositive attack deals zero. The returned `hp` is the precise value; `damage` is the displayed change.

[Push](push.md) and [Spike](spike.md) run before melee; [Movement](movement.md) runs after it. Shared helpers are also used by [Magic](magic.md) and [Ballistics](ballistics.md).
