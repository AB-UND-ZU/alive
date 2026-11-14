# Native terminal entry point

`createTerminalWorld(level)` boots an existing level with the normal engine
systems and generator. `runTerminal` connects stdin, stdout, resize events,
the fixed-step clock and filesystem saves to the terminal React renderer.
See [Terminal renderer](./index.md) for commands and keys.

Pause, Resume, Menu and Save use the same engine save and level callbacks.
Save errors remain visible in the pause overlay. Loading attaches a fresh
input controller and frame clock to the restored world. The viewport dimensions
are shared with the renderer so camera framing and terminal bounds agree.

`emitTerminalKeys` uses a 50 ms Escape decoder timeout: a bare Escape closes promptly while split arrow-key sequences are still recognized.

`--frames` emits ANSI on a TTY and plain text when redirected. `--color` and
`--plain` override that choice. `--test` enables the engine's test commands.

Interactive audio uses `ffplay` or `aplay` when installed, playing the normal game sounds on the host machine. Pause clears queued sounds; quitting stops the audio process.

The build wrapper bundles this entry point to a temporary directory and
removes the bundle on exit. Browser CSS is omitted; jsfxr remains external
because its CommonJS entry uses sloppy-mode global initialization.
