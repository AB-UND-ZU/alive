import { ReactComponentElement } from "react";
import { Point } from "./utils";

// ------------------------ GROUND --------------------------------

export type Ground = React.FC<{ amount: number }>;

const densities = ['░', '▒', '▓', '█'];
export const Path: Ground = ({ amount }) => {
  return <span className="Entity Path">{densities[amount - 1]}</span>
}

export const Sand: Ground = ({ amount }) => {
  return <span className="Entity Sand">{densities[amount - 1]}</span>
}

export const Water: Ground = ({ amount }) => {
  return <span className="Entity Water">{densities[amount - 1]}</span>
}

export const Ice: Ground = ({ amount }) => {
  return <span className="Entity Ice">{densities[amount - 1]}</span>
}

/*
export const Lily: Ground = ({ amount }) => {
  return <span className="Entity Plant">{'\u221e'}</span>;
}
*/

export const grounds = [Water, Ice, Sand, Path];


// ------------------------ TERRAIN --------------------------------

export type Terrain = React.FC<{direction?: Direction }>;

export const Rock: Terrain = ({ direction }) => {
  const directions: Record<Direction, string> = {
    up: '▀',
    right: '▐',
    down: '▄',
    left: '▌',
  };

  return <span className="Entity Rock">{direction ? directions[direction] : '█'}</span>
}

export const Tree: Terrain = ({ direction }) => {
  return (
    <>
      <span className="Entity Wood">{'\u2510'}</span>
      <span className="Entity Plant">{direction ? '\u0398' : '#'}</span>
    </>
  );
}

export const terrains = [Rock, Tree];



// ------------------------ ITEM --------------------------------

export type Item = React.FC<{ amount: number }>;

export const Life: Item = ({ amount }: { amount: number }) => {
  return (
    <>
      {amount > 0 && <span className="Entity Life">{amount}</span>}
      <span className="Entity Life">{'\u0102'}</span>
    </>
  );
}

export const Mana: Item = ({ amount }: { amount: number }) => {
  return (
    <>
      {amount > 0 && <span className="Entity Mana">{amount}</span>}
      <span className="Entity Mana">{'\u0103'}</span>
    </>
  );
}

export const Experience: Item = ({ amount }: { amount: number }) => {
  if (amount === 1) return <span className="Entity Experience">{'+'}</span>;
  if (amount === 2) return (
    <>
      <span className="Entity Experience">{'-'}</span>
      <span className="Entity Experience">{'|'}</span>
    </>
  );
  return <span className="Entity Experience">{'┼'}</span>;
}

export const Gold: Item = ({ amount }: { amount: number }) => {
  if (amount === 1) return <span className="Entity Gold">{'\u0108'}</span>;
  if (amount === 2) return <span className="Entity Gold">{'o'}</span>;
  return <span className="Entity Gold">{'O'}</span>;
}

export const Seed: Item = ({ amount }: { amount: number }) => {
  if (amount === 1) return <span className="Entity Seed">{'\''}</span>;
  if (amount === 2) return <span className="Entity Seed">{'"'}</span>;
  return <span className="Entity Seed">{'°'}</span>;
}

export const Herb: Item = ({ amount }: { amount: number }) => {
  if (amount === 1) return <span className="Entity Herb">{'·'}</span>;
  if (amount === 2) return <span className="Entity Herb">{'∙'}</span>;
  return <span className="Entity Herb">{'\u0106'}</span>;
}

export const Wood: Item = ({ amount }: { amount: number }) => {
  if (amount === 1) return <span className="Entity Wood">{'-'}</span>;
  if (amount === 2) return <span className="Entity Wood">{'='}</span>;
  return <span className="Entity Wood">{'\u2261'}</span>;
}

export const Iron: Item = ({ amount }: { amount: number }) => {
  if (amount === 1) return <span className="Entity Ore">{'.'}</span>;
  if (amount === 2) return <span className="Entity Ore">{':'}</span>;
  return <span className="Entity Ore">{'\u00f7'}</span>;
}

export const items = [Life, Mana, Wood, Iron, Herb, Seed, Gold, Experience];


// ------------------------ SPRITE --------------------------------

export type Sprite = React.FC;

export const Flower: Sprite = () => {
  return <span className="Entity Plant">,</span>;
}

export const Bush: Sprite = () => {
  return <span className="Entity Plant">{'\u03c4'}</span>;
}

export const Campfire: Sprite = () => {
  return <span className="Entity Wood">{'\u010e'}</span>;
}

export const sprites = [Flower, Bush, Campfire];


// ------------------------ CREATURE --------------------------------

export type Creature = React.FC<{ direction: Direction }>;
export const Player: Creature = () => {
  return (
    <>
      <span className="Entity Eye">{'\u0128'}</span>
      <span className="Entity Player">{'\u010b'}</span>
      <span className="Entity Hair">~</span>
      <span className="Entity Health">{'\u0120'}</span>
    </>
  )
}

export const Triangle: Creature = ({ direction }) => {
  const directions = {
    up: '\u011d',
    right: '\u010f',
    down: '\u011e',
    left: '\u0110',
  };
  return (
    <>
      <span className="Entity Monster">{directions[direction]}</span>
      <span className="Entity Bar">{'\u0120'}</span>
    </>
  );
}

export const creatures = [Triangle, Player];


// ------------------------ EQUIPMENT --------------------------------

export type Equipment = React.FC<{ material: Material }>;

export const Sword: Equipment = ({ material }) => {
  return <span className={`Entity Sword ${material}`}>{'/'}</span>
}

export const Armor: Equipment = ({ material }) => {
  return <span className={`Entity Armor ${material}`}>{'\u00ac'}</span>
}

export const Spell: Equipment = ({ material }) => {
  return <span className={`Entity Spell ${material}`}>{'\u0128'}</span>
}

export const Amulet: Equipment = ({ material }) => {
  return <span className={`Entity Amulet ${material}`}>{'@'}</span>
}

export const Boat: Equipment = ({ material }) => {
  return <span className={`Entity Boat ${material}`}>{'\u0115'}</span>
}

export const Key: Equipment = ({ material }) => {
  return <span className={`Entity Key ${material}`}>{'\u011c'}</span>
}

export const equipments = [Armor, Sword, Spell, Amulet];


// ------------------------ PARTICLE --------------------------------

export type Particle = React.FC;

export const Swimming: Particle = () => {
  return <span className="Entity Water">{'▄'}</span>;
}

export const Burning: Particle = () => {
  return (
    <>
      <span className="Entity Fire">{'*'}</span>
      <span className="Entity Spark">{'·'}</span>
    </>
  );
}

export const particles = [Swimming, Burning];

// ------------------------ CONSTANTS --------------------------------
 
export type Status = 'hp' | 'xp' | 'mp';
export const inventories = new Map<Item | undefined, Stats>([
  [Life, 'hp'],
  [Experience, 'xp'],
  [Mana, 'mp'],
  [Gold, 'gold'],
  [Herb, 'herb'],
  [Seed, 'seed'],
  [Wood, 'wood'],
  [Iron, 'iron'],
]);
export type Inventory = 'gold' | 'seed' | 'herb' | 'wood' | 'iron';
export type Stats = Status | Inventory;
export type Material = "wood" | "iron" | "fire" | "ice";

export const directions = ['up', 'right', 'down', 'left'] as const;
export const directionOffset: Record<Direction, Point> = {
  up: [0, -1],
  right: [1, 0],
  down: [0, 1],
  left: [-1, 0],
}
export type Direction = typeof directions[number];

export const containers = new Map<Entity | undefined, Item>([[Flower, Herb], [Bush, Seed], [Tree, Wood], [Rock, Iron]]);

// ------------------------ ENTITY --------------------------------

export type Entity = Ground | Terrain | Item | Sprite | Creature | Equipment | Particle;

export const entities = [
  ...grounds,
  ...terrains,
  ...items,
  ...sprites,
  ...creatures,
  ...equipments,
  ...particles
];

export type SingleCategories = 'terrain' | 'item' | 'sprite' | 'creature';
export type MultipleCategories = 'grounds' | 'equipments' | 'particles';
export type Cell = {
  grounds?: ReactComponentElement<Ground>[],
  terrain?: ReactComponentElement<Terrain>,
  item?: ReactComponentElement<Item>,
  sprite?: ReactComponentElement<Sprite>,
  creature?: ReactComponentElement<Creature>,
  equipments?: ReactComponentElement<Equipment>[],
  particles?: ReactComponentElement<Particle>[],
};

/*
export function Chest() {
  return (
    <>
      <span className="Entity Gold">{'\u011d'}</span>
      <span className="Entity Chest">{'\u0115'}</span>
      <span className="Entity Chest">{'\u011f'}</span>
    </>
  );
}

export function Lock() {
  return <span className={`Entity Lock`}>{'\u011c'}</span>
}

export function Door() {
  return (
    <>
      <span className="Entity Door">{'\u0107'}</span>
    </>
  );
}
*/
