# Terminal renderer

`npm run terminal` starts the game in an ANSI terminal, including over SSH.
Use a terminal with UTF-8, a monospace font and true-color support. Arrow keys
or WASD move; Enter interacts; Space casts; Ctrl-S uses the skill. B opens the
bag, E quick actions, Q equipment, G gear, T stats, M the map and C chat.
Tab changes dialog tabs. Escape closes a dialog or pauses outside it.
Ctrl-C saves and exits. Terminal protocols do not report an isolated Shift
press, so Ctrl-S takes its place. Directional input releases after 100 ms
without another key event.

The game uses its normal ECS, sequences, popup sprites, fog and fixed-step
clock. It has no lights, shadows, health bars or stack dots. Motion snaps up
to the next terminal cell. `Terminal` is a React component; the custom React
host writes a cell frame to stdout without a DOM.

The game viewport is at most 33 columns and is centered in the terminal.
Stats sit above it and action hints below it. Resize updates the viewport.
At least 33 columns by 24 rows are required. Smaller windows pause the game
and show a resize message. 30 rows leave more room around dialogs.
`npm run terminal -- --level tutorial` starts directly in the dungeon;
`--level island` starts on an island. `--frames 240` prints a plain frame and
exits, which also works without a TTY. Add `--test` to enable chat commands
and command completion.

Saves use the engine's snapshot and upgrade functions, serialized with Node's
V8 serializer so shared references and Infinity survive. They are written
when pausing or quitting to `$XDG_DATA_HOME/alive/terminal.save`, defaulting
to `~/.local/share/alive/terminal.save`. The saved game appears in the normal
load dialog. This file is separate from browser saves.

## Sprite projection

The renderer reads the same layers and font masks as the other renderers.
Literal text and single CP437 characters retain their glyph and color. The
font's graphical control characters are translated to their Unicode forms.
Stacked sprites are composed first; black masks therefore erase earlier
layers before a terminal approximation is chosen.

People use `@`; Bandits `b`, Chiefs `B`, Zombies `z`, fish `α`, Spiders `x`
and Snakes `s`. Coins use `o`, fruit `o`, minerals `♦`, swords `/` and bottles
`¡`. Their colors come from the composed sprite. Dialog frames retain their
box-drawing characters above black half-cell masks; these thin, colored
lines remain visible even when a mask covers most pixels. Large bosses keep their
individual cell shapes. Water, beaches, desert, soil, paths and docks use
background colors so objects remain readable above them.

For other layered sprites, the projection chooses the DOS-font character
whose pixel mask best matches the composed sprite choosing the foreground and background colors that reproduce the most
pixels. This preserves black text on colored dialog buttons as well as
colored text on black. Transparent pixels compete with the
background color, so a small accent does not fill the whole terminal cell.
Projection results are cached by layer content and sprite name.
