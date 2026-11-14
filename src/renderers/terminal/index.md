# Terminal renderer

`npm run terminal` starts Alive in an ANSI terminal, including over SSH.
Use UTF-8 and a monospace font. The renderer uses the terminal's standard
16-color palette.

Arrow keys or WASD move; Enter interacts; Space casts; Ctrl-S uses the skill.
B opens the bag, E quick actions, Q equipment, G gear, T stats, M the map and
C chat. Tab changes dialog tabs. Escape closes a dialog or opens Pause.
In Pause, Up/Down selects Resume, Menu or Save, and Enter activates it.
Escape or Space resumes; Ctrl-S saves. Ctrl-C saves and exits.
Terminal protocols do not report an isolated Shift press, so Ctrl-S takes
its place. Directional input releases after 100 ms without another key event.

`npm run terminal -- --test` enables chat commands and command completion.
`--level tutorial` starts in the dungeon; `--level island` starts on an island.
`--frames 240` advances the engine and prints a frame without opening an
interactive session. It uses colors on a TTY; add `--color` for redirected
ANSI output, or `--plain` for plain text.

The game viewport is centered and capped at 33 columns by 13 rows. The normal
HP, MP and XP progress rows, pause button, equipped actions and compass sit
outside it. Their labels, colors, supply and mana rows use the same sprite
helpers as browser controls. The outer chrome spans the terminal width.
At least 33 columns by 24 rows are required. Smaller windows pause the game
and show a resize message.

Sounds use the existing Web Audio buffers and scheduling through a native audio context. Its audio thread runs independently of terminal rendering. Pause and mute use the shared gain controls. Audio plays on the host running the game; SSH does not forward it to the connected client.

The renderer uses the normal ECS, sequences, popup sprites, fog and fixed-step
clock. It has no lights, shadows, entity health bars or stack dots. Movement
snaps to terminal cells; sequence particles keep their animated paths. `Terminal` is a React component; its custom host
writes a cell frame to stdout without a DOM. `TerminalSession` supplies the
pause selection, loading state, saved-game name and save failure state.

Saves use the engine snapshot and upgrade functions, serialized with Node's
V8 serializer so shared references and Infinity survive. They are written
when pausing or quitting to `$XDG_DATA_HOME/alive/terminal.save`, defaulting
to `~/.local/share/alive/terminal.save`. The saved game appears in the normal
load dialog. This file is separate from browser saves.

## Sprite projection

The renderer composes the existing stacked character sprites before choosing
one terminal character, foreground and background color. Source text and
box-drawing characters remain readable. Semantic sprites retain recognizable
source glyphs and colors; terrain uses background colors. See
[Sprite projection](./sprites.md) for the projection rules.
Terminal popup headers use bracketed tab names with the core selected and inactive palettes. Full titles stay visible; the close button moves right when the longer header needs room.

The native React host exports these screen helpers from [Terminal screen](./screen.md).
