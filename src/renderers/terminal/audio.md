# Terminal Audio

`startTerminalAudio` connects the existing synthesized game sounds to one `ffplay` or `aplay` process. The player must be installed on the machine running the terminal game. SSH does not forward audio to the connected client.

`createAudioMixer` combines overlapping samples and scheduled notes into a mono 44.1 kHz stream. Pause and mute clear queued effects. Closing the client stops the player. Frame capture does not start audio.
