# Sound loading

The menu waits for the finite sound catalog to finish loading. The catalog includes every listed preset variant and all four seeds, with duplicate synthesis parameters removed. Startup supplies class movement intervals and the popup opening duration from the existing game data, so footsteps and opening a menu do not require synthesis on their first use. One worker generates the catalog in a single batch and transfers its sample buffers back to the main thread for Web Audio playback. The worker terminates before loading completes.

Unsupported, blocked or failed workers fall back to the same synthesis on the main thread while the loading screen is visible. The catalog promise is shared across callers, so returning to the menu reuses the loaded buffers. Playback does not start background synthesis.

Sounds use the original 44,100 Hz sample rate and oversampling, retaining the high-frequency detail lost at 22,050 Hz. Waveform generation, gain and silent-tail trimming are unchanged. Sounds with additional synthesis parameters outside the catalog are cached on first use.
