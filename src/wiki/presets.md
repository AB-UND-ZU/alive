# Play Presets

`createPresetWorld` generates the actual Dungeon or Island, equips the hero with game items, and moves it near the selected location. Island settlements use their existing identifiers; bosses use the generated level's cell types. The Bandit preset starts inside the tutorial boss room so its normal encounter sequence runs.

Every preset starts a new world. Menu uses the ordinary game menu. Play allows persistence for these generated worlds; feature snippets remain isolated from saved games.

The slow tests generate each Island preset and verify that it has a playable hero and valid start position.
<!-- source-types -->

## PresetName

```ts src/wiki/presets.ts
export type PresetName = keyof typeof presets;
```
