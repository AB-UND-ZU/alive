# Performance implementation and verification

Workspace: `alive-worktree-6`, branch `perf/alive-6`. Rebased onto local main `1954fd1` (the fetched remote main was older). The four changes are enabled in normal production code, with no experimental runtime flags.

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
