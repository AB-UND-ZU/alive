# Play Presets

`createPresetWorld` generates the actual Dungeon or Island, equips the hero with game items, and moves it near the selected location. Island settlements use their existing identifiers; bosses use the generated level's cell types. The Bandit preset starts inside the tutorial boss room so its normal encounter sequence runs.

The Worm Boss preset starts beside the one-health bait worm in the generated cave. It equips a gold sword, slash, fire beam and pickaxe, plus the shared healing supplies. Attacking the bait starts the ordinary encounter sequence.

Every preset starts a new world with wiki seed 2026, temporarily scoping the native random source during generation. The Island preview and static Island/town references share that seed. Menu uses the ordinary game menu. Play allows persistence for these generated worlds; feature snippets remain isolated from saved games.

The generation tests verify each Island preset has a playable hero and valid start position, and that defeating the Worm Boss bait starts its encounter.
<!-- source-types -->

## PresetName

```ts src/wiki/presets.ts
export type PresetName = keyof typeof presets;
```
