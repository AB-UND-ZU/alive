# Debug

`ExtendedStats` mounts the renderer's FPS panel and an AVG panel on `document.body`. It removes the panel and animation callback when unmounted.

| Prop | Default | Meaning |
| --- | --- | --- |
| `maxFps` | 120 | AVG panel scale |
| `rolling` | 10 | Seconds of samples included in the average |

`Terminal` contains the mount behind its local `stats` flag, which is off by default. Enable that flag when profiling the game renderer.
