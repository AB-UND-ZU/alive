# Sound loading

The menu waits for the finite sound catalog to finish loading. The catalog includes every listed preset variant and all four seeds, with duplicate synthesis parameters removed. Startup supplies class movement intervals and the popup opening duration from the existing game data, so footsteps and opening a menu do not require synthesis on their first use. One dedicated worker loads the catalog and transfers its sample buffers back to the main thread for Web Audio playback. The worker terminates before loading completes.

On a secure origin, the worker stores the generated catalog in one Cache Storage entry. A table of sample counts precedes the original 32-bit floating-point samples. The worker checks a fingerprint of the ordered synthesis parameters and the catalog revision before reusing the entry. Bump the revision in `catalog.ts` when changing the synthesis algorithm, jsfxr version or binary format. A missing or unreadable entry is regenerated. If the browser denies storage, the generated samples still reach playback.

Unsupported, blocked or failed workers fall back to the same synthesis on the main thread while the loading screen is visible. The catalog promise is shared across callers, so returning to the menu reuses the loaded buffers. Playback does not start background synthesis.

Sounds use the original 44,100 Hz sample rate and oversampling, retaining the high-frequency detail lost at 22,050 Hz. Waveform generation, gain and silent-tail trimming are unchanged. Sounds with additional synthesis parameters outside the catalog are cached on first use.

`createWorker.ts` is a browser bootstrap: Webpack resolves its `import.meta.url` when bundling the worker. Jest mocks this adapter, and its CommonJS coverage instrumentation cannot parse that module URL syntax, so the adapter is explicitly excluded from Istanbul coverage. `loading.test.ts` covers worker messages, termination, failure and fallback; the sound-worker browser test covers construction and sample transfer with the real bundled worker.

Jest gameplay tests inspect `playedSounds`. Playback and loading tests use one-sample buffers. Catalog tests use small, known samples to check cache hits, invalidation and storage failures. Waveform tests opt into jsfxr. Playwright test builds record cues in `window.soundStub.played` in each frame. Only the sound-worker test enables `loadCatalog` to exercise the real worker and browser storage.
