# Sound

Synthesizes sound effects from named presets. `play` does nothing until the game's sound state permits playback.

| Export        | Contract                                              |
| ------------- | ----------------------------------------------------- |
| npcVariants   | Sound variants associated with NPC types              |
| pickupOptions | Per-pickup variant and intensity defaults             |
| soundPresets  | Native game preset names derived from their methods |
| play          | Generate the selected preset and play its note buffer |

| Option    | Meaning                                      |
| --------- | -------------------------------------------- |
| delay     | Delay before playback, in milliseconds       |
| intensity | Preset-specific strength                     |
| proximity | Preset-specific distance/volume factor       |
| variant   | Preset variation                             |
| notes     | Number of notes to synthesize                |
| spacing   | Milliseconds between notes                   |
| pattern   | True entries play; false entries leave rests |

Notes are mixed into one buffer so their relative timing survives delayed frames. With multiple notes, the note index selects each variant. Use the existing preset and options rather than encoding new audio in a UI component.

Synthesizing takes several frames on phones, and rain or nearby fires request several sounds per second. Single sounds are therefore synthesized as up to 4 random variants per preset and options except `proximity`, then a random variant is replayed. `proximity` only sets the volume, so a replay applies it through its gain node with the same loudness as a new synthesis. At most 32 variants are kept, dropping the least recently played sounds first. Melodies with `notes` or `pattern` are synthesized on every call.
<!-- source-types -->

## SfxOptions

```ts src/game/sound/index.ts
export type SfxOptions = {
  delay?: number;
  intensity?: number;
  proximity?: number;
  variant?: number;
  notes?: number;
  spacing?: number;
  pattern?: boolean[];
};
```
