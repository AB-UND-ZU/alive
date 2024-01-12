import { Blocked, Bush, Cell, Chest, Compass, Creature, Equipment, Flower, Herb, Particle, Seed, Tree, Wave } from "./entities"
import { Direction } from "./utils";

/* Worlds

Rural (maroon)
- Normal world

Cliff (cyan)
- Lots of rocks
- Ice instead of water

Magma (red)
- Lava and sand
- No water or trees

Ocean (blue)
- Boat on pier
- Lots of water and islands

Swamp (green)
- Reduced vision / mist
- No fog of war
- Trees, water and sand only
*/


/* Rooms

Spawn
- Portal to next world
- Unlock with 10+
- Chest
- Some plants with items
- Tree ring

Smith
- Weapon and armor

Trade
- Herb and seed
- Mana and food
- Gold

Magic
- Spell
- Enchanted weapons

Boss
- Alphabet

*/

const getBlockedProps = (direction: Direction): EquipmentProps => (
  { amount: 0, maximum: 0, level: 0, material: 'wood', mode: 'equipped', particle: [
    Wave, { direction, material: 'plant' }
  ] }
);

const cellMap: Record<string, LayoutCell> = {
  '0': null,
  ' ': {},
  '#': { terrain: <Tree /> },
  'Θ': { terrain: <Tree direction="up" /> },
  'τ': { sprite: <Bush /> },
  '°': { sprite: <Bush />, item: <Seed amount={3} /> },
  ',': { sprite: <Flower /> },
  ';': { sprite: <Flower />, item: <Herb amount={1} /> },
  '+': { creature: [Chest, { amount: 8, maximum: 8, orientation: 'up', equipments: [], particles: [] }] },
  '^': { equipment: [Compass, { material: 'iron', amount: 0, maximum: 0, level: 0 }] },
  '─': { equipment: [Blocked, getBlockedProps('up') ] },
  '│': { equipment: [Blocked, getBlockedProps('right') ] },
  '┌': { equipment: [Blocked, getBlockedProps('leftUp') ], sprite: <Flower /> },
  '┐': { equipment: [Blocked, getBlockedProps('upRight') ], sprite: <Flower /> },
  '┘': { equipment: [Blocked, getBlockedProps('rightDown') ] },
  '└': { equipment: [Blocked, getBlockedProps('downLeft') ] },
};

const mapToCells = (map: string) => map.split('\n').map(row => row.split('').map(cell => cell in cellMap ? cellMap[cell] : cell));


export type EquipmentProps = Omit<React.ComponentProps<Equipment>, 'id' | 'particles'> & {
  particle?: [Particle, Omit<React.ComponentProps<Particle>, 'id'>],
};

export type CreatureProps = Omit<React.ComponentProps<Creature>, 'id'>;

export type LayoutCell = null | Cell & {
  equipment?: [Equipment, EquipmentProps],
  creature?: [Creature, CreatureProps],
};

export type Room = {
  layout: LayoutCell[][]
};

export type World = {
  rooms: Record<string, Room>,
};

const spawnMap = `\
00000         00000
000   Θ#Θ#Θ#Θ   000
00  Θ#ττ┌─┐ττ#Θ  00
0  #ττ,,│ │,,ττ#  0
  Θτ,,  └─┘  ,,τΘ  
 #τ,  ,     ;  ,τ# 
 Θτ, ,+,   ,°; ,τΘ 
 #τ,  ,     ;  ,τ# 
  Θτ,,   ^   ,,τΘ  
0  #ττ,,   ,,ττ#  0
00  Θ#ττ, ,ττ#Θ  00
000   Θ#Θ Θ#Θ   000
00000         00000\
`;

const introMap = `\
00 ,τ#τ,   ,τ#τ, 00
00 ,τ#τ,   ,τ#τ, 00
00 ,τΘτ,   ,τΘτ, 00
00 ,τ#τ,   ,τ#τ, 00
00 ,τΘτ,   ,τΘτ, 00
00 ,τ#τ,   ,τ#τ, 00
00 ,τΘτ,   ,τΘτ, 00
00 ,τΘτ,   ,τΘτ, 00
00000         00000\
`;

export const rural: World = {
  rooms: {
    spawn: {
      // 19x13
      layout: mapToCells(spawnMap),
    },
    intro: {
      layout: mapToCells(introMap),
    },
  }
}