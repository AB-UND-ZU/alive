# Live gameplay performance investigation

These developer-only entry points use the production React build, normal clocks,
engine systems, springs, input and audio. They are not imported by the shipped game.
Run commands from the repository root with dependencies installed.

```
node scripts/live-performance/build.cjs baseline
node scripts/live-performance/serve.cjs
WIDTH=390 CPU=4 node scripts/live-performance/play.cjs baseline menu 1
node scripts/live-performance/play.cjs baseline boss 1
node scripts/live-performance/play.cjs baseline long 1
```

Build `baseline` from commit 8301359. Build subsequent named stages from each
candidate commit. Do not overwrite a baseline bundle after changing source.
`POC=action-cell node scripts/live-performance/build.cjs action-cell` applies a
candidate source transform without modifying production source. The transforms
in pocs.cjs target the baseline source and deliberately reject missing anchors.
The audio-worker PoC predates the production implementation's error recovery.

The menu uses the real entry flow. Tutorial uses the existing tutorial world.
Boss uses the generated island, moves the hero to its worm room, and kills the
bait to trigger the real encounter. Long initializes 24 additional regions before
mounting the game, then runs that encounter. This models retained exploration
state; it is not a claim that a human played for hours. Hero health is increased
only in the encounter harness so identical input can survive long enough to
measure. No rendering options or enemy rules are changed.

play.cjs sends actual keyboard input for 12 movement cycles, with Space between
moves in combat, and captures main-thread CPU samples, frame intervals, engine
system timings, renderer submission CPU, draw counts, heap counters, and long
tasks. Screenshots are taken outside the measured interval. Heap counters without
forced GC do not prove retained-memory growth. Render submission time is not GPU
execution time. CPU=4 throttles the main thread and WIDTH=390 tests narrow layout;
neither emulates a physical phone GPU or its complete power/thermal behavior.

```
node scripts/live-performance/screen.cjs baseline candidate
```

The controlled screen runs 600 deterministic simulation ticks after warmup,
three alternating repetitions in both the menu and a fully loaded island fight.
It compares a hash of the complete serialized ECS state, and fails on differences.
This isolates CPU changes and complements, rather than replaces, live gameplay.
Audio is suspended during this screen. Run each experiment alone; do not overlap
with tests, builds, or another browser benchmark. Keep a named copy of screen.json
before the next experiment overwrites it.

Results, profiles and screenshots go to ignored results/performance/live. Live
profiles vary as real frame pacing changes simulation/input timing. Compare
repeated runs and subsystem costs, not one maximum frame or an additive sum of
unrelated percentages. Early diagnostic runs took screenshots inside the timing
window; only clean runs are used for final frame-tail claims. An early long-scene
probe teleported repeatedly after mounting and was replaced with initialization
before mounting; that diagnostic run is excluded too.

production-audio.cjs checks the actual CRA production worker chunk through the
production server on port 4187, worker completion/termination, audio playback,
pause/resume, and unsupported-worker fallback at desktop and narrow widths.
