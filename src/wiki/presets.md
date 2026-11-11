# Play Presets

`getPresetLoadout` supplies each scenario table and the world factory with the same level, equipment and carried items. `createPresetWorld` generates the actual Dungeon or Island, equips the hero with game items, and moves it near the selected location. Island settlements use their existing identifiers; bosses use the generated level's cell types. The Bandit preset starts inside the tutorial boss room so its normal encounter sequence runs.

Dungeon starts empty-handed at level 1; Bandit stays level 1 with a wood sword, ten wood health potions and fruit. Island and Earth Town start at level 2. Earth adds an axe and compass; Ilex adds a wood wave. Oak keeps its level 4 quest equipment. Fire Haven and Nomad use level 5 equipment, with an iron earth dash/bow/boots at Haven and an iron earth wave/slash/map at Nomad. Worm uses level 6, a gold sword, iron earth beam, iron bubble, twenty charges and iron potions. Scenario tables read the exact quantities from the same loadout factory as the game preview. Stats and full starting health/mana come from native class leveling.

The Worm Boss preset starts beside the one-health bait worm in the generated cave. Attacking the bait starts the ordinary encounter sequence.

Every preset starts a new world with wiki seed 2026, temporarily scoping the native random source during generation. The Island preview and static Island/town references share that seed. Menu uses the ordinary game menu. Play allows persistence for these generated worlds; feature snippets remain isolated from saved games.

The generation tests verify each Island preset has a playable hero and valid start position, and that defeating the Worm Boss bait starts its encounter.
<!-- source-types -->

## PresetName

```ts src/wiki/presets.ts
export type PresetName = keyof typeof presets;
```
