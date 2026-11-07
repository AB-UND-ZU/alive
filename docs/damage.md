# Damage

Move into a target with a [[item:sword]] equipped to attack. Power and wisdom increase damage; armor and resist reduce it.

```widget
damage
```

| Attack   | Bonus  | Defense |
| -------- | ------ | ------- |
| Melee    | Power  | Armor   |
| Magic    | Wisdom | Resist  |
| True     | 0      | 0       |

```text
 attack = weapon damage + bonus
 delta  = attack - defense

 delta > 0 ──► damage = delta
 otherwise ──► damage = 1 / (2 - delta)
```

Zero weapon damage deals no damage. Fractions accumulate; the displayed health changes at whole-point thresholds.


```scene
combat
```
