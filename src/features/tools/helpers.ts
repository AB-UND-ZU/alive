import { World } from "../../engine";
import { ACTIONABLE } from "../../engine/components/actionable";
import { CONDITIONABLE } from "../../engine/components/conditionable";
import { HARVESTABLE } from "../../engine/components/harvestable";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { PLAYER } from "../../engine/components/player";
import { MOVABLE } from "../../engine/components/movable";
import { ORIENTABLE, Orientation } from "../../engine/components/orientable";
import { POSITION, Position } from "../../engine/components/position";
import { LOOTABLE } from "../../engine/components/lootable";
import { relativeOrientations } from "../../game/math/path";
import { TypedEntity } from "../../engine/entities";
import { getLootable } from "../../engine/systems/collect";
import {
  advanceUntil,
  assertHero,
  createAreaWorld,
  findEntityAt,
  GivenItem,
  giveItems,
  holdMove,
  step,
} from "../../testing/harness";

/** Small world with a hero carrying the given items. */
export const setupTools = (
  area: string,
  items: GivenItem[],
  legend?: Record<string, string>
) => {
  const world = createAreaWorld(area, { legend });
  const hero = world.assertComponents(assertHero(world), [
    ACTIONABLE,
    CONDITIONABLE,
    INVENTORY,
    MOVABLE,
    ORIENTABLE,
    PLAYER,
    POSITION,
  ]);
  giveItems(world, hero, items);
  step(world, 1);
  return { world, hero };
};

export const getResource = (world: World, position: Position) =>
  findEntityAt(world, position, [HARVESTABLE]);

/** Hold a direction until a condition holds, then release. */
export const holdUntil = (
  world: World,
  orientation: Orientation,
  predicate: () => boolean,
  timeout = 3000
) => {
  holdMove(world, [orientation]);
  const frames = advanceUntil(world, predicate, timeout);
  holdMove(world, []);
  return frames;
};

/** Keep working towards a resource and count the hits until it is depleted. */
export const workUntilDepleted = (
  world: World,
  orientation: Orientation,
  resource: TypedEntity<"HARVESTABLE">
) => {
  let hits = 0;
  holdMove(world, [orientation]);
  while (resource[HARVESTABLE].amount > 0) {
    const amount = resource[HARVESTABLE].amount;
    advanceUntil(world, () => resource[HARVESTABLE].amount < amount, 2000);
    hits += 1;
  }
  holdMove(world, []);
  return hits;
};

/** Bump into the loot at a position until it has been picked up. */
export const collectLoot = (
  world: World,
  orientation: Orientation,
  position: Position
) => {
  advanceUntil(world, () => !!getLootable(world, position), 3000);
  holdUntil(world, orientation, () => !getLootable(world, position));
  step(world, 30);
};

export const getLootItems = (world: World, position: Position) => {
  const lootable = getLootable(world, position);
  return ((lootable?.[INVENTORY].items || []) as number[]).map((itemId) => {
    const { carrier, bound, ...item } = world.assertByIdAndComponents(itemId, [
      ITEM,
    ])[ITEM];
    return item;
  });
};

/** Position of the only loot lying around, e.g. after digging below the hero. */
export const findLoot = (world: World) => {
  const loot = world
    .getEntities([LOOTABLE, INVENTORY, POSITION])
    .filter((entity) => entity[INVENTORY].items.length > 0);
  if (loot.length !== 1) throw new Error(`Found ${loot.length} loot entities`);
  return loot[0][POSITION];
};

/** Pick up the only loot next to the hero. */
export const collectAdjacentLoot = (world: World) => {
  const hero = assertHero(world);
  const position = findLoot(world);
  const [orientation] = relativeOrientations(world, hero[POSITION], position);
  collectLoot(world, orientation, position);
};
