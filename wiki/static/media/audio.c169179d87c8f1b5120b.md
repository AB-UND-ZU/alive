# Terminal Audio

`startTerminalAudio` installs a native Web Audio context from `node-web-audio-api`. Terminal sounds use the same cached buffers, volume gates and audio-clock scheduling as the browser. The native audio thread plays scheduled samples independently of game rendering.

The context uses the interactive latency hint and supports mono and stereo buffers. Closing the client releases the device. Frame capture does not open audio. A missing device is reported before the terminal screen opens; the game can continue without sound.

No FFmpeg, FFplay or ALSA command is required. SSH does not forward audio to the connected client.
