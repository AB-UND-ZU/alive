# Performance implementation and verification

Workspace: `alive-worktree-6`, branch `perf/alive-6`. Rebased onto local main `1954fd1` (the fetched remote main was older). The four initial changes below and the three follow-up optimizations are enabled in normal production code, with no experimental runtime flags.

## Changes

1. **Sparse pathfinding** — `src/game/math/sparseGraph.ts`, used by both `findPath` and `findPathSimple` in `src/game/math/path.ts`. Previously each query allocated and initialized a node for every cell in the doubled walkability matrix. A fresh graph now creates only nodes reached by A\*, with the same weights, heuristic, neighbor order and search library. Fresh graphs preserve terrain changes and isolate forced endpoints. This removes a map-size allocation cost from short NPC paths; a search that explores the entire map still does map-size work.
2. **Cached local matrices** — `src/components/Entity/matrixUpdates.ts`, used in `Entity`, `Sprite`, `Layer`, `Box` and `Instances`. Known static objects calculate their local matrix after React prop updates instead of every frame. Animated objects retain automatic updates, and parent/world transforms still propagate. Position, dimensions, orientation and sprite offsets remain reactive. This does not freeze the camera, springs or world matrices.
3. **Matrix cache and selective instance uploads** — `src/components/Entity/Instances.tsx`. Every opaque glyph/box instance remembers its last world matrix, color, mesh and slot. Only changes write buffer data and mark a bounded range for GPU upload. Growth and swap-removal invalidate slots. Dirty ranges survive skipped draws until WebGL consumes them. This removes idle buffer traffic while preserving animation, movement and lighting changes.
4. **HUD cleanup** — `src/components/Stats/index.tsx` and `src/components/Controls/index.tsx`. Highlight intervals stop on unmount. Controls cleanup is separate from action-change effects, so changing equipment does not reset the highlight animation. The benefit accumulates across world/UI remounts; it is not a first-frame FPS claim.

No sprites, render resolution, lighting, shadows, game rules or animation quality were reduced. No generation or minimap snapshots were rebuilt.

## Measurement method

See [the reproduction instructions](scripts/performance/README.md). Each stage contains only the next change, preserving previous accepted stages. The final stage's runtime source is checked against the actual implementation. CPU comparisons alternate stage order, with warmup and 25 measured rounds. Path samples average ten calls to avoid coarse timer resolution. Short/long route benchmarks use walkable endpoints; a separate blocked-goal workload measures exhaustive failure searches. Raw timings, pixel comparisons and screenshots are in ignored `results/performance/`.

The browser is headless Playwright Chromium 141.0.7390.37 on this Mac, using ANGLE / Vulkan SwiftShader (software rendering). These measurements establish subsystem CPU savings, reduced allocations by construction, actual WebGL transfer savings and timer lifetime improvements. They do not establish an identical FPS improvement on every GPU or phone. A settled scene is used for idle transfers; movement and color changes must still upload data.

## Measured results

All times below are medians in milliseconds per subsystem call, measured with one change between adjacent stages. The tutorial contained 1,261 scene objects / 7,182 ECS entities, and the island 1,868 objects / 8,592 entities. Only the visible scene is rendered.

| Change / workload                                       |                            Before |                       After |                Improvement |
| ------------------------------------------------------- | --------------------------------: | --------------------------: | -------------------------: |
| Sparse graph: 480×480 short wrapped path                |                           5.80 ms |                     0.01 ms | About 99.8% less query CPU |
| Sparse graph: wrapped-path batch p95 per call           |                           6.53 ms |                     0.02 ms |          About 99.7% lower |
| Sparse graph: 96×96 long path                           |                           0.20 ms |                     0.19 ms |      Essentially unchanged |
| Sparse graph: 96×96 exhaustive blocked goal             |                           0.98 ms |                     0.97 ms |      Essentially unchanged |
| Cached local matrices: tutorial matrix traversal        |                         0.0902 ms |                   0.0664 ms |             26.4% less CPU |
| Cached local matrices: island matrix traversal          |                         0.1256 ms |                   0.0958 ms |             23.7% less CPU |
| Cached local matrices: island traversal + instance sync |                         0.1576 ms |                   0.1280 ms |             18.8% less CPU |
| Selective uploads: tutorial traversal + instance sync   |                         0.0910 ms |                   0.0822 ms |              9.7% less CPU |
| Selective uploads: tutorial moving parent + sync        |                         0.0868 ms |                   0.0828 ms |              4.6% less CPU |
| Selective uploads: island traversal + instance sync     |                         0.1252 ms |                   0.1170 ms |              6.5% less CPU |
| Selective uploads: island moving parent + sync          |                         0.1272 ms |                   0.1184 ms |              6.9% less CPU |
| Settled tutorial WebGL buffer uploads                   | 96 calls / 34,276 bytes per frame | 0 calls / 0 bytes per frame |  Idle transfers eliminated |
| Stats highlight timers leaked after 20 remounts         |                                20 |                           0 |            Leak eliminated |

The plain short-path median was below the benchmark's 0.01 ms per-call resolution; its p95 was 0.01 ms, versus 6.45 ms before. Path percentiles are computed from ten-call batch averages, not individual-query tail latency. All measured routes matched the original implementation. Exhaustive failures still explore most of the map: sparse initialization does not solve that separate lag source.

The CPU savings above are independent subsystem improvements; they cannot be added as percentages of total frame time. The matrix traversal control was nearly unchanged when adding selective uploads (0.0696 versus 0.0682 ms), supporting attribution to instance synchronization. Animated or moving instances still upload their changed matrices/colors. Timer cleanup prevents 200 unnecessary interval callbacks per second after the measured twenty leaked Stats mounts.

## Correctness coverage

- 1,200 weighted random path comparisons against the original graph, plus unreachable/closest paths, blocked endpoints, changing doors, world seams, narrow corridors and equal endpoints.
- Renderer checks for instance additions/removals, capacity growth, disposal, colors/darkness, unchanged buffers, parent movement and dirty ranges across updates without drawing.
- Cached transform checks for orientation, aspect ratio, shadow-caster placement and sprite offset changes.
- Stats and equipped Controls mount/unmount checks under React Strict Mode.
- Browser baseline comparisons for tutorial, generated island and menu; movement, health display, fog, pause/resume, resize, snapshot restore, world remount, swimming, water exit, lighting, wrap seams, doors, building entry/exit, spells, particles, death and revival. Desktop 1280×800 and small-screen 390×844, plus resize states. Separate controlled-clock runs compare intermediate animated frames.
- Real production-bundle startup, keyboard input, pause/resume and reload checks; screenshot inspection supplements automated game-state and pixel comparisons.

The browser harness seeds each world and engine tick, controls the spring clock, yields to React between animation frames, and waits for the new world after restore/remount. This avoids comparing unrelated random smoke animation or partially mounted worlds. Canvas pixels are compared directly after rendering, and paused/full-page UI screenshots are also saved.

A generic scene-wide matrix interception approach was tried and rejected because it increased CPU time. The shipped cache is limited to objects whose transforms already flow through React props. New imperative code that mutates one of those static objects must call `updateMatrix()`, as documented beside the helper.

## Verified checks

- `npm run check:fast -- -- --maxWorkers=4`: 181 suites passed; 1,677 tests passed and one existing todo.
- `npm run test:slow -- --maxWorkers=2`: six suites and 36 tests passed.
- `npm run build`: passed.
- Browser comparisons: 350 settled captures and 100 intermediate-animation captures. All 360 optimized captures matched their 90 baseline reference states and rendered PNGs exactly. No page errors occurred.
- Production startup, keyboard input, pause/resume and reload passed at 1280×800 and 390×844; the small-screen production check also used device scale factor 2.
- Manually inspected screenshots: production title/pause at both sizes, small-screen pause controls, island HUD/fog, building interior, swimming, spell flight, death and revival. Sprites, layering, effects and UI remained readable and consistent.
- `git diff --check` and benchmark script syntax checks passed.

Logs and screenshots are under `results/performance/`. These checks cover representative affected behavior, not every possible game state or physical mobile GPU.

## Research

Three.js explicitly supports disabling automatic local recomputation and calling `updateMatrix` after changes: [Matrix transformations](https://threejs.org/manual/pages/matrix-transformations.html). It distinguishes local and world matrix update flags in [Object3D](https://threejs.org/docs/pages/Object3D.html). The upload implementation uses documented [BufferAttribute update ranges](https://threejs.org/docs/pages/BufferAttribute.html) and [InstancedMesh buffer update requirements](https://threejs.org/docs/pages/InstancedMesh.html), checked against the installed Three.js implementation. No speculative GPU rewrite or global prototype override was needed.

## Live gameplay investigation (follow-up)

The follow-up starts at `8301359`, which preserves the four changes above, on top
of local main `1954fd1`. It profiles the actual React game with normal engine,
animation and audio clocks. See [live reproduction instructions](scripts/live-performance/README.md).
The larger scene initializes 24 island regions before triggering the actual worm
encounter, retaining roughly 39,000 ECS entities. This exercises the cost of an
explored world without claiming a multi-hour human play session.

### Candidate 1: background sound synthesis

Main-thread CPU samples identified jsfxr's speculative catalog warming as a
source of competing tasks during gameplay. The production implementation moves
only this warming to a worker, transfers PCM buffers, and terminates the worker
when complete. First-use playback still works immediately; unsupported or failed
workers retain the previous task-by-task fallback. No audio quality setting changes.

Three clean 390px / 4× CPU-throttled menu gameplay runs, with screenshots outside
the measured interval:

| Metric | Before (three runs) | After (three runs) |
| --- | --- | --- |
| Mean frame interval | 18.71 / 18.75 / 18.78 ms | 17.28 / 17.31 / 17.35 ms |
| p95 frame interval | 26.6 / 27.1 / 27.5 ms | 19.5 / 19.5 / 19.3 ms |
| p99 frame interval | 69.2 / 71.2 / 68.0 ms | 28.0 / 26.5 / 26.8 ms |
| Long tasks | 13 / 13 / 13 | 1 / 1 / 2 |

Median p99 improves 61%; mean frame interval improves 7.7%. This is a startup /
catalog-warming benefit, not an assertion that already-cached audio speeds up.
The actual production worker chunk completed 757 results and terminated; audio
playback and pause/resume worked, including with Worker disabled. Desktop and
390px screenshots were inspected. Exact PCM tests cover all four waveforms with
controlled noise; lifecycle tests cover failures and cache races. All 183 fast
suites (1,687 tests), six slow suites (36 tests), type checking, lint and production
build passed before committing this candidate.

### Investigated alternatives

The baseline PoCs in `scripts/live-performance/pocs.cjs` preserve the investigation,
including options that were rejected. Controlled simulation uses three alternating
repetitions and checks the complete ECS-state hash after 600 ticks.

| Candidate | Evidence and decision |
| --- | --- |
| Delay fog bookkeeping allocations | About 3% in the menu; insufficient busy-scene gain, rejected |
| Remove tracing argument spreads | About 2%; rejected |
| Cache cell visibility angles | Slightly slower; rejected |
| Coalesce fog changes by cell | About 25% visibility savings in menu, but busy-world total CPU unchanged; deferred |
| Disable additional world/animated matrix updates | No consistent live frame improvement; rejected |
| Restrict box geometry faces | No convincing live frame improvement; rejected |
| Reuse shadows during relative camera translation | Render submission fell, total frame improvement only about 2%; not accepted |
| Skip healthy entities in final decay cleanup | Accepted after production verification: 30.9% drop-system / 8.2% simulation saving in controlled loaded-world ticks |
| Reuse adjacent-cell entity arrays | Accepted after production verification: 21.0% action-system / 4.5% simulation saving in controlled loaded-world ticks |
| Combine four action predicates into a manual loop | More code, no improvement over simple array reuse; prefer array reuse |

Renderer submission CPU is not GPU execution time. The available Chromium uses
SwiftShader; these runs cannot certify low-end physical-phone GPU performance.
No resolution, shadow, lighting, sprite, palette, health-bar or animation quality
is reduced. No memory-leak claim is made from uncollected heap counters.

### Research used to choose measurements

- [Chrome's Performance panel reference](https://developer.chrome.com/docs/devtools/performance/reference): inspect real interactions, main-thread tasks and rendering rather than inferring cost from visual simplicity.
- [Three.js renderer documentation](https://threejs.org/docs/pages/WebGLRenderer.html): use renderer statistics to distinguish draw work from scene/simulation CPU.
- [Three.js shadows guide](https://threejs.org/manual/pages/shadows.html): shadow maps add rendering passes, especially point lights. Existing shadow caching was investigated before considering quality changes.
- [Three.js matrix transformations](https://threejs.org/manual/pages/matrix-transformations.html): automatic transforms have CPU cost, but further caching must earn a measurable gain beyond existing optimizations.
- [MDN web workers guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers): move independent synthesis off the UI thread and transfer sample buffers instead of cloning them.

The audio-only candidate also improved the CPU-throttled live worm fight in an
ABBA comparison: mean frame intervals 61.02 / 62.99 ms before versus 55.57 /
53.20 ms after (12.3% lower mean across runs). p95 was 116.5 / 129.0 ms before
versus 103.8 / 101.4 ms after. This demanding software-rendered/throttled case
still stutters; it is evidence of improvement, not a 60fps claim.

The [Three.js many-objects guide](https://threejs.org/manual/pages/optimize-lots-of-objects.html)
also informed the draw-call review. Alive already batches opaque glyph instances;
the guide's general batching advice is not an unimplemented fix for this game.

### Candidate 2: skip healthy entities in final decay cleanup

`setupDrop` queried every droppable resource and resolved its structure/death
state before checking whether it had decayed. The final removal pass now rejects
non-decayed entities first. Root lookup and death predicates are read-only; the
same decayed entities reach the existing disposal, evaporation and kill counting.

Against the committed audio-only build, three alternating controlled runs on
38,709 entities retained the identical complete ECS hash `3077288707`:

| Median CPU per tick | Audio-only | With decay guard | Reduction |
| --- | ---: | ---: | ---: |
| Drop system | 0.6448 ms | 0.4458 ms | 30.9% |
| All simulation | 2.4607 ms | 2.2595 ms | 8.2% |

The live loaded-island worm fight, in ABBA order, confirmed drop CPU of
0.776 / 0.776 ms before versus 0.566 / 0.562 ms after (27.3% lower). Total ECS CPU
was 3.586 / 3.605 ms before versus 3.370 / 3.410 ms after (5.7% lower). Mean frame
intervals stayed near 25 ms; this is a significant simulation saving, not a claim
of a comparable total-frame gain. The menu remained effectively unchanged.

Live desktop (1280px) and narrow (390px) checks moved and attacked during the
loaded-world boss encounter, paused/resumed, then drove the boss to zero HP to
exercise the real death sequence. Both removed the boss and recorded exactly one
worm-boss defeat, with no browser errors. Screenshots before and after death were
inspected for body segments, lava/barriers, lighting/shadows, health bars, contextual
READ controls and HUD layout. See `audio-drop-boss-check-*-{alive,dead}.png` and
`audio-drop-boss-check.json` in the local results directory. These are browser-driven
checks with visual inspection, not an exhaustive manual playthrough of every quest.

Before committing the decay candidate, type checking, lint, all 183 fast suites
(1,687 tests), all six slow suites (36 tests), and the production build passed.
Existing feature coverage includes item drops, player death, harvest/destruction,
worm tail decay and boss defeat, and golem limb removal/kill counting.

### Candidate 3: share the adjacent-cell lookup

`setupAction` previously constructed the same cell's entity array four times for
warp, lock, popup and mount selection. It now constructs it once and runs the same
four first-match searches. Popup availability, cell iteration order, first-target
priority and action precedence are unchanged. The array lives only for this cell
visit; no invalidation mechanism or stale persistent cache is introduced.

Against the committed audio-plus-decay build, three alternating controlled runs
retained the complete ECS hash `3077288707` on 38,709 entities:

| Median CPU per tick | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Action system | 0.4635 ms | 0.3660 ms | 21.0% |
| All simulation | 2.2513 ms | 2.1500 ms | 4.5% |

The live loaded-world fight in ABBA order gave action CPU of 0.6127 / 0.6176 ms
before versus 0.5147 / 0.5181 ms after (16.1% lower). Total simulation CPU was
3.3808 / 3.3252 ms before versus 3.2734 / 3.2600 ms after (2.6% lower). Mean frame
intervals were 25.016 / 24.713 ms before versus 24.634 / 24.495 ms after; the small
frame difference is not the acceptance claim. This removes repeated allocations
and CPU from a frequently executed system without altering rendered content.

Independent browser fixtures passed before and after at both 1280px and 390px:
opening a door and advertising the next sign target; giving a sign priority over
a door, opening and closing its popup while the door stays locked; boarding the
correct adjacent boat and steering across water. These complement existing tests
for keys/blocked doors, portals, dialog availability, interaction precedence and
vessel behavior. An attempted immediate sign interaction after opening the adjacent
door did not open on the unchanged baseline fixture; it is not claimed as a passed
manual case. Sign opening is verified separately in the sign-first fixture.

All six settled interaction screenshots (three scenes at two widths) were
byte-for-byte identical PNGs between the before/after builds. The sign popup's
text and layout were also visually inspected after its animation completed.
The combined build passed the live boss-death checks at both widths: one recorded
worm-boss defeat, no remaining boss entity, and no browser errors.

Before committing the action candidate, type checking, lint, all 183 fast suites
(1,687 tests), six slow suites (36 tests), and the production build passed again.

### Commits and combined verification

- `d182048`: background sound synthesis, with PCM and worker lifecycle tests.
- `f8a3dc3`: early decay eligibility check, with independent CPU and live-fight measurements.
- `e7a579f`: shared adjacent-cell lookup, with independent measurements and browser interaction checks.

Each candidate was committed only after its own required checks and measurements.
The final production build also passed the real worker/fallback audio check again.
The workspace remains based on local main `1954fd1`; nothing was pushed or merged.

An extended comparison uses the same current harness against source from `8301359`
and `e7a579f`, with 60 keyboard movement/casting cycles, an iron sword, fire beam,
99 starting mana, the real worm encounter, and 24 initialized island regions.
All runs retain approximately 39,000 entities and end at 79 mana. The encounter,
spell controls, effects, shadows and HUD were visually inspected at both widths.
These are single longer confirmation pairs; the repeated isolated measurements
above remain the evidence for accepting each individual candidate.

| Extended equipped fight | Baseline | Combined implementation |
| --- | ---: | ---: |
| Desktop mean simulation CPU | 3.496 ms | 3.155 ms (9.8% lower) |
| Desktop mean frame interval | 36.528 ms | 35.622 ms (2.5% lower) |
| Desktop p99 frame interval | 55.3 ms | 53.6 ms |
| 390px / 4× CPU mean simulation CPU | 13.186 ms | 12.227 ms (7.3% lower) |
| 390px / 4× CPU mean frame interval | 77.959 ms | 76.646 ms (1.7% lower) |
| 390px / 4× CPU p99 frame interval | 164.0 ms | 162.3 ms |

All four extended runs completed without browser errors. Live timing changes the
number and positions of transient entities, so these real-clock runs are not used
for exact state or pixel comparisons. The controlled 600-tick checks and six
identical interaction screenshots provide those complementary checks.

The strongest frame-tail improvement is during sound-catalog warming. The two
engine changes consistently reduce steady simulation work as explored territory
grows, but do not eliminate the heavy boss fight's full frame cost. This is not a
claim that all lag is fixed or that low-end phones now sustain 60fps. Physical GPU
profiling is still needed to separate remaining GPU, browser and React costs;
software-rendered frame times and renderer submission CPU alone cannot do that.
