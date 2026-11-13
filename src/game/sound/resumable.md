# Audio Context

Owns the shared Web Audio context and master gain used by native sound effects. `ensureAudio` returns the context resume promise when suspended; direct playback controls can await it before calling `play`. Existing game input handlers may continue without awaiting. Safari's `interrupted` state is recovered by suspending and then resuming on the next game interaction, preserving the existing buffers and mute settings.

`muteAudio` and `unmuteAudio` change the master gain. `suspendAudio` pauses the context. `createSoundBuffer` turns samples into a buffer that can be played at an audio clock time from `getAudioTime`, at a relative volume.
`isPlaying` requires a running context and both output gains enabled, preventing silent worlds from scheduling effects for later.

`setAudioActive` gates output independently of the Sound FX setting. Wiki pages keep it off except for deliberate sound samples; preview frames turn it on while being interacted with and off on blur or pause. Muting the Sound FX setting remains effective across focus changes.
Without a browser audio context, sound remains inactive and buffers are silent. Native terminal rendering therefore loads the same game rules without creating browser audio objects.
<!-- source-types -->

## SoundBuffer

```ts src/game/sound/resumable.ts
export type SoundBuffer = {
  play: (time: number, volume?: number) => void;
};
```
