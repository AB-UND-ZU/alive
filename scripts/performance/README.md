# Performance comparisons

Run from the repository root after `npm ci`. These scripts use the installed Playwright Chromium and a production React bundle. They do not change production behavior or add runtime feature flags.

```sh
node scripts/performance/build.cjs baseline
node scripts/performance/build.cjs path
node scripts/performance/build.cjs matrix
node scripts/performance/build.cjs uploads
node scripts/performance/build.cjs hud
node scripts/performance/serve.cjs
```

Leave the local server running. In a second terminal, run the following sequentially, without tests or other benchmarks running concurrently:

```sh
node scripts/performance/measure.cjs baseline path
node scripts/performance/paired.cjs path matrix
node scripts/performance/paired.cjs matrix uploads
LEVEL=island node scripts/performance/paired.cjs path matrix
LEVEL=island node scripts/performance/paired.cjs matrix uploads
node scripts/performance/transfers.cjs matrix uploads
node scripts/performance/timers.cjs
node scripts/performance/verify.cjs baseline path matrix uploads hud
ANIMATE=1 node scripts/performance/verify.cjs baseline path matrix uploads hud
```

`stages.json` records the base commit and the incremental source replacements for each stage. The final stage matches the production source; earlier stages remove one change at a time. Builds use the current tree for all other modules. Reproduce against the recorded base when other runtime files have changed. `build.cjs --capture` is for maintaining stage snapshots during sequential development, not for reconstructing the reference baseline from a finished implementation.

Results, source snapshots, timings and PNGs go into ignored `results/performance/`. Path measurements batch ten searches per sample to reduce timer quantization and compare returned routes. Reachable workloads open the endpoints; a separate blocked-goal workload measures exhaustive failure searches. Paired CPU measurements alternate the order of stages across 25 measured rounds after warmup. `matrix` measures scene world-matrix traversal; `sync` includes that traversal and instance synchronization; `moving` also changes an ancestor transform each iteration. These are subsystem timings, not whole-frame timings or FPS predictions.

The transfer check instruments actual WebGL `bufferSubData` calls on a settled tutorial. It measures idle traffic; animated objects still require updates. The timer check measures twenty Stats mount/unmount cycles, with a separate automated test covering Controls cleanup and Strict Mode.

Visual verification compares game-canvas PNGs and engine state against the baseline at two viewport sizes. It uses deterministic engine ticks and a controlled spring clock, including settled and intermediate animation frames. The game stays mounted for movement, resize, pause and interactions. Restore and remount explicitly await the new world. Full-page screenshots are also saved for pause, resume and completed spells. Inspect screenshots as well as the assertions.

For the real production bundle, serve `build/` at `http://127.0.0.1:4187/alive/`, then run `node scripts/performance/production.cjs`. This checks startup, keyboard interaction, pause/resume and reload at desktop and small-screen sizes. It does not replace the deterministic save/restore and gameplay checks.
