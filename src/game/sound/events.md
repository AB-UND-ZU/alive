# Authoritative sound events

`captureSounds` intercepts native `play` calls before synthesis. `withSoundSource` scopes sequence audio to its emitting entity, position or private UI owner. Both restore the previous scope in `finally`; they do not retain a world or run asynchronously. Ordinary single-player audio still follows the native synthesis and audio activity gate.

The host keeps at most 512 recent events per level and sends only the last second. Event IDs increase across all host worlds. Browser replicas play each fresh audible event once, filter private owners, attenuate from the local player's position and discard history after reconnect or pause. Sounds never advance gameplay or replay missed sequence callbacks.
<!-- source-types -->

## SoundSource

```ts src/game/sound/events.ts
export type SoundSource = {
  owner?: number;
  entity?: number;
  position?: Position;
};
```

## SoundEvent

```ts src/game/sound/events.ts
export type SoundEvent = {
  preset: SoundPreset;
  options: SfxOptions<SoundPreset>;
  source?: SoundSource;
};
```
