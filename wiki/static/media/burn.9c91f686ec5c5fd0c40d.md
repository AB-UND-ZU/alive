# Burn

Starts burning sequences, handles combustible terrain and extinguishes burning units in water.

| Input                  | Work                                               |
| ---------------------- | -------------------------------------------------- |
| Burnable terrain       | Start or continue its fire and destruction effects |
| Affectable burn amount | Start the unit's burn sequence                     |
| Swimming unit          | Clear active burning                               |

Unit burn damage repeats every four world ticks. Each damage pulse starts a fresh interval instead of catching up overdue pulses after leaving an old fire source. Contact damage while standing in fire keeps its existing cadence.

Runs after reference generation changes. [Magic](magic.md) supplies cast effects; [Sequence](sequence.md) advances their animations. `extinguishEntity` clears burn state and removes its fire sequence.
