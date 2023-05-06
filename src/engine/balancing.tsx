import { Armor, Circle, Creature, Entity, Equipment, Experience, Gold, Item, Life, Mana, Material, Player, Spell, Stub, Sword, Terrain, Triangle, Wood } from "./entities";
import { getDeterministicRandomInt } from "./utils";

export type Distribution<T extends Entity, O extends string = 'id'> = {
  percentage: number,
  entity: T,
  props: Omit<React.ComponentProps<T>, O>,
};

export type CreatureStats = {
  hp: number,
  dmg: number,
  drops: Distribution<Item>[],
};

export const creatureStats = new Map<Creature, CreatureStats>([
  [Player, { hp: 10, dmg: 0, drops: [] }],
  [Triangle, { hp: 3, dmg: 3, drops: [
    { percentage: 10, entity: Life, props: { amount: 1 } },
    { percentage: 60, entity: Mana, props: { amount: 1 } },
    { percentage: 20, entity: Gold, props: { amount: 1 } },
    { percentage: 10, entity: Experience, props: { amount: 1 } },
  ] }],
  [Circle, { hp: 1, dmg: 3, drops: [
    { percentage: 60, entity: Life, props: { amount: 1 } },
    { percentage: 10, entity: Mana, props: { amount: 1 } },
    { percentage: 20, entity: Gold, props: { amount: 1 } },
    { percentage: 10, entity: Experience, props: { amount: 1 } },
  ] }],
]);

export const creatureSpawns: Distribution<Creature, 'id' | 'amount' | 'maximum'>[] = [
  { percentage: 50, entity: Triangle, props: { orientation: 'up', particles: [], equipments: [] } },
  { percentage: 50, entity: Circle, props: { orientation: 'up', particles: [], equipments: [] } },
];

export type EquipmentStats = Partial<Record<Material, number>>;

export const equipmentStats = new Map<Equipment, EquipmentStats[]>([
  [Sword, [{ wood: 1, iron: 2 }]],
  [Armor, [{ wood: 1, iron: 2 }]],
  [Spell, [{ ice: 5, fire: 5, plant: 15 }, { ice: 13, fire: 13, plant: 25 }]],
]);

export type TerrainStats = {
  drops: Distribution<Item>[],
}

export const terrainStats = new Map<Terrain, TerrainStats>([
  [Stub, { drops: [
    { percentage: 5, entity: Wood, props: { amount: 1 } }
  ] }],
]);

export const getRandomDistribution = <T extends Entity, O extends string>(distributions: Distribution<T, O>[]) => {
  const random = getDeterministicRandomInt(1, 100);

  let skipped = 0;
  for (let distribution of distributions) {
    skipped += distribution.percentage;

    if (random <= skipped) {
      return [distribution.entity, distribution.props] as const;
    } 
  }

  return [undefined, undefined] as const;
};
