# Audio Context

Owns the shared Web Audio context and master gain used by native sound effects. `ensureAudio` returns the context resume promise when suspended; direct playback controls can await it before calling `play`. Existing game input handlers may continue without awaiting.

`muteAudio` and `unmuteAudio` change the master gain. `suspendAudio` pauses the context. `createSoundBuffer` turns samples into a buffer that can be played at an audio clock time from `getAudioTime`, at a relative volume.
`isPlaying` requires a running context and both output gains enabled, preventing silent worlds from scheduling effects for later.

`setAudioActive` gates output independently of the Sound FX setting. Wiki pages keep it off except for deliberate sound samples; preview frames turn it on while being interacted with and off on blur or pause. Muting the Sound FX setting remains effective across focus changes.

<!-- source-types -->

## SoundBuffer

```ts src/game/sound/resumable.ts
export type SoundBuffer = {
  play: (time: number, volume?: number) => void;
};
```
