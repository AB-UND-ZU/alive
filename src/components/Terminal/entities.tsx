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

export const ShallowWater: Ground = ({ amount }) => {
  return <span className="Entity ShallowWater">{densities[amount - 1]}</span>
}

export const Ice: Ground = ({ amount }) => {
  return <span className="Entity Ice">{densities[amount - 1]}</span>
}

/*
export const Lily: Ground = ({ amount }) => {
  return <span className="Entity Plant">{'\u221e'}</span>;
}
*/

export const grounds = [ShallowWater, Ice, Sand, Path];


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

export const DeepWater: Terrain = () => {
  return <span className="Entity DeepWater">{'█'}</span>
}

export const Tree: Terrain = () => {
  return (
    <>
      <span className="Entity Wood">{'\u2510'}</span>
      <span className="Entity Plant">{'#'}</span>
    </>
  );
}

export const terrains = [DeepWater, Rock, Tree];



// ------------------------ ITEM --------------------------------

export type Item = React.FC<{ amount: number }>;

export const Gold: Item = ({ amount }: { amount: number }) => {
  if (amount === 1) return <span className="Entity Gold">{'\u0108'}</span>;
  if (amount === 2) return <span className="Entity Gold">{'o'}</span>;
  return <span className="Entity Gold">{'O'}</span>;
}

export const Food: Item = ({ amount }: { amount: number }) => {
  if (amount === 1) return <span className="Entity Food">{'\''}</span>;
  if (amount === 2) return <span className="Entity Food">{'"'}</span>;
  return <span className="Entity Food">{'°'}</span>;
}

export const Mana: Item = ({ amount }: { amount: number }) => {
  if (amount === 1) return <span className="Entity Mana">{'·'}</span>;
  if (amount === 2) return <span className="Entity Mana">{'∙'}</span>;
  return <span className="Entity Mana">{'\u0106'}</span>;
}

export const Wood: Item = ({ amount }: { amount: number }) => {
  if (amount === 1) return <span className="Entity Wood">{'-'}</span>;
  if (amount === 2) return <span className="Entity Wood">{'='}</span>;
  return <span className="Entity Wood">{'\u2261'}</span>;
}

export const Iron: Item = ({ amount }: { amount: number }) => {
  if (amount === 1) return <span className="Entity Iron">{'.'}</span>;
  if (amount === 2) return <span className="Entity Iron">{':'}</span>;
  return <span className="Entity Iron">{'\u00f7'}</span>;
}

export const items = [Wood, Iron, Mana, Food, Gold];


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

export const equipments = [Armor, Sword, Spell];


// ------------------------ PARTICLE --------------------------------

export type Particle = React.FC;

export const Swimming: Particle = () => {
  return <span className="Entity ShallowWater">{'▄'}</span>;
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
 
export type Status = 'xp' | 'mp';
export const inventories = new Map<Item | undefined, Inventory>([
  [Gold, 'gold'],
  [Food, 'food'],
  [Mana, 'mana'],
  [Wood, 'wood'],
  [Iron, 'iron'],
]);
export type Inventory = 'gold' | 'food' | 'mana' | 'wood' | 'iron';
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

export const containers = new Map<Entity | undefined, Item>([[Flower, Mana], [Bush, Food], [Tree, Wood], [Rock, Iron]]);

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
