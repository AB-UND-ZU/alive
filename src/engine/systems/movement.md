# Movement

Attempts grid movement when a unit's action reference advances.

| Check                                      | Result                                            |
| ------------------------------------------ | ------------------------------------------------- |
| Frozen, already interacted or no direction | Skip the move                                     |
| Destination and terrain                    | Choose walk, swim, fly or vessel rules            |
| Rigid structure                            | Check and move its body together                  |
| Successful move                            | Update map registration, facing and action timing |

Displaced units and mobs are processed before the player. [Push](push.md), [Spike](spike.md) and [Damage](damage.md) run before normal movement and can consume the action. Terrain tempo and equipment haste affect the reference interval. Position changes use [Map](map.md).

`updateMovementInterval` applies the current player speed while preserving elapsed tick progress. Popups call it when opening, closing or changing tabs so chat and dialog repeat intervals cannot carry into walking. Consume uses it for ordinary haste changes.
