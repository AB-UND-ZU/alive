import { Armor, Circle, Creature, Entity, Equipment, Experience, Gold, Item, Life, Mana, Material, Player, Sword, Triangle } from "./entities";
import { getDeterministicRandomInt } from "./utils";

export type Distribution<T extends Entity> = {
  ratio: number,
  entity: T,
  props: Omit<React.ComponentProps<T>, 'id'>,
};

export type CreatureStats = {
  hp: number,
  dmg: number,
  drops: Distribution<Item>[],
};

export const creatureStats = new Map<Creature, CreatureStats>([
  [Player, { hp: 10, dmg: 0, drops: [] }],
  [Triangle, { hp: 4, dmg: 3, drops: [
    { ratio: 40, entity: Life, props: { amount: 1 } },
    { ratio: 30, entity: Mana, props: { amount: 1 } },
    { ratio: 20, entity: Gold, props: { amount: 1 } },
    { ratio: 10, entity: Experience, props: { amount: 1 } },
  ] }],
  [Circle, { hp: 1, dmg: 3, drops: [
    { ratio: 40, entity: Life, props: { amount: 1 } },
    { ratio: 30, entity: Mana, props: { amount: 1 } },
    { ratio: 20, entity: Gold, props: { amount: 1 } },
    { ratio: 10, entity: Experience, props: { amount: 1 } },
  ] }],
]);

export const creatureSpawns: Distribution<Creature>[] = [
  { ratio: 50, entity: Triangle, props: { amount: 4, maximum: 4, orientation: 'up', particles: [], equipments: [] } },
  { ratio: 50, entity: Circle, props: { amount: 1, maximum: 1, orientation: 'up', particles: [], equipments: [] } },
];

export type EquipmentStats = Partial<Record<Material, number>>;

export const equipmentStats = new Map<Equipment, EquipmentStats>([
  [Sword, { wood: 1, iron: 2 }],
  [Armor, { wood: 1, iron: 2 }],
]);

export const getRandomDistribution = <T extends Entity>(distributions: Distribution<T>[]) => {
  const total = distributions.reduce((total, distribution) => total + distribution.ratio, 0);
  const random = getDeterministicRandomInt(1, total);

  let skipped = 0;
  let selected = distributions[0];
  for (let distribution of distributions) {
    skipped += distribution.ratio;

    if (random <= skipped) {
      selected = distribution;
      break;
    } 
  }

  return [selected.entity, selected.props] as const;
};
