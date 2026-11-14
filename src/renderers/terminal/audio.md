# Terminal Audio

`startTerminalAudio` connects the existing synthesized game sounds to one system audio process. On macOS it prefers FFmpeg’s AudioToolbox output when available, then falls back to `ffplay`. Linux can also use `aplay`. The player must be installed on the machine running the terminal game. SSH does not forward audio to the connected client.

`createAudioMixer` combines overlapping samples and scheduled notes into a 44.1 kHz stream. The output follows elapsed time with a 512-frame lead, catching up when game rendering delays a timer callback. The native clock starts after the device reports readiness, with only one silent packet sent during initialization. Sounds requested before readiness are discarded, so startup cannot leave a permanent playback backlog. Writes respect pipe backpressure. FFmpeg and FFplay receive streaming float WAV with packets and pipe reads limited to 1,024 frames; the raw PCM demuxer otherwise groups about 93 ms into each packet at this sample rate.

Playback defaults to mono. `startTerminalAudio(2)` selects stereo; the mixer duplicates mono sources into both channels and preserves interleaved stereo sources. `createSoundBuffer(samples, sampleRate, 2)` accepts the same interleaved format for browser and terminal output. Pause and mute clear queued effects. Closing the client stops the player. Frame capture does not start audio.
