# Spatial playback

A world sound starts at its emitting tile. The listener is the hero, or the ghost after death. Distance uses the shortest wrapped displacement and the map’s cell aspect ratio. Adjacent interactions play at their usual volume. Volume falls gently within the listener’s current vision radius and more steeply beyond it. The orb’s beam carries farther than footsteps or crackling fire. All world sounds fade to silence over the last two units of the ten-unit hearing range. Horizontal displacement controls the stereo pan.

When the hero moves, active world sounds fade to their new gain and pan over the movement interval. Web Audio performs the linear ramps. Each note leaves the active set when it ends. UI sounds bypass this set and play at their normal volume.
<!-- source-types -->

## SoundSource

```ts src/game/sound/spatial.ts
export type SoundSource = NonNullable<ReturnType<typeof getSoundSource>>;
```
