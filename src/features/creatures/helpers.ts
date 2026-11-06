import { World } from "../../engine";
import { NPC, NpcType } from "../../engine/components/npc";
import { POSITION, Position } from "../../engine/components/position";
import { REFERENCE } from "../../engine/components/reference";
import { RENDERABLE } from "../../engine/components/renderable";
import { STATS } from "../../engine/components/stats";
import { TypedEntity } from "../../engine/entities";
import { LEVEL } from "../../engine/components/level";
import { getDistance } from "../../game/math/std";
import {
  advanceUntil,
  assertHero,
  AreaWorldOptions,
  createAreaWorld,
  giveItems,
  holdMove,
} from "../../testing/harness";
import { isDead } from "../../engine/systems/damage";
import { Orientation } from "../../engine/components/orientable";
import { LOOTABLE } from "../../engine/components/lootable";
import { INVENTORY } from "../../engine/components/inventory";
import { Item, ITEM } from "../../engine/components/item";
import { moveEntity } from "../../engine/systems/map";
import { CASTABLE } from "../../engine/components/castable";
import { SEQUENCABLE } from "../../engine/components/sequencable";

/** Duration of one AI decision, i.e. one tick of the world reference frame. */
export const getTick = (world: World) =>
  world.metadata.gameEntity[REFERENCE].tick as number;

export const getGeneration = (world: World) =>
  world.metadata.gameEntity[RENDERABLE].generation as number;

/** Advance by a number of world ticks. */
export const advanceTicks = (world: World, ticks: number) => {
  const target = getGeneration(world) + ticks;
  advanceUntil(
    world,
    () => getGeneration(world) >= target,
    (ticks + 2) * getTick(world)
  );
};

/** Area world on a larger map, so creatures don't sense the hero across the wrapping edge. */
export const createCreatureWorld = (
  area: string,
  legend: AreaWorldOptions["legend"] = {},
  options: Omit<AreaWorldOptions, "legend"> = {}
) => {
  const world = createAreaWorld(area, { size: 40, ...options, legend });
  const hero = world.assertComponents(assertHero(world), [
    STATS,
    POSITION,
    INVENTORY,
  ]);
  return { world, hero };
};

/** All living or dead NPC entities of a type. */
export const getCreatures = (world: World, type: NpcType) =>
  world
    .getEntities([NPC, POSITION])
    .filter((entity) => entity[NPC].type === type) as TypedEntity<
    | "NPC"
    | "POSITION"
    | "STATS"
    | "BEHAVIOUR"
    | "MOVABLE"
    | "ORIENTABLE"
    | "TOOLTIP"
    | "BELONGABLE"
    | "INVENTORY"
    | "FOG"
  >[];

export const getCreature = (world: World, type: NpcType) => {
  const creature = getCreatures(world, type)[0];
  if (!creature) throw new Error(`No ${type} found`);
  return creature;
};

export const distanceBetween = (world: World, from: Position, to: Position) =>
  getDistance(from, to, world.metadata.gameEntity[LEVEL].size, 1, false);

export const giveSword = (
  world: World,
  hero: ReturnType<typeof createCreatureWorld>["hero"]
) => giveItems(world, hero, [{ weapon: "sword", material: "iron", amount: 2 }]);

/** Hold a direction towards a target until it dies. */
export const attackUntilDead = (
  world: World,
  target: TypedEntity,
  orientation: Orientation,
  timeout = 20000
) => {
  holdMove(world, [orientation]);
  advanceUntil(world, () => isDead(world, target), timeout);
  holdMove(world, []);
};

/** Record a value once per world tick for a number of ticks. */
export const trace = <T>(world: World, ticks: number, read: () => T) => {
  const values: T[] = [read()];
  for (let tick = 0; tick < ticks; tick += 1) {
    advanceTicks(world, 1);
    values.push(read());
  }
  return values;
};

/** Active spells cast by an entity. */
export const getSpells = (world: World, caster: TypedEntity) =>
  world
    .getEntities([CASTABLE, SEQUENCABLE])
    .filter(
      (spell) =>
        spell[CASTABLE].caster === world.getEntityId(caster) &&
        spell[SEQUENCABLE].states.spell
    );

/** Items lying on the ground, e.g. drops of a defeated creature. */
export const getDrops = (world: World) =>
  world
    .getEntities([LOOTABLE, INVENTORY])
    .flatMap((loot) =>
      loot[INVENTORY].items.map(
        (itemId: number) => world.assertByIdAndComponents(itemId, [ITEM])[ITEM]
      )
    ) as Item[];

export const countDrops = (world: World, match: Partial<Item>) =>
  getDrops(world)
    .filter((item) =>
      (Object.keys(match) as (keyof Item)[]).every(
        (key) => item[key] === match[key]
      )
    )
    .reduce((total, item) => total + item.amount, 0);

/** Place an entity elsewhere, e.g. to move the hero out of sight at once. */
export const teleport = (
  world: World,
  entity: TypedEntity,
  position: Position
) => moveEntity(world, entity, position);

/** Make the hero survive longer fights. */
export const toughen = (
  hero: ReturnType<typeof createCreatureWorld>["hero"],
  hp = 99
) => {
  hero[STATS].maxHp = hp;
  hero[STATS].hp = hp;
};
