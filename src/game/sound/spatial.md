# Spatial playback

A world sound follows its emitting entity. The listener is the hero, or the ghost after death. Distance uses the shortest wrapped displacement and the map’s cell aspect ratio. Adjacent interactions play at their usual volume. Volume falls gently within the listener’s current vision radius and more steeply beyond it. The orb’s beam carries farther than footsteps or crackling fire. All world sounds fade to silence over the last two units of the ten-unit hearing range. Horizontal displacement controls the stereo pan. Distant casts produce no audio nodes. Entering earshot during a beam starts the remaining audio at its elapsed time.

Listener and emitter movement fade active voices to their new gain and pan over the movement interval. Emitters in the same building share a filter. When the listener enters a building, sounds from outside that room become muffled. Web Audio performs the linear ramps. Each note leaves the active set when it ends. UI sounds bypass this set and play at their normal volume. The hero’s actions keep their requested timing. Level, fountain and totem tones retain their pitch. Other cues vary by up to 15 cents in five-cent steps. Other world sounds receive a small random delay.
<!-- source-types -->

## SoundSource

```ts src/game/sound/spatial.ts
export type SoundSource = NonNullable<ReturnType<typeof getSoundSource>>;
```
