# Alive

Try it here: https://ab-und-zu.github.io/alive

Intended to be used with https://www.rune.ai/

## Plan

- v1
  - Loading screen for level generation
  - Score / Experience
  - Portal to next level, increased difficulty
  - Spawn area not blocked
  - Shops
  - Epic monsters: boss and fairy
  - Normal monsters: circle and question mark
  - Applying damage: monsters, weapon types, armor
  - Fire spell
  - Paths between waypoints
  - Release on Rune
- v2
  - Character select menu
  - Fix fog of war corners
  - Map zoom out
  - Torches, view radius with zoom
  - Music / FX
  - More elemental spells?
  - Chests and keys
  - Perlin noise terrain generation
  - World presets: normal, desert, ocean, forest, mountain

## HUD

- Player: Female symbol, note symbol, arrow up, exclamation mark, ampersand, uppercase letter, numbers
- Fix seeing between rocks
- Average drop: 10wood 10iron 15 food 20 mana
- Swimming: oxygen count?
- Swipe distance = speed?

## Layers

- Deep water
- Shallow water
- Sand
- Ground
- Path
- Rock
- Ice
- lily

## Items

- ∙ Gold
- ♥ Food
- ○ Mana
- ≡ Wood
- ÷ Iron
- 

- Weapon
  - Wood / Iron
  - Elements
- Shield
  - Wood / Iron
  - Elements
- Shockwave spell
  - Elements

- Boat: Wood
- Bomb
- Torch

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

## Random observations

- I'm spending quite a lot of time on awesome details, but the game is not Alive yet
- I tried implementing Immer, which was actually quite fun and revealed some referencing bugs in my code. However the performance dropped significantly, actually unplayable, didn't even bother to measure. Auf Nimmerwiedersehen!
- iOS Safari opacity transition not working, but not caring about it either