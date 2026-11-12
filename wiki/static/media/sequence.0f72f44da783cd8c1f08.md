# Sequence

Advances animation, dialog and quest states with elapsed milliseconds on every world update.

| Result from a sequence          | Runner action                                                          |
| ------------------------------- | ---------------------------------------------------------------------- |
| updated                         | Increment its reference frame generation                               |
| finished                        | Remove its particles and state, carrying the generation into the owner |
| All states using a frame finish | Dispose the shared frame                                               |

`createSequence` initializes elapsed time, arguments, particles and a reference frame. Starting an occupied state with `createSequence` warns before disposing its previous instance. `replaceSequence` explicitly replaces a running state and cleans its particles and reference frame first. Quest transitions, condition refreshes and portal vision transitions use that replacement path. [Sequencable](../components/sequencable.md) defines the state slots; [Map](map.md) owns disposal helpers. Pausing the world stops this elapsed-time update too. Weather falls and splash stages use this simulation time, so their landing and cleanup stay synchronized even when rendering stalls or a save is loaded.

Only frames used by a state in this update are checked for disposal, in ascending ID order. Frames created during the update are kept until the next one, and entities without states are skipped.
