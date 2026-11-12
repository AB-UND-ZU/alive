# Terminal

Mounts the Three.js canvas and the rows that frame it. The canvas contains `InstanceRoot`, `ShadowCache`, ambient light, `Camera` and `Systems`.

Children appear above the canvas, before the pause overlay. Feature previews use that slot for their aligned character-cell frame. Local `stats` and `controls` flags enable profiling panels and orbit controls during renderer development; both are off by default.

The optional `shadows` prop defaults to normal gameplay lighting. Wiki Light previews can disable shadow reception and circular light covers while retaining native fog of war.
