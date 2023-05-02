import { ReactComponentElement } from "react";
import { Center, Direction, Orientation } from "./utils";

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

/*
Record<Direction, string> = {
  up: '▀',
  upRight: '\u259d',
  right: '▐',
  rightDown: '\u2597',
  down: '▄',
  downLeft: '\u2596',
  left: '▌',
  leftUp: '\u2598',
};
*/

export const Rock: Terrain = () => {
  return <span className="Entity Rock">{'█'}</span>
}

export const Tree: Terrain = ({ direction }) => {
  return (
    <>
      <span className="Entity Wood">{'\u2510'}</span>
      <span className="Entity Tree">{direction ? '\u0398' : '#'}</span>
    </>
  );
}

export const terrains = [Rock, Tree];


// ------------------------ EQUIPMENT --------------------------------

export type Equipment = React.FC<{
  id: number,
  amount: number,
  particles: number[],
  material: Material,
  interaction?: Interaction,
  direction?: Direction,
}>;

export const Sword: Equipment = ({ material, direction }) => {
  const swordDirections: Partial<Record<Direction, string>> = {
    up: '|',
    right: '─',
    down: '|',
    left: '─',
  };
  return <span className={`Entity Sword ${material}`}>{(direction && swordDirections[direction]) || '/'}</span>
}

export const Armor: Equipment = ({ material }) => {
  return <span className={`Entity Armor ${material}`}>{'\u00ac'}</span>
}

export const Spell: Equipment = ({ interaction, material }) => {
  if (interaction === "using") return null;
  return <span className={`Entity Spell ${material}`}>{interaction === 'equipped' ? '~' : '@'}</span>
}

export const Boat: Equipment = ({ material }) => {
  return <span className={`Entity Boat ${material}`}>{'\u0115'}</span>
}

export const Key: Equipment = ({ material }) => {
  return <span className={`Entity Key ${material}`}>{'\u011c'}</span>
}

export const equipments = [Armor, Sword, Spell, Boat, Key];



// ------------------------ ITEM --------------------------------

export type Item = React.FC<{ amount: number }>;

export const Life: Item = ({ amount }) => {
  return (
    <>
      {amount > 0 && <span className="Entity Life">{amount}</span>}
      <span className="Entity Life">{'\u0102'}</span>
    </>
  );
}

export const Mana: Item = ({ amount }) => {
  return (
    <>
      {amount > 0 && <span className="Entity Mana">{amount}</span>}
      <span className="Entity Mana">{'\u0103'}</span>
    </>
  );
}

export const Experience: Item = ({ amount }) => {
  if (amount === 1) return <span className="Entity Experience">{'+'}</span>;
  if (amount === 2) return (
    <>
      <span className="Entity Experience">{'-'}</span>
      <span className="Entity Experience">{'|'}</span>
    </>
  );
  return <span className="Entity Experience">{'┼'}</span>;
}

export const Gold: Item = ({ amount }) => {
  if (amount === 1) return <span className="Entity Gold">{'\u0108'}</span>;
  if (amount === 2) return <span className="Entity Gold">{'o'}</span>;
  return <span className="Entity Gold">{'O'}</span>;
}

export const Seed: Item = ({ amount }) => {
  if (amount === 1) return <span className="Entity Seed">{'\''}</span>;
  if (amount === 2) return <span className="Entity Seed">{'"'}</span>;
  return <span className="Entity Seed">{'°'}</span>;
}

export const Herb: Item = ({ amount }) => {
  if (amount === 1) return <span className="Entity Herb">{'·'}</span>;
  if (amount === 2) return <span className="Entity Herb">{'∙'}</span>;
  return <span className="Entity Herb">{'\u0106'}</span>;
}

export const Wood: Item = ({ amount }) => {
  if (amount === 1) return <span className="Entity Wood">{'-'}</span>;
  if (amount === 2) return <span className="Entity Wood">{'='}</span>;
  return <span className="Entity Wood">{'\u2261'}</span>;
}

export const Iron: Item = ({ amount }) => {
  if (amount === 1) return <span className="Entity Ore">{'.'}</span>;
  if (amount === 2) return <span className="Entity Ore">{':'}</span>;
  return <span className="Entity Ore">{'\u00f7'}</span>;
}

export const items = [Life, Mana, Wood, Iron, Herb, Seed, Gold, Experience];


// ------------------------ SPRITE --------------------------------

export type Sprite = React.FC;

export const Flower: Sprite = () => {
  return <span className="Entity Flower">,</span>;
}

export const Bush: Sprite = () => {
  return <span className="Entity Bush">{'\u03c4'}</span>;
}

export const Campfire: Sprite = () => {
  return <span className="Entity Wood">{'\u010e'}</span>;
}

export const sprites = [Flower, Bush, Campfire];


// ------------------------ CREATURE --------------------------------

export type Creature = React.FC<{
  id: number,
  amount: number,
  maximum: number,
  orientation: Orientation,
  equipments: number[],
  particles: number[],
}>;

export const Player: Creature = ({ amount, maximum }) => {
  return (
    <>
      <span className="Entity Player">{'\u010b'}</span>
      <span className="Entity Hair">~</span>
      <span className="Entity Health">{getBar(amount, maximum)}</span>
    </>
  )
}

export const Triangle: Creature = ({ amount, maximum, orientation }) => {
  const triangleOrientations = {
    up: '\u011d',
    right: '\u010f',
    down: '\u011e',
    left: '\u0110',
  };
  return (
    <>
      <span className="Entity Monster">{triangleOrientations[orientation]}</span>
      <span className="Entity Bar">{getBar(amount, maximum)}</span>
    </>
  );
}

export const Circle: Creature = ({ orientation }) => {
  const circleOrientations = {
    up: '\u011d',
    right: '\u010f',
    down: '\u011e',
    left: '\u0110',
  };
  return (
    <>
      <span className="Entity Monster">{circleOrientations[orientation]}</span>
      <span className="Entity Bar">{'\u0120'}</span>
    </>
  );
}

export const creatures = [Triangle, Player];


// ------------------------ PARTICLE --------------------------------

export type Particle = React.FC<{
  id: number,
  direction?: Direction | Center,
  amount?: number,
  material?: Material,
}>;

export const Swimming: Particle = () => {
  return <span className="Entity Swimming">{'▄'}</span>;
}

export const Burning: Particle = () => {
  return (
    <>
      <span className="Entity Fire">{'*'}</span>
      <span className="Entity Spark">{'·'}</span>
    </>
  );
}

export const Freezing: Particle = ({ amount }) => {
  if (!amount) return null;
  if (amount > 4) return <span className="Entity Freezing">{'▓'}</span>;
  if (amount > 2) return <span className="Entity Freezing">{'▒'}</span>;
  return <span className="Entity Freezing">{'░'}</span>;
}

export const Attacked: Particle = ({ material }) => {
  return <span className={`Entity Attacked ${material || 'blood'}`}>{'x'}</span>;
}

export const Shock: Particle = ({ direction }) => {
  const shockDirections = {
    up: '─',
    upRight: '┐',
    right: '│',
    rightDown: '┘',
    down: '─',
    downLeft: '└',
    left: '│',
    leftUp: '┌',
    center: '',
  };
  return <span className="Entity Freezing">{shockDirections[direction || 'center']}</span>;
}

export const particles = [Swimming, Burning, Shock];

// ------------------------ CONSTANTS --------------------------------
 
export type Stats = 'hp' | 'xp' | 'mp';
export type Slots = 'gold' | 'seed' | 'herb' | 'wood' | 'iron';
export type Counters = Slots | Stats;
export const counters = new Map<Item | undefined, Counters>([
  [Life, 'hp'],
  [Experience, 'xp'],
  [Mana, 'mp'],
  [Gold, 'gold'],
  [Herb, 'herb'],
  [Seed, 'seed'],
  [Wood, 'wood'],
  [Iron, 'iron'],
]);

export const bars = ['\u0127', '\u0126', '\u0125', '\u0124', '\u0123', '\u0122', '\u0121', '\u0120'];
export const getBar = (amount: number, maximum: number) => bars[Math.floor((bars.length - 1) * amount / maximum)];

export type Inventory = {
  sword?: number,
  armor?: number,
  spell?: number,
  boat?: number,
  key?: number,
};
export const inventories = new Map<Equipment | undefined, keyof Inventory>([
  [Sword, 'sword'],
  [Armor, 'armor'],
  [Spell, 'spell'],
  [Boat, 'boat'],
  [Key, 'key'],
]);

export type Interaction = 'equipped' | 'using';

export const materials = ['wood', 'iron', 'fire', 'ice'] as const;
export type Material = typeof materials[number];

export const containers = new Map<Sprite | Terrain | undefined, Item>([[Flower, Herb], [Bush, Seed], [Tree, Wood], [Rock, Iron]]);

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

export type SingleCategories = 'terrain' | 'item' | 'sprite';
export type MultipleCategories = 'grounds';
export type Cell = {
  grounds?: ReactComponentElement<Ground>[],
  terrain?: ReactComponentElement<Terrain>,
  item?: ReactComponentElement<Item>,
  sprite?: ReactComponentElement<Sprite>,
};
export type Unit = {
  creature?: ReactComponentElement<Creature>,
  equipments?: ReactComponentElement<Equipment>[],
  particles?: ReactComponentElement<Particle>[],
}

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
