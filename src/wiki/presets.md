# Play Presets

`createPresetWorld` generates the actual Dungeon or Island, equips the hero with game items, and moves it near the selected location. Island settlements use their existing identifiers; bosses use the generated level's cell types. The Bandit preset starts inside the tutorial boss room so its normal encounter sequence runs.

Dungeon starts empty-handed at level 1. Island starts at level 2 with a wood sword, ten wood health potions, one iron, five coins and fruit. Oak uses level 4 quest equipment: an iron sword, wood beam, wood slash with ten charges, compass, axe, twenty wood health potions and ten wood mana potions. Worm uses level 6 equipment: gold sword, iron earth wave, iron bubble, iron boots, compass, pickaxe, fishing rod, ten worms, twenty charges, twenty iron health potions and ten iron mana potions. Stats and full starting health/mana come from native class leveling.

The Worm Boss preset starts beside the one-health bait worm in the generated cave. Attacking the bait starts the ordinary encounter sequence.

Every preset starts a new world with wiki seed 2026, temporarily scoping the native random source during generation. The Island preview and static Island/town references share that seed. Menu uses the ordinary game menu. Play allows persistence for these generated worlds; feature snippets remain isolated from saved games.

The generation tests verify each Island preset has a playable hero and valid start position, and that defeating the Worm Boss bait starts its encounter.
<!-- source-types -->

## PresetName

```ts src/wiki/presets.ts
export type PresetName = keyof typeof presets;
```
