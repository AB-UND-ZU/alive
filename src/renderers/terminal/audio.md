# Terminal Audio

`startTerminalAudio` connects the existing synthesized game sounds to one `ffplay` or `aplay` process. The player must be installed on the machine running the terminal game. SSH does not forward audio to the connected client.

`createAudioMixer` combines overlapping samples and scheduled notes into a 44.1 kHz stream. The output follows elapsed time with a 2,048-frame lead, catching up when game rendering delays a timer callback. Writes respect pipe backpressure.

Playback defaults to mono. `startTerminalAudio(2)` selects stereo; the mixer duplicates mono sources into both channels and preserves interleaved stereo sources. `createSoundBuffer(samples, sampleRate, 2)` accepts the same interleaved format for browser and terminal output. Pause and mute clear queued effects. Closing the client stops the player. Frame capture does not start audio.
