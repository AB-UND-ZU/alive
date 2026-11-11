# Worker sound cache implementation plan

Status: plan only. Persistent sound caching is not implemented by this branch.
Keep this document and any future cache implementation out of main until a separately verified change is requested.

## Goal and current behavior

Reuse generated sounds across page loads without changing sound quality or delaying gameplay after the menu appears. Preserve the existing “Loading game...” phase before menu generation.

Current code:

- `src/game/sound/index.ts`: `loadSounds` deduplicates synthesis parameters and builds reusable AudioBuffers. Its memoized promise only lasts for the current page load. Volume-only differences share samples; gain remains part of playback behavior.
- `src/game/sound/loading.ts`: starts one dedicated worker for the batch, receives samples, and terminates the worker in `finally`. Worker failures fall back to synthesis during loading on the main thread.
- `src/game/sound/synthesis.worker.ts`: synthesizes all requested parameters and transfers the resulting Float32Array buffers back in one message.
- `src/game/sound/synthesis.ts`: preserves jsfxr synthesis and trims quiet trailing samples.
- `src/components/World/index.tsx`: waits for sound loading before creating the menu, including movement and popup duration overrides.

The measured startup catalog contained 785 unique sounds and 9,718,694 mono frames at 44,100 Hz: 38,874,776 bytes of Float32 PCM, about 39 MB before metadata and IndexedDB overhead. Catalog size may change with game data. Earlier worker generation took roughly 1.4 seconds on the measurement machine; repeat this baseline on the target devices before choosing an implementation. Disk reads and AudioBuffer creation still have a cost. A cache speedup has not been measured yet.

## Proposed implementation

1. Add a small worker-side IndexedDB helper beside the sound sources. Use a separate database, such as `alive-sounds`, rather than changing the game-save database or schema. Both databases still share the origin's storage quota. Do not request persistent storage or user permission as part of startup.
2. Build a stable catalog fingerprint from the complete ordered batch of effective synthesis parameters and an explicit synthesis/cache-format revision. Include sample rate and all supplied movement/popup overrides. Bump the revision when jsfxr, generator behavior, trimming, or serialization changes. Do not invalidate on unrelated application releases, and do not key only by sound name.
3. Store one active catalog record containing its fingerprint, format revision, sample metadata and Float32Array samples. Keep only one catalog on disk; replace the old record atomically after a successful regeneration. A single batch record is the initial simple design; measure its cloning and peak-memory cost before accepting it.
4. On a hit, validate fingerprint, format, number and ordering of sounds, typed-array type, finite samples and recorded lengths. Return the original samples through the existing transferable batch message. Build AudioBuffers and apply gains through the existing main-thread code.
5. On a miss or invalid record, generate the existing batch, attempt to store it, and return it through the same message. Wait for the write transaction's `complete` event before transferring buffers and reporting success. A request's `success` event alone does not mean the transaction committed. Transferring detaches the worker buffers, and the parent immediately terminates the worker when it receives the result; a write scheduled after that result is unsafe.
6. Treat storage as optional. Unavailable IndexedDB, denied access, quota exhaustion, aborted transactions, eviction, invalid records and blocked upgrades must recover by generating sounds. Cache failure must not reject otherwise successful synthesis or strand the loading screen. Close connections on version changes. Add a bounded wait for cache operations, close or abort timed-out work, then continue without caching.
7. Keep synthesis outside open IndexedDB transactions. Concurrent tabs may independently generate the same catalog; identical writes are harmless. Do not hold locks across generation or introduce a tab coordinator without evidence that it is needed.
8. Keep worker-disabled/error/message-error fallbacks and the current public `loadSounds` contract. The worker protocol should remain one batch request and one batch result unless measurements justify a change.

Awaiting a cache write increases first-launch time. Measure that explicitly. If it is materially worse, investigate a worker-owned lifetime that can return samples and finish storing safely before closing. This would require a separate lifecycle design and tests; do not leave a background write relying on the current immediate parent termination.

No Service Worker, downloaded sound bank, codec, resampling, lower bit depth, changed gains, new variants, or generation during active gameplay is required. Preserve 44,100 Hz, existing oversampling, Float32 samples, quiet-tail trimming and playback scheduling.

## Correctness and failure verification

Add maintained feature tests only when implementing the cache:

- Cold miss generates and writes a usable catalog; a later page load reads it without calling synthesis.
- Compare cached samples byte for byte with the samples that were originally stored, including every waveform and a high-frequency fixture. Noise generation can be random; comparing two independent synthesis runs is not a valid equality test.
- Parameter, sample-rate, catalog-order and synthesis-revision changes invalidate the record. Malformed metadata, missing/truncated/wrong-typed samples, and non-finite samples regenerate safely.
- Access denial, absent IndexedDB, quota errors, transaction aborts, blocked upgrades, operation timeouts and eviction all finish loading through the existing generation path.
- Worker completion occurs only after storage commits or fails. Transferred buffers are intact, and all worker paths terminate. Existing worker creation, execution and message failure tests continue to pass.
- Repeated `loadSounds` calls still share one promise. React StrictMode, unmount/replacement during loading, and injected wiki worlds keep their current behavior.
- Real browser reloads and browser restarts reuse persisted samples. Two simultaneous tabs and a catalog revision change do not deadlock. Save-game loading and writing remain unaffected.

Manually check desktop and small-screen startup, denied-storage startup, worker-disabled startup, class selection, menu movement, popup open/close, pause/resume, combat, and wiki sound previews. Confirm the loading text remains visible, audio starts after the expected gesture, and common menu interactions create no new synthesized buffers. Inspect before/after screenshots and listen for high-frequency changes.

## Measurement and acceptance gate

Keep benchmark scripts, browser profiles, screenshots and raw results under `/tmp`, outside the worktree. Do not commit them or generated sound banks.

Measure these phases separately: worker startup, cache open/read/validation, synthesis, cache write/commit, transfer, main-thread AudioBuffer creation, and total time until the menu is ready. Record main-thread long tasks, peak memory and retained memory as well as IndexedDB size.

Compare the unchanged production baseline with a cache PoC in at least ten alternating runs per condition: first launch with empty storage, warm reload with only the sound record retained, browser restart, invalidated catalog, and denied storage. Keep HTTP cache, game saves, scene seed and browser settings equivalent. Run on desktop, mobile-sized screens with CPU throttling, and a real low-end mobile device when available. Report simulated versus real hardware honestly; avoid concurrent host-heavy work when collecting timings.

Proceed only if warm sound-loading time improves consistently, with a target of at least 30% median improvement, improved total menu readiness, and no meaningful p95 regression. Quantify cold-write overhead before accepting it; a target is no more than 10% added total startup time. Report p95 plus worst observed long tasks and run counts rather than claiming a reliable p99 from ten samples. Retained RAM must return near baseline after loading; account for transient storage clones and AudioBuffer copies. Keep disk usage bounded to one catalog, allowing temporary replacement overhead.

If read/validation/cloning costs erase the benefit or cold startup regresses beyond these gates, keep the PoC outside main and reassess record layout or worker lifetime. Do not ship complexity just because the cache works functionally.

After a successful PoC, implement on an isolated feature branch, add regression tests, run `npm run check:fast`, `npm run test:slow`, and `npm run build`; run wiki build/tests if shared audio behavior or documentation changes. Repeat the complex gameplay and startup measurements on the final production code. Integrate only in a separate authorized change after these results pass review.

## Browser API references

- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API): asynchronous structured storage available in workers.
- [Structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm): typed-array and ArrayBuffer storage support.
- [IDBTransaction complete event](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/complete_event): transaction completion for the cache write.
- [Worker.terminate](https://developer.mozilla.org/en-US/docs/Web/API/Worker/terminate): termination immediately stops the worker without allowing outstanding operations to finish.
