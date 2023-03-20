import { ReactComponentElement, ReactElement } from "react";

export type Status = 'xp' | 'mp';
export type Inventory = 'gold' | 'food' | 'mana' | 'wood' | 'iron';
export type Stats = Status | Inventory;
export type Material = "wood" | "iron" | "fire" | "ice";
export type Direction = "up" | "right" | "down" | "left";


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
      <span className="Entity Bar">{'\u0126'}</span>
    </>
  );
}

export const creatures = { Player, Triangle };

export type Item = React.FC<{ amount: number, inventory: Inventory }>;

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

export const items = { Gold, Food, Mana, Wood, Iron };

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

export const equipments = { Sword, Armor, Spell };

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
  return <span className="Entity DeepWater">{'▓'}</span>
}

export const Tree: Terrain = () => {
  return (
    <>
      <span className="Entity Wood">{'\u2510'}</span>
      <span className="Entity Plant">{'#'}</span>
    </>
  );
}

export const terrains = { Rock, DeepWater, Tree };

export type Ground = React.FC;

export const Path: Ground = () => {
  return <span className="Entity Path">{'░'}</span>
}

export const Sand: Ground = () => {
  return <span className="Entity Sand">{'▒'}</span>
}

export const ShallowWater: Ground = () => {
  return <span className="Entity ShallowWater">{'▓'}</span>
}

export const Ice: Ground = () => {
  return <span className="Entity Ice">{'▓'}</span>
}

export const grounds = { Path, Sand, ShallowWater, Ice };

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

export const sprites = { Flower, Bush, Campfire };

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

export const particles = { Swimming, Burning };


export const entities = {
  ...grounds,
  ...terrains,
  ...items,
  ...sprites,
  ...creatures,
  ...equipments,
  ...particles
};


export type Cell = {
  ground?: ReactComponentElement<Ground>,
  terrain?: ReactComponentElement<Terrain>,
  item?: ReactComponentElement<Item>,
  sprites?: ReactComponentElement<Sprite>[],
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

export const forestCells: Cell[] = [
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},

  { creature: <Triangle direction="up" /> },

  { item: <Gold amount={1} inventory="gold" /> },
  { item: <Gold amount={2} inventory="gold" /> },
  { item: <Gold amount={5} inventory="gold" /> },
  
  { item: <Wood amount={1} inventory="wood" /> },
  { item: <Wood amount={2} inventory="wood" /> },
  { item: <Wood amount={5} inventory="wood" /> },
  
  { terrain: <Rock />, item: <Iron amount={1} inventory="iron" /> },
  { terrain: <Rock />, item: <Iron amount={2} inventory="iron" /> },
  { terrain: <Rock />, item: <Iron amount={5} inventory="iron" /> },

  { terrain: <Rock direction="up" /> },
  { terrain: <Rock direction="right" /> },
  { terrain: <Rock direction="down" /> },
  { terrain: <Rock direction="left" /> },
  { terrain: <Rock /> },
  { terrain: <Rock /> },
  { terrain: <Rock /> },
  { terrain: <Rock /> },

  { terrain: <Tree /> },
  { terrain: <Tree /> },
  { terrain: <Tree /> },
  { terrain: <Tree /> },
  { terrain: <DeepWater /> },

  { ground: <Path /> },
  { ground: <Sand /> },
  { ground: <ShallowWater /> },
  { ground: <Ice /> },

  { sprites: [<Flower />] },
  { sprites: [<Flower />], item: <Mana amount={1} inventory="mana" /> },
  { sprites: [<Flower />], item: <Mana amount={2} inventory="mana" /> },
  { sprites: [<Flower />], item: <Mana amount={5} inventory="mana" /> },

  { sprites: [<Bush />] },
  { sprites: [<Bush />], item: <Food amount={1} inventory="food" /> },
  { sprites: [<Bush />], item: <Food amount={2} inventory="food" /> },
  { sprites: [<Bush />], item: <Food amount={5} inventory="food" /> },
  { sprites: [<Campfire />] },
  { sprites: [<Campfire />], particles: [<Burning />] },
];