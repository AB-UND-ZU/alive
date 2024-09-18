# Alive

## Creatures

- Player
- Villager (trade)
- Triangle (linear)
- Circle (following)
- Fairy (fleeing)
- Question mark (mimicking)
- Shark (swimming)
- Alphabet boss (towers casting)

## Units

- Chest
- Portal
- Door

## Items

- Heart
- Mana
- Experience
- Gold
- Seed
- Herb
- Sword (wood, iron, gold, fire, ice)
- Shield
- Compass
- Spell (lvl 1 and 2)
- Pickaxe
- Boat
- Bow
- Arrow
- Key

## Spells

- Fire (burning)
- Ice (freezing)
- Shield (attacking)
- Heal (healing)
- Amulet (increase drop chance)
- Bow (elemental, dropping arrow on miss)

## Conditions

- Burning (damage)
- Frozen (rooted)
- Swimming (slowed)
- Diving (oxygen)

## Biomes

- Spawn
- Village
- Boss
- Forest (trees)
- Rocks
- Lakes (islands)
- Desert (cacti)
- Ocean (deep water)
- Ice
- Volcano (lava)

## Worlds

- Green (forest, rocks, lakes, desert)
- Red (rocks, volcano, desert)
- Blue (rocks, lakes, ocean, ice)

## Weather

- Snowing (freezing)
- Raining (darker)

## Terrain

- Air (empty)
- Path
- Rock
- Sand
- Ice (slippery?)
- Water (splash waves, dripping)
- Soil (plant)
- Fence
- Tree
- Cactus (spikes)
- Flower
- Bush
- Fence and door

## Animations

- Damage (number behind target)
- Collect (flow up)

## Tech debt

- Dropped items need a parent chest or mob to be lootable
- Multiple item drops stack, should be placed next to each other
- Door needs empty layers to appear above player
- <Terminal> only rerenders on reference frame changes, but does not listen to displayable entities
- Animations mutate state and don't really animate things, maybe better called Sequences
- Collecting items can disappear if animation is interrupted
