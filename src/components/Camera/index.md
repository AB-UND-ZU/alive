# Camera

Positions the orthographic camera from `useViewpoint`. World x coordinates use the cell aspect ratio; world y is inverted for the renderer. Zoom follows the current cell height.

| Input | Effect |
| --- | --- |
| `position` and `fraction` | Target cell and partial-cell offset |
| `config` | Movement spring |
| `jump` | Move immediately, including the first restored frame |
| `paused` | Pause the spring |
