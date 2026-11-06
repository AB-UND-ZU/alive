# Testing game features

`harness.ts` boots game systems without React or WebGL. Use it for rules that should be deterministic. `render.tsx` adds the React Three test renderer when scene graph behavior matters.

## Small worlds

`createAreaWorld` builds a map from rows enclosed in `|` characters. The borders protect meaningful spaces from editor trimming. Each row must have the same width and the map needs a hero.

`holdMove` holds a direction. `walk` waits for a requested number of cell moves and throws if blocked. Use `holdMove` plus `step` to test a blocked movement rather than asking `walk` to complete an impossible step.

`trigger` queues an action and wakes the hero's reference frame. `step` advances 1/30-second frames. `advance` rounds a duration up to complete frames. `advanceUntil` waits for a condition with a timeout.

## What to assert

Name the feature and its outcome: wading near land, blocking deep water, stopping on release, or opening a matching lock. Check relevant component state or visible output. Keep setup small and use existing factories.

Jest setup seeds randomness and records sound calls. Slow suites cover larger generated worlds and rendering. Run `npm run test:fast` while working and `npm run test:all` when the affected feature needs the wider coverage.

Documentation browser tests check the imported examples, pause/reset controls, navigation, page errors, and small-screen layout. See [documentation tools](../documentation/index.md).
