# Alive

Play it here: https://ab-und-zu.github.io/alive

## Media

![Spawn](public/Spawn.gif)

_Using a stick as sword to fight first monsters_

![Spell](public/Spell.gif)

_Casting ice spell to freeze monsters and water_

## Onboarding

Concepts
- Character select
- Press action button
- Picking up stuff
- Attacking
- Stats
- Monsters walk
- Portal
- Walk through grass

Option 1
- Spawn circle
- Top says "ALIVE" in big font
- Center character
- Below "Select character , Press OK"
- Action: Press ok

- Top "INTRO" portal
- Bottom opening
- Left right flowers and bushes with items
- No chest, compass later

Tutorial
-


## Plan

- v1
  - Loading screen for level generation
  - Score / Experience 
  - Portal to next level, increased difficulty
  - Shops
  - Epic monsters: boss and fairy
  - Normal monsters: circle and question mark
  - Applying damage: monsters, weapon types, armor
  - Paths between waypoints
  - Fix quests
- v2
  - Character select menu
  - potions
  - Fix fog of war corners and replace opacity with overlay
  - Map zoom out
  - Torches, view radius with zoom, reduce in bush
  - Music / FX
  - More elemental spells?
  - Chests and keys
  - Perlin noise terrain generation
  - World presets: normal, desert, ocean, forest, mountain
  - Pushing or swapping blocks puzzle

## HUD

- Player: Female symbol, note symbol, arrow up, exclamation mark, ampersand, uppercase letter, numbers
- Average drop: 10wood 10iron 15 food 20 mana
- Swimming: oxygen count?

## Layers

- Deep water
- Shallow water
- Sand
- Ground
- Path
- Rock
- Ice

## Items

- ○ Gold
- ♥ Food
- ◆ Mana
- ≡ Wood
- ÷ Iron
- + Power
- . Apple
- ↔ Blossom

- Sword: Wood / Iron / Gold / Ice / Fire
- Shield: Wood / Iron / Gold / Ice / Fire
- Ranged: Spell Ice / Fire / Bubble, gun

- Boat: Wood
- Bomb
- Torch


## Spells

- Ice
- Fire
- Bubble
- Trap


## Elements

- Fire
  - red
  - DoT
  - Burns trees
  - Thaws ice
- Ice
  - aqua
  - Stun
  - Makes water to ice

## Recipes

- 5 wood : 1 gold
- 4 iron : 1 gold
- 3 mana : 1 gold
- 2 life : 1 gold

- 5 wood 2 gold : 1 sword
- 10 iron 10 gold : 1 sword

- 10 wood 5 gold : 1 shield
- 15 iron 25 gold : 1 shield

## Rooms

- Spawn
- Chest
- Fairy ring
- Endboss
- Food store (red)
- Mana store (aqua)
- Shield store (maroon)
- Weapon store (grey)
- Spell store 

## Monsters

- ▶ Triangle (Straight until wall then random direction change)
- Circle (öÖöÖ)
  - Straight towards player
- Questionmark
  - A* path finding
- Alphabet (Z)
  - Static, shooting
- Shark (clover)
  - Swimming only
- Shock wave tower
- Fairy (running away)


## Balancing

- No weapon: 0 dmg
- Wooden sword: 1 dmg
- Iron sword: 2 dmg

- No armor: full dmg
- Wooden armor: -1 dmg
- Iron armor: -2 dmg

- Ice spell freeze: 8 ticks
- Fire spell dmg: 3 ticks 

- Triangle: 5 hp 3 dmg
- Circle: 2 hp 3 dmg


## Presets

- Normal (lakes, forests)
- Ocean (allow swimming with air)
- Forest
- Dark (no fog of war)
- Desert
- Ice world
- Lava world

## Random observations

- I'm spending quite a lot of time on awesome details, but the game is not Alive yet
- I tried implementing Immer, which was actually quite fun and revealed some referencing bugs in my code. However the performance dropped significantly, actually unplayable, didn't even bother to measure. Auf Nimmerwiedersehen!
- iOS Safari opacity transition sometimes not working in energy saving mode, but not caring about it either
