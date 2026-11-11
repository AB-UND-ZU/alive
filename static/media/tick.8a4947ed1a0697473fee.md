# Tick

Advances each [Reference](../components/reference.md) clock before action systems run. Delta and tick intervals are milliseconds.

| Reference state              | Work                                                      |
| ---------------------------- | --------------------------------------------------------- |
| Ready and suspended          | Leave the clock stopped                                   |
| Below its tick               | Accumulate at most one tick's delta from this update      |
| Ready with counter zero      | Suspend it                                                |
| Ready with a nonzero counter | Subtract the interval and increment the render generation |
| Positive counter             | Decrement the remaining allowed ticks                     |

A negative counter keeps ticking. A nonpositive tick does not become processable; sequence reference frames use that to avoid action ticking. [Sequence](sequence.md) advances their elapsed time independently.
