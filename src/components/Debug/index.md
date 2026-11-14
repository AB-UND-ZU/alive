# Debug

`ExtendedStats` mounts the renderer's FPS panel and an AVG panel on `document.body`. It samples actual Canvas frames and removes the panel when unmounted. AVG divides the number of frames by their elapsed time, so long stalls reduce the displayed rate.

| Prop | Default | Meaning |
| --- | --- | --- |
| `maxFps` | 120 | AVG panel scale |
| `rolling` | 10 | Seconds of samples included in the average |

`Terminal` contains the mount behind its local `stats` flag, which is off by default. Enable that flag when profiling the game renderer.
