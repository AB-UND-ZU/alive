# Audio Context

Owns the shared Web Audio context and master gain used by native sound effects. `ensureAudio` returns the context resume promise when suspended; direct playback controls can await it before calling `play`. Existing game input handlers may continue without awaiting. Safari's `interrupted` state is recovered by suspending and then resuming on the next game interaction, preserving the existing buffers and mute settings.

`muteAudio` and `unmuteAudio` change the master gain. `suspendAudio` pauses the context. `createSoundBuffer` turns samples into a buffer that can be played at an audio clock time from `getAudioTime`, at a relative volume. Samples default to mono; passing two channels accepts interleaved left/right samples. Channel data is copied into the Web Audio buffer before scheduling.
`isPlaying` requires a running context with both activity and mute gates enabled. Silent worlds do not schedule effects for later.

`setAudioActive` gates output independently of the Sound FX setting. Wiki pages keep it off except for deliberate sound samples; preview frames turn it on while being interacted with and off on blur or pause. Muting the Sound FX setting remains effective across focus changes.
`setAudioContext` installs a native Web Audio context for the terminal client. Browser and terminal sounds share the same buffers, scheduling and gain nodes. Replacing or removing a context disconnects its gain chain; buffers created for that context no longer play. Mute and activity settings survive replacement.
<!-- source-types -->

## AudioChannels

```ts src/game/sound/resumable.ts
export type AudioChannels = 1 | 2;
```

## SoundBuffer

```ts src/game/sound/resumable.ts
export type SoundBuffer = {
  play: (time: number, volume?: number) => void;
};
```
