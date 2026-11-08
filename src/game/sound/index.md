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
