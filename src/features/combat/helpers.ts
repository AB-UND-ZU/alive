import {
  advanceUntil,
  assertHero,
  createAreaWorld,
  findEntityAt,
  findInArea,
  holdMove,
} from "../../testing/harness";
import { World } from "../../engine";
import { TypedEntity } from "../../engine/entities";
import { STATS } from "../../engine/components/stats";
import { PLAYER } from "../../engine/components/player";
import { INVENTORY } from "../../engine/components/inventory";
import { AFFECTABLE } from "../../engine/components/affectable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { BEHAVIOUR } from "../../engine/components/behaviour";
import { Item, ITEM } from "../../engine/components/item";
import { LOOTABLE } from "../../engine/components/lootable";
import { Position, POSITION } from "../../engine/components/position";
import { Orientation } from "../../engine/components/orientable";

/** Create an area world with a hero that survives a few hits. */
export const createCombatWorld = (
  area: string,
  legend: Record<string, string> = {},
  hp = 10
) => {
  const world = createAreaWorld(area, { legend });
  const hero = world.assertComponents(assertHero(world), [
    AFFECTABLE,
    EQUIPPABLE,
    INVENTORY,
    PLAYER,
    POSITION,
    STATS,
  ]);
  hero[STATS].maxHp = hp;
  hero[STATS].hp = hp;

  return { world, hero };
};

/** The unit placed at `char` in an area, without AI if `idle`. */
export const getUnit = (
  world: World,
  area: string,
  char: string,
  idle = true
) => {
  const unit = findEntityAt(world, findInArea(area, char), [
    POSITION,
    STATS,
  ]) as TypedEntity<"POSITION" | "STATS"> | undefined;
  if (!unit) throw new Error(`No unit at "${char}"`);

  if (idle && unit[BEHAVIOUR]) {
    world.removeComponentFromEntity(
      unit as TypedEntity<"BEHAVIOUR">,
      BEHAVIOUR,
      false
    );
  }

  return unit;
};

/** Hold a direction until `predicate` holds, then release. */
export const attackUntil = (
  world: World,
  orientation: Orientation,
  predicate: () => boolean,
  timeout?: number
) => {
  holdMove(world, [orientation]);
  const frames = advanceUntil(world, predicate, timeout);
  holdMove(world, []);
  return frames;
};

export type Drop = { item: Item; position: Position };

/** All items lying around in loot containers. */
export const getDrops = (world: World): Drop[] =>
  world.getEntities([ITEM]).flatMap((itemEntity) => {
    const container = world.getEntityByIdAndComponents(
      itemEntity[ITEM].carrier,
      [LOOTABLE, POSITION]
    );
    return container
      ? [{ item: itemEntity[ITEM], position: container[POSITION] }]
      : [];
  });

/** Item data of an entity's inventory without carrier references. */
export const getLoot = (world: World, entity: TypedEntity) =>
  ((entity[INVENTORY]?.items || []) as number[]).map((itemId) => {
    const { carrier, ...item } = world.assertByIdAndComponents(itemId, [ITEM])[
      ITEM
    ];
    return item;
  });
