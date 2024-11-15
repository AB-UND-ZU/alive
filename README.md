# Alive

ASCII-based 2D adventure game. Using React and Three.js (with react-three-fiber).

Only the 256 characters in code page 437 from the "DOS Font" are used (available here: https://laemeur.sdf.org/fonts/), along with original 16 terminal colors. To create all sprites, characters are stacked over each other (with the only exception of health bars, they are underscores `_` transformed to the appropriate length).


## Demo

Play it here: https://ab-und-zu.github.io/alive

![Spawn](docs/spawn.png)

_Spawn area with intro quest_

## Game modes

- Adventure: Single player
- City: Trade with other players, enter worlds, build house
- Casual: Multi player with global level advance
- Free for all: battle royale with global level advance (winner keeps items, special item for first death)
- Groups: PvE raids epic dungeons
- Tribes: PvP protect the chief and fortify village

## Classes

- (base: 10/5)
- Scout: max 50/30 + base 20/10 (can't join tribe, doesn't require account)
- Knight (helmet): max 60/20 + 1 defense + wood armor + HP drop on decay
- Mage (curls): max 40/40 + 1 intellect + wave spell + mana + MP drop on decay
- Rogue (mohawk): max 50/30 + 1 attack + wood bow + arrow stack + movement speed

## Creatures

- Player
- Ghost
- Prism: linear, high damage
- Eye: sleeping, simple approaching, low hp
- Blob: slow walking, casting short wave after intervals
- Blade: charging until hit when in line
- Orb: aligning with player, casting bolt, fleeing
- Fly: pass through terrain, explode as attack
- Tower: casting wave in intervals
- Fake (chest, pot, tree, cactus, palm, ore): enrage when adjacent, drop stack
- Fairy: fleeing, teleporting, only hittable with ranged attacks
- Number: Duplicating
- Question mark: mimicking
- Shark: swimming

## Villagers

- Baker: Trade berries and flowers
- Guard: At entry of town, dungeon or boss room
- Smith: Sell swords, bows and armors
- Rogue: Melee and bow spells
- Mage: Casting spells
- Elder: Gives gold key to finish level
- Scout: Fairy quest
- Druid: consumables
- Chief: Max stats
- Nomad: Intro quest, sell key
- Miner/Logger/Fisher: sell pickaxe

## Bosses

- Alphabet (different elements)
- Infinite waves arena (revive, loot as much as you can)
- Chief (drops an elemental key to the void)
- Nomad
- Thief (unequip and steal)
- Labyrinth
- Question mark (mimick)
- (large creature multiple tiles)
- Pushing puzzle
- Lever puzzle

## Units

- Chest (drops items and consumables)
- Pot (drops stats)
- Door (locks, toggles building view)
- Portal (teleports to next level or dungeon)
- Cactus (does damage, drops spikes)

## Tribes

- Joining a tribe grants extra stats and makes the other hostile and lootable
- Provides utility tool
- Own tribe unlocks quest for elemental armor (immunity)
- Each tribe has a chief that drops an elemental key, either through quest or killing

No tribe (neutral)
- Hair: white
- House: wood beams, stone walls, red roof
- World: Hills

Fire
- Hair: red
- Stat: Max HP + 10
- Tool: Pickaxe
- Entry: wooden gate guard
- Town: houses, cacti, water streams
- House: grass beams, green dotted walls
- Soil: brown for berries
- Utility: burn trees
- Chief: full burn towers
- World: Desert
- Dungeon: Volcano

Water
- Hair: blue
- Stat: Max MP + 10
- Tool: Boat
- Entry: fisherman with boat
- Town: ice islands, igloo, bridges
- House: teal beams, ice walls
- Soil: aqua for flowers
- Utility: freeze water
- Chief: full freeze towers
- World: Ocean
- Dungeon: Glacier

Earth
- Hair: green
- Stat: Max inventory + 4
- Tool: Axe
- Entry: cave guard
- Town: caves, sand, fires
- House: cave walls, rock doors
- Soil: yellow for cacti
- Utility: heal HP
- Chief: full heal towers
- World: Jungle
- Dungeon: Cave

## Actions

- Door unlock (key)
- Quest accept (!)
- Shop buy ($)
- Player spawn (ghost)
- Boat swim (boat)
- Wood chop (axe)
- Rock mine (pickaxe)
- Bow shoot (arrow)
- Bomb throw (bomb)
- Spell cast (mana)

## Elements

- Wood: from sticks
- Iron: from ores
- Gold: from mining or elites

- Diamond: high damage / high defense
- Fire: burns on impact / burn immunity
- Water: freezes on impact / freeze immunity
- Earth: lifesteal / x2 life collection

- Ruby: turn world pink on move or impact, speed up in pink area / extra armor + dmg while in pink
- Aether: turn entities grayscale on impact, added damage / spike
- Void: delete any sprites on impact / create black hole on hit
- Rainbow: random elemental effect with coloring / elemental trail

## Tiers

T1: common (maroon)
- Wood (Sword, Armor, Bow) - collecting

T2: uncommon (lime)
- Iron (Sword, Armor, Bow) - mining

T3: rare (yellow)
- Gold (Sword, Armor, Bow) - trading

T4: epic (aqua)
- Diamond (Sword, Armor, Bow) - mining / crafting
- Fire (Sword, Armor, Bow) - farming / crafting
- Water (Sword, Armor, Bow) - farming / crafting
- Earth (Sword, Armor, Bow) - farming / crafting

T5: legendary (fuchsia)
- Ruby (Sword, Armor, Bow) - mining / crafting
- Aether (Sword, Armor, Bow) - drops from dungeon bosses and chiefs
- Void (Sword, Armor, Bow) - shards from crafting, fighting, quests
- Rainbow (Sword, Armor, Bow) - farming / crafting

## Items

- Heart
- Mana
- Experience
- Coin
- Wood
- Ore
- Berry
- Flower

## Equipment

- Sword: high damage
- Armor: reduce damage, burn/freeze immunity or life multiplier
- Bow: high damage, slow projectile speed but scaling with movement speed

## Equipment spells

- Slash lvl 1: spin sword around with damage multiplier (5 xp)
- Slash lvl 2: increase range, damage multiplier + on-hit proc (25 xp)
- Volley lvl 1: 3 arrow wave (10 xp)
- Volley lvl 2: 5 arrow wave + range + on-hit proc (25 xp)
- Shield lvl 1: invincible (10 xp)
- Shield lvl 2: more duration + attack radius + on-hit proc + speed boost (25 xp)

## Elemental spells

- Wave: circular (10 gold + 10 xp)
- Wave lvl 1: elemental (wave + 1 essence)
- Wave lvl 2: added range + return (wave lvl 1 + 5 essence)
- Bolt: fast projectile + pass terrain + pierce enemies
- Bolt lvl 1: elemental
- Bolt lvl 2: range + split four directions 
- Trap: single damage
- Trap lvl 1: elemental
- Trap lvl 2: 4x size + wave damage + cooldown

## Item spells

- Cloak lvl 1: invisible but stunned on taking damage
- Cloak lvl 2: speed boost + walk through terrain

## Consumable spells

- Bomb: explode + pushable
- Elemental bomb: explode + pushable
- Arrow: drop on miss or decay

## Amulets

- Fire amulet lvl 1: +1 dmg
- Fire amulet lvl 2: +3 dmg
- Water amulet lvl 1: +1 intellect
- Water amulet lvl 2: +3 intellect
- Earth amulet lvl 1: +1 defense
- Earth amulet lvl 2: +3 defense
- Golden amulet lvl 1: unusable passive + increased drop chance
- Golden amulet lvl 2: unusable active + guaranteed T5 drop on bosses

## Tools

- Haste: increase move and attack speed
- Magnet: automatically collect items
- Torch: increase vision radius
- Compass: point to target
- Map: minimap on pause
- Axe: chop trees
- Pickaxe: mine minerals
- Revive: prevent death (99 gold)
- Boat: swim on water
- Key: open doors

## Automatic consumables

- Extra life (max 1)
- Max HP
- Max MP
- HP flask
- MP flask
- (max 3 flasks total)

## Passive

- Charm: circle around hero
- Charm lvl 1: elemental
- Charm lvl 2: increase radius and size
- Pet: attack close enemies, heal by using hp, revive with mana
- Pet lvl 1: elemental on hit
- Pet lvl 2: casting short ranged spell + more hp and dmg

## Conditions

- Burning (damage)
- Frozen (stunned)
- Swimming (slowed)
- Diving (oxygen)

## Biomes

- Intro (walk, collect, attack, talk, use)
- Boss room
- Village
- Water town
- Forest (trees)
- Rocks
- Lakes (islands)
- Desert (cacti)
- Volcano (lava)
- Ocean (deep water)
- Underwater world (oxygen breathe)
- Ice

## Portals

- Maroon: "Hills" world
- Grey: "City" world

- Red: "Desert" world (mist) - desert (neutral), volcano (red tribe), oasis
- Blue: "Ocean" world (snowing) - islands (neutral), glacier (blue tribe), ocean
- Green: "Jungle" world (raining) - forest (neutral), jungle (green tribe), rivers

- Fuchsia: "Volcano" dungeon - lava, islands and stone bridges
- Aqua: "Glacier" dungeon - water, islands and wood bridges
- Yellow: "Cave" dungeon - caves, forests and doors

- White: aether world - WFC generation
- Glitch: void world - disappearing
- Rainbow: rainbow world - all elements

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

## Crafting

- 10 stick + 3 coin = 1 wood
- 10 ore + 3 coin = 1 iron
- 10 berry + 3 coin = 1 berry stack
- 10 flower + 3 coin = 1 flower stack
- 10 spike + 3 coin = 1 spike stack

- 10 wood + 5 coin = 1 iron
- 10 iron + 10 coin = 1 gold
- 10 gold + 20 coin = 1 diamond
- 10 diamond + 50 coin = 1 ruby gem

- 10 flower stack + 25 gold = 1 fire essence
- 10 berry stack + 25 gold = 1 water essence
- 10 spike stack + 25 gold = 1 earth essence
- 10 fire essence + 10 water essence + 10 earth essence = 1 rainbow gem

- 1 diamond + 1 essence = 1 void shard
- 10 void shards + 10 gold = 1 void gem

- 99 coin = 1 gold

## Material enchanting

- 1 stick = wood sword (on collect)
- 5 iron + 1 wood sword = iron sword
- 5 gold + 1 iron sword = gold sword
- 5 diamond + 1 gold sword = diamond sword

- 10 wood + 20 xp = wood shield
- 10 iron + 1 wood shield = iron shield
- 10 gold + 1 iron shield = gold shield
- 10 diamond + 1 gold shield = diamond shield

- 10 wood + 20 xp = wood bow
- 10 iron = iron bow
- 10 gold = gold bow
- 10 diamond = diamond bow

## Elemental enchanting

- 10 fire essence + 1 gold equipment = fire equipment
- 10 water essence + 1 gold equipment = water equipment
- 10 earth essence + 1 gold equipment = earth equipment

- 10 ruby gem + 1 diamond equipment = ruby equipment
- 10 void gem + 1 diamond equipment = void equipment
- 10 aether gem + 1 elemental equipment = aether equipment
- 10 rainbow gem + 1 elemental equipment = rainbow equipment

## Consumables

- 3 berry + 1 coin = hp
- 3 berry stack + 1 iron = hp flask 1
- 1 fire essence + 1 gold = hp flask 2

- 3 flower + 1 coin = mp
- 3 flower stack + 1 iron = mp flask 1
- 1 water essence + 1 gold = mp flask 2

- 1 iron + 5 wood = arrow stack
- 5 iron + 1 wood = bomb stack
- 1 bomb stack + 1 essence = elemental bomb

## Ideas

- Banana = Mana Banana
- Durability on equipment, repair with smith or get own hammer
- Own home with chest, multiple characters
- Multiplayer
- Quicksand
- Passive that generates hp or mp that can be collected

## Animations

- Damage (hit marker)
- Collect and drop (flow towards entity)

## Respawn sequence

- Drop system: decay, drop and dispose on hero
- Fate system: vision on new halo
- Fate system: perish on new tombstone
- Controls: wait for halo spawn action
- Trigger system: spawn on halo
- Fate system: vision on new hero

## Tech debt

- <Terminal> only rerenders on reference frame changes, but does not listen to displayable entities
- Compass needle could be an animation and particle
- Attacking should have a bump movement
- Colors should be available without star import
- Pressed button could be implemented in ECS system rather than React state
- Sprite "none" should be obsolete
- Opacity overlaps individual sprites, should be animated color to black
- Touch origin should create an anchor and display current direction
- Houses should be part of a larger structure
- Dialog does not need to flip if out of range
- Units moving in front of AI in the right time will disupt pathfinding due to discarded path items
- Trading doesn't support requiring multiple items of same type or with amount larger than 1
- Trading action displays maximum of 2 items
- Tiny shadow on lootable items extends a bit further than on terrains due to loot height
- Mobs walking around the death animation might not receive fog hidden

## Inventory example

1. Compass
2. Map
3. Torch
4. Haste
5. Sword
6. Armor
7. Bow
8. Arrow
9. Spell
10. Axe
11. HP flask
12. MP flask
13. Diamond stack
14. Iron stack
15. Void shard
