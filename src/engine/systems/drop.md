# Drop

Releases inventory, creates decay or vanish effects, and removes spent loot entities.

| Source                        | Output                              |
| ----------------------------- | ----------------------------------- |
| Unbound inventory             | Nearby item drops                   |
| Shootable arrow hits          | Recoverable arrows                  |
| Eligible recorded charge hit  | A charge drop                       |
| Remainable or Vanishable data | Replacement cells after destruction |

[Fate](fate.md) handles death before this cleanup. Empty disposable [Lootable](../components/lootable.md) entities are removed here. Use the [Map disposal helpers](map.md) so removed entities do not remain registered in cells.
