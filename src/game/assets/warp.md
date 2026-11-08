# Portal Map

`getWarpMap` composes a portal's original map rows with its native selection frame and player marker. It reads the current level, selected level and `canWarp` to preserve the white, green and red frame states. `displayWarp` uses the same result and lock flags for its content and GO! button.

The helper is separate from `sequences.ts` because exports from that module form the sequence-handler registry. Wiki can reuse the map without adding a non-sequence function to that registry.

The return value also exposes the native `selection` layer. Wiki uses it to show all level regions together; ordinary sequences continue to consume `content`.

`getWarpSelection` renders a level frame and optional marker. `getWarpMap` supplies its gameplay color/state, while the wiki overview supplies green. The returned `background` excludes the selected frame.
