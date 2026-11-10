# Drop

Releases inventory, creates decay or vanish effects, and removes spent loot entities.

| Source                        | Output                              |
| ----------------------------- | ----------------------------------- |
| Unbound inventory             | Nearby item drops                   |
| Shootable arrow hits          | Recoverable arrows                  |
| Eligible recorded charge hit  | A charge drop                       |
| Remainable or Vanishable data | Replacement cells after destruction |

[Fate](fate.md) handles death before this cleanup. Empty disposable [Lootable](../components/lootable.md) entities are removed here. Use the [Map disposal helpers](map.md) so removed entities do not remain registered in cells.

Final corpse removal only considers decayed entities before resolving structure roots and death state. Healthy resources remain in the same ECS query but avoid those repeated lookups. A decayed fragment still checks its root, so boss limbs, replacement effects and kill accounting retain the same behavior.
