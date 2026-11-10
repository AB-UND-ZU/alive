# Audio Context

Owns the shared Web Audio context and master gain used by native sound effects. `ensureAudio` returns the context resume promise when suspended; direct playback controls can await it before calling `play`. Existing game input handlers may continue without awaiting.

`muteAudio` and `unmuteAudio` change the master gain. `suspendAudio` pauses the context. `createSoundBuffer` turns samples into a buffer that can be played at an audio clock time from `getAudioTime`, at a relative volume.
<!-- source-types -->

## SoundBuffer

```ts src/game/sound/resumable.ts
export type SoundBuffer = {
  play: (time: number, volume?: number) => void;
};
```
