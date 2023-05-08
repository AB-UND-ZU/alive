import { Blocked, Bush, Cell, Chest, Compass, Creature, Equipment, Flower, Herb, Particle, Portal, Seed, Tree, Wave } from "./entities"
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

const air: LayoutCell = {};
const tree: LayoutCell = { terrain: <Tree /> };
const tre2: LayoutCell = { terrain: <Tree direction="up" /> };
const bush: LayoutCell = { sprite: <Bush /> };
const seed: LayoutCell = { sprite: <Bush />, item: <Seed amount={3} /> };
const flwr: LayoutCell = { sprite: <Flower /> };
const herb: LayoutCell = { sprite: <Flower />, item: <Herb amount={1} /> };
const chst: LayoutCell = { creature: [Chest, { amount: 8, maximum: 8, orientation: 'up', equipments: [], particles: [] }] };
const cmps: LayoutCell = { equipment: [Compass, { material: 'iron', amount: 0, maximum: 0, level: 0 }] };

const getBlockedProps = (direction: Direction): EquipmentProps => (
  { amount: 0, maximum: 0, level: 0, material: 'wood', interaction: 'equipped', particle: [
    Wave, { direction, material: 'plant' }
  ] }
);

const prtl: LayoutCell = { sprite: <Portal material="water" /> };
const pluu: LayoutCell = { equipment: [Blocked, getBlockedProps('up') ] };
const plur: LayoutCell = { equipment: [Blocked, getBlockedProps('upRight') ], sprite: <Flower /> };
const plrr: LayoutCell = { equipment: [Blocked, getBlockedProps('right') ] };
const plrd: LayoutCell = { equipment: [Blocked, getBlockedProps('rightDown') ] };
const pldd: LayoutCell = { equipment: [Blocked, getBlockedProps('down') ] };
const pldl: LayoutCell = { equipment: [Blocked, getBlockedProps('downLeft') ] };
const plll: LayoutCell = { equipment: [Blocked, getBlockedProps('left') ] };
const pllu: LayoutCell = { equipment: [Blocked, getBlockedProps('leftUp') ], sprite: <Flower /> };

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

export const rural: World = {
  rooms: {
    spawn: {
      // 19x13
      layout: [
        [null,null,null,null,null,air, air, air, air, air, air, air, air, air, null,null,null,null,null],
        [null,null,null,air, air, air, tre2,tree,tre2,tree,tre2,tree,tre2,air, air, air, null,null,null],
        [null,null,air, air, tre2,tree,bush,bush,pllu,pluu,plur,bush,bush,tree,tre2,air, air, null,null],
        [null,air, air, tree,bush,bush,flwr,flwr,plll,prtl,plrr,flwr,flwr,bush,bush,tree,air, air, null],
        [air, air, tre2,bush,flwr,flwr,null,null,pldl,pldd,plrd,null,null,flwr,flwr,bush,tre2,air, air ],
        [air, tree,bush,flwr,null,null,flwr,null,null,null,null,null,herb,null,null,flwr,bush,tree,air ],
        [air, tre2,bush,flwr,null,flwr,chst,flwr,null,null,null,flwr,seed,herb,null,flwr,bush,tre2,air ],
        [air, tree,bush,flwr,null,null,flwr,null,null,null,null,null,herb,null,null,flwr,bush,tree,air ],
        [air, air, tre2,bush,flwr,flwr,null,null,null,cmps,null,null,null,flwr,flwr,bush,tre2,air, air ],
        [null,air, air, tree,bush,bush,flwr,flwr,null,null,null,flwr,flwr,bush,bush,tree,air, air, null],
        [null,null,air, air, tre2,tree,bush,bush,flwr,air, flwr,bush,bush,tree,tre2,air, air, null,null],
        [null,null,null,air, air, air, tre2,tree,tre2,air ,tre2,tree,tre2,air, air, air, null,null,null],
        [null,null,null,null,null,air, air, air, air, air, air, air, air, air, null,null,null,null,null],
      ]
    }
  }
}