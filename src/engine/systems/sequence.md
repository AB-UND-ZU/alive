# Sequence

Advances animation, dialog and quest states with elapsed milliseconds on every world update.

| Result from a sequence          | Runner action                                                          |
| ------------------------------- | ---------------------------------------------------------------------- |
| updated                         | Increment its reference frame generation                               |
| finished                        | Remove its particles and state, carrying the generation into the owner |
| All states using a frame finish | Dispose the shared frame                                               |

`createSequence` initializes elapsed time, arguments, particles and a reference frame. Starting the same named state again disposes its previous instance first. [Sequencable](../components/sequencable.md) defines the state slots; [Map](map.md) owns disposal helpers. Pausing the world stops this elapsed-time update too.
