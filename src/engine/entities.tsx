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

export const Lily: Ground = ({ amount }) => {
  return <span className="Entity Lily">{'\u221e'}</span>;
}

export const grounds = [Water, Ice, Sand, Path, Lily];


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

export const Stub: Terrain = () => {
  return <span className="Entity Wood">{'\u2510'}</span>;
}

export const Tree: Terrain = ({ direction }) => {
  return (
    <>
      <span className="Entity Wood">{'\u2510'}</span>
      <span className="Entity Tree">{direction ? '\u0398' : '#'}</span>
    </>
  );
}

export const terrains = [Rock, Stub, Tree];


// ------------------------ EQUIPMENT --------------------------------

export const Skin: Equipment = ({ level, material }) => {
  return <span className={`Entity Skin ${material}`}>{String.fromCharCode(level)}</span>
};

export type Equipment = React.FC<{
  id: number,
  amount: number,
  maximum: number,
  level: number,
  particles: number[],
  material: Material,
  mode?: Mode,
  direction?: Direction,
}>;

export const Sword: Equipment = ({ material, direction, mode }) => {
  const swordDirections: Partial<Record<Direction, string>> = {
    up: '|',
    right: '─',
    down: '|',
    left: '─',
  };
  return <span className={`Entity Sword ${material}`}>{(direction && mode === 'equipped' && swordDirections[direction]) || '/'}</span>
}

export const Armor: Equipment = ({ material }) => {
  return <span className={`Entity Armor ${material}`}>{'\u00ac'}</span>
}

export const Spell: Equipment = ({ amount, maximum, level, mode, material }) => {
  if (mode === "using") return null;
  const spellLevels = ['\u03b4', '\u0114'];

  return (
    <>
      <span className={`Entity Spell ${material}`}>{mode === 'equipped' ? '~' : spellLevels[level - 1]}</span>
      {material === 'plant' && !mode && <span className="Entity Bar">{getBar(amount, maximum)}</span>}
    </>
  );
}

export const Blocked: Equipment = () => {
  return null;
}

export const Boat: Equipment = ({ material }) => {
  return <span className={`Entity Boat ${material}`}>{'\u0115'}</span>
}

export const Compass: Equipment = ({ direction, mode }) => {
  if (mode === "equipped" && direction) return null;
  const arrows = {
    up: '\u0117',
    upRight: '\u0117',
    right: '\u0119',
    rightDown: '\u0119',
    down: '\u0118',
    downLeft: '\u0118',
    left: '\u011a',
    leftUp: '\u011a',
  };
  const arrow = arrows[direction || 'up'];
  return (
    <>
      <span className="Entity Compass">{'\u0108'}</span>
      <span className="Entity Needle">{arrow}</span>
    </>
  );
}

export const equipments = [Armor, Sword, Spell, Blocked, Boat, Compass];



// ------------------------ ITEM --------------------------------

export type Item = React.FC<{ amount: number }>;

export const Life: Item = ({ amount }) => {
  return <span className="Entity Life">{'\u0102'}</span>;
}

export const Apple: Item = ({ amount }) => {
  return <span className="Entity Life">.</span>;
}

export const Mana: Item = ({ amount }) => {
  return <span className="Entity Mana">{'\u0103'}</span>;
}

export const Blossom: Item = ({ amount }) => {
  return <span className="Entity Mana">{'\u011c'}</span>;
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

export const items = [Life, Apple, Blossom, Mana, Wood, Iron, Herb, Seed, Gold, Experience];


// ------------------------ SPRITE --------------------------------

export type Sprite = React.FC<{
  material?: Material,
}>;

export const Flower: Sprite = () => {
  return <span className="Entity Flower">,</span>;
}

export const Bush: Sprite = () => {
  return <span className="Entity Bush">{'\u03c4'}</span>;
}

export const sprites = [Flower, Bush];


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

export const Circle: Creature = ({ amount, maximum }) => {
  return (
    <>
      <span className="Entity Monster">0</span>
      <span className="Entity Bar">{getBar(amount, maximum)}</span>
    </>
  );
}

export const Chest: Creature = ({ amount, maximum }) => {
  return (
    <>
      <span className="Entity Chest">{'\u011d'}</span>
      <span className="Entity Frame">{'\u011f'}</span>
      <span className="Entity Frame">{'-'}</span>
      <span className="Entity Bar">{getBar(amount, maximum)}</span>
    </>
  );
}

export const creatures = [Triangle, Circle, Player];


// ------------------------ PARTICLE --------------------------------

export type Particle = React.FC<{
  id: number,
  direction?: Direction | Center,
  amount?: number,
  material?: Material,
  counter?: Counters,
}>;

export const Swimming: Particle = () => {
  return <span className="Entity Swimming">{'▄'}</span>;
}

export const Burning: Particle = ({ amount }) => {
  if (!amount) return null;
  if (amount > 2) return (
    <>
      <span className="Entity Burning">{'\u010e'}</span>
      <span className="Entity Spark">{'*'}</span>
    </>
  );
  if (amount > 1) return (
    <>
      <span className="Entity Burning">{'*'}</span>
      <span className="Entity Spark">{'+'}</span>
    </>
  );
  return (
    <>
      <span className="Entity Burning">{'+'}</span>
      <span className="Entity Spark">{'·'}</span>
    </>
  );
}

export const Freezing: Particle = ({ amount }) => {
  if (!amount) return null;
  if (amount > 9) return <span className="Entity Freezing">{'▓'}</span>;
  if (amount > 5) return <span className="Entity Freezing">{'▒'}</span>;
  if (amount > 1) return <span className="Entity Freezing">{'░'}</span>;
  return null
}

export const Attacked: Particle = ({ material }) => {
  return <span className={`Entity Attacked ${material || 'blood'}`}>{'x'}</span>;
}

export const Wave: Particle = ({ direction, material, amount }) => {
  const level = amount ? amount - 1 : 0;
  const shockDirections = {
    up: ['─', '═'],
    upRight: ['┐', '╗'],
    right: ['│', '║'],
    rightDown: ['┘', '╝'],
    down: ['─', '═'],
    downLeft: ['└', '╚'],
    left: ['│', '║'],
    leftUp: ['┌', '╔'],
    center: ['', ''],
  };
  return <span className={`Entity Wave ${material}`}>{shockDirections[direction || 'center'][level]}</span>;
}

export const Collecting: Particle = ({ counter, direction }) => {
  const counterParticles = {
    hp: '\u0102',
    xp: '+',
    mp: '\u0103',
    gold: '\u0108',
    seed: '\'',
    herb: '·',
    wood: '-',
    iron: '.',
  };
  return <span className={`Entity Collecting ${counter} ${direction}`}>{counter ? counterParticles[counter] : null}</span>;
}

export const particles = [Swimming, Burning, Attacked, Wave, Collecting];


// ------------------------ INTERACTION --------------------------------

export type Interaction = React.FC<{
  id: number,
  quest: string,
  equipments: number[],
}>;

export const CharacterSelect: Interaction = () => {
  return null;
}

export const Portal: Interaction = ({ quest }) => {
  return <span className={`Entity Portal ${quest}`}>{'\u2229'}</span>;
}

export const interactions = [CharacterSelect, Portal];

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
  [Apple, 'hp'],
  [Blossom, 'mp'],
]);

export const bars = ['\u0127', '\u0126', '\u0125', '\u0124', '\u0123', '\u0122', '\u0121', '\u0120'];
export const getBar = (amount: number, maximum: number) => amount === 0 ? ' ' : bars[Math.floor((bars.length - 1) * amount / maximum)];

export type Inventory = {
  sword?: number,
  armor?: number,
  spell?: number,
  boat?: number,
  compass?: number,
  skin?: number,
};
export const inventories = new Map<Equipment | undefined, keyof Inventory>([
  [Sword, 'sword'],
  [Armor, 'armor'],
  [Spell, 'spell'],
  [Boat, 'boat'],
  [Compass, 'compass'],
  [Skin, 'skin']
]);

export type Mode = 'equipped' | 'using';

export const materials = ['wood', 'iron', 'gold', 'fire', 'ice', 'plant', 'water'] as const;
export type Material = typeof materials[number];

export const containers = new Map<Sprite | Terrain | Ground | undefined, Item>([[Flower, Herb], [Bush, Seed], [Tree, Wood], [Rock, Iron], [Water, Blossom]]);

// ------------------------ ENTITY --------------------------------

export type Entity = Ground | Terrain | Item | Sprite | Creature | Equipment | Particle | Interaction;

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

export function Lock() {
}

export function Door() {
  return (
    <>
      <span className="Entity Door">{'\u0107'}</span>
    </>
  );
}
*/
