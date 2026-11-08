# Initialize

Creates uninitialized cells around the highest-priority active viewpoint.

| Event                      | Work                                                        |
| -------------------------- | ----------------------------------------------------------- |
| Level changes              | Reset tracked camera position and initialize the first area |
| Viewpoint moves            | Queue missing cells around the rendered area and overscan   |
| Pending queue              | Initialize it gradually on later updates                    |
| Missing walkability matrix | Build the initial matrix                                    |

Runs first in the [system order](../ecs.md). [Level](../components/level.md) keeps cell data separate from its initialized flags; [Map](map.md) registers the resulting entities. `initializeCell` is also available to code that needs a particular cell immediately.
