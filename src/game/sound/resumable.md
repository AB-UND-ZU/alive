# Audio Context

Owns the shared Web Audio context and master gain used by native sound effects. `ensureAudio` returns the context resume promise when suspended; direct playback controls can await it before calling `play`. Existing game input handlers may continue without awaiting.

`muteAudio` and `unmuteAudio` change the master gain. `suspendAudio` pauses the context. The resumable effect buffer schedules notes on the audio clock.
