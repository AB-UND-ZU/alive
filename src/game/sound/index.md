# Sound

Synthesizes sound effects from named presets. `play` does nothing until the game's sound state permits playback.

| Export        | Contract                                            |
| ------------- | --------------------------------------------------- |
| npcVariants   | Sound variants associated with NPC types            |
| pickupOptions | Per-pickup variant and intensity defaults           |
| soundPresets  | Native game preset names derived from their methods |
| SoundPreset   | Name of a native game preset                        |
| play          | Play the selected preset, synthesizing it if needed |

| Option    | Meaning                                      |
| --------- | -------------------------------------------- |
| delay     | Delay before playback, in milliseconds       |
| intensity | Preset-specific strength                     |
| proximity | Preset-specific distance/volume factor       |
| variant   | Preset variation, typed per preset           |
| seed      | One of 4 random characters, picked if absent |
| notes     | Number of notes to synthesize                |
| spacing   | Milliseconds between notes                   |
| pattern   | True entries play; false entries leave rests |

With multiple notes, the note index selects each variant. Every note is scheduled on the audio clock, so melodies keep their timing when frames lag. Use the existing preset and options rather than encoding new audio in a UI component.

Synthesizing a long sound takes several frames on phones. The first `play` therefore starts synthesizing every listed variant with each seed in the background, one sound per task. `variant` only accepts the values listed for its preset, so new values need to be added to that list. A sound that is not ready yet, such as one with a new `intensity`, is synthesized when played and kept.

Sounds are cached by their synthesis parameters except volume. `proximity` and options that do not change a preset share one buffer, and a replay sets the requested volume through its gain node. Buffers use 22,050 samples per second and leave out their silent tail, about 4 MB for all listed sounds.

<!-- source-types -->

## Seed

```ts src/game/sound/index.ts
type Seed = (typeof seeds)[number];
```

## SoundOptions

```ts src/game/sound/index.ts
type SoundOptions = {
  delay?: number;
  intensity?: number;
  proximity?: number;
  variant?: number;
  seed?: number;
  notes?: number;
  spacing?: number;
  pattern?: boolean[];
};
```

## SfxOptions

```ts src/game/sound/index.ts
export type SfxOptions<P extends SoundPreset> = SoundOptions & {
  variant?: SoundVariant<P>;
  seed?: Seed;
};
```

## SoundPreset

```ts src/game/sound/index.ts
export type SoundPreset = Exclude<keyof Presets, keyof Params>;
```

## SoundVariant

```ts src/game/sound/index.ts
type SoundVariant<P extends SoundPreset> = (typeof soundVariants)[P][number];
```
