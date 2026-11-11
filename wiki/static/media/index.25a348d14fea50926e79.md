# ALIVE

ASCII-based 2D adventure game. Using React and Three.js (with react-three-fiber).

```widget
text-callout
```

Start in [Play](play.md), or learn the [controls](keyboard-mouse.md). The [Dungeon](levels.md) introduces movement and combat before the island.

## Text Rendering

Only the [[data:256]] characters in [code page 437](https://en.wikipedia.org/wiki/Code_page_437) from the [DOS FONT](https://laemeur.sdf.org/fonts/) are used.

```widget
font-characters
```

The game uses the original [[data:16]] terminal colors.

```widget
palette
```

To create all sprites, characters are stacked over each other (with the only exception of health bars and stack counters, they are underscores `_` transformed to the appropriate length and dots, respectively).
