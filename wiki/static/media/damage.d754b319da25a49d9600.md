# Damage

Move into a target with a [[item:sword]] equipped to attack. Power and wisdom increase damage; armor and resist reduce it.

| Attack | Bonus   | Defense |
| ------ | ------- | ------- |
| Melee  | Power   | Armor   |
| Magic  | Wisdom  | Resist  |
| True   | Ignored | Ignored |

```ts src/engine/systems/damage.ts
const attack = itemStats.melee || itemStats.magic || itemStats.true || 0;
const delta = offensive - defensive;
const damage = attack <= 0 ? 0 : delta > 0 ? delta : 1 / (2 - delta);
const newHp = Math.max(0, defenderStats.hp - damage);
```

- Add the listed bonus, if any, to the base attack damage.
- Subtract the matching defense to get `delta`.
- A positive `delta` is dealt directly. Otherwise, damage is `1 / (2 - delta)`.
- Zero or negative base damage deals no damage.
- Health keeps fractional damage between hits. The displayed health changes at whole-point thresholds.

## Calculate A Hit

```widget
damage
```

## Contact Attack

```scene
combat
```
