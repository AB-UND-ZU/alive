# Native terminal entry point

`createTerminalWorld(level)` boots an existing level with the normal engine
systems and generator. `runTerminal` connects stdin, stdout, resize events,
the fixed-step clock and filesystem saves to the terminal React renderer.
See [Terminal renderer](./index.md) for commands and keys.

The build wrapper bundles this entry point to a temporary directory and
removes the bundle on exit. Browser CSS is omitted; jsfxr remains external
because its CommonJS entry uses sloppy-mode global initialization.
