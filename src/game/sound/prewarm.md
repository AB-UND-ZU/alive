# Background sound synthesis

The finite preset catalog is synthesized one entry at a time in a worker. Each result transfers its Float32 sample buffer to the main thread, where the existing AudioContext creates the playable buffer. Sample rate, oversampling, waveform generation, gain, and silent-tail trimming are unchanged.

Playback never waits for this worker. A missing sound is synthesized synchronously and cached immediately. If that happens while the worker is preparing the same sound, the existing cache entry wins. This preserves the waveform chosen for subsequent notes.

The worker terminates when the catalog is complete. If workers are unavailable, blocked, fail to load, cannot clone a request, or fail to deliver a result, warming resumes on the main thread one task at a time, including the failed in-flight entry. Playback remains available throughout.

Tests compare all stored PCM samples with the original synthesis/trim path for each waveform and cover cache races, completion, unsupported workers, construction failure, worker errors and message failure. Noise uses the synthesizer's existing random noise distribution; the waveform tests reset its random source to compare identical input noise.
