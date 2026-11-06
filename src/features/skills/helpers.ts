import { Entity } from "ecs";

import { World } from "../../engine";
import { Item, ITEM } from "../../engine/components/item";
import { INVENTORY } from "../../engine/components/inventory";
import { LOOTABLE } from "../../engine/components/lootable";
import { Position, POSITION } from "../../engine/components/position";
import { ORIENTABLE } from "../../engine/components/orientable";
import { PLAYER } from "../../engine/components/player";
import { PROJECTILE } from "../../engine/components/projectile";

import { STATS } from "../../engine/components/stats";
import { TypedEntity } from "../../engine/entities";
import { getVerticalIndex, isInPopup } from "../../engine/systems/popup";

import {
  advanceUntil,
  AreaWorldOptions,
  assertHero,
  createAreaWorld,
  findEntityAt,
  findInArea,
  getEntitiesAt,
  giveItems,
  GivenItem,
  act,
} from "../../testing/harness";

/** Create an area with a sturdy hero carrying the given items. */
export const setupHero = (
  area: string,
  items: GivenItem[] = [],
  options: AreaWorldOptions = {}
) => {
  const world = createAreaWorld(area, options);
  const hero = assertHero(world) as TypedEntity<
    | "ACTIONABLE"
    | "CONDITIONABLE"
    | "EQUIPPABLE"
    | "INVENTORY"
    | "MOVABLE"
    | "ORIENTABLE"
    | "PLAYER"
    | "POSITION"
    | "STATS"
  >;
  hero[STATS].maxHp = 20;
  hero[STATS].hp = 20;
  giveItems(world, hero, items);

  return { world, hero };
};

/** Unit with stats placed at a marked position of the area. */
export const getUnit = (world: World, area: string, char: string) => {
  const unit = findEntityAt(world, findInArea(area, char), [STATS]);
  if (!unit) throw new Error(`No unit at "${char}"`);
  return unit as TypedEntity<
    "ORIENTABLE" | "POSITION" | "RECHARGABLE" | "SHOOTABLE" | "STATS"
  >;
};

export const getProjectiles = (world: World) =>
  world.getEntities([ORIENTABLE, POSITION, PROJECTILE]);

const sumLoot = (world: World, containers: Entity[], match: Partial<Item>) =>
  containers
    .filter((entity) => LOOTABLE in entity && INVENTORY in entity)
    .flatMap((entity) =>
      (entity[INVENTORY].items as number[]).map(
        (itemId) => world.assertByIdAndComponents(itemId, [ITEM])[ITEM]
      )
    )
    .filter((item) =>
      (Object.keys(match) as (keyof Item)[]).every(
        (key) => item[key] === match[key]
      )
    )
    .reduce((total, item) => total + item.amount, 0);

/** Total amount of matching items lying on the ground at a position. */
export const countLoot = (
  world: World,
  position: Position,
  match: Partial<Item>
) => sumLoot(world, getEntitiesAt(world, position), match);

/** Total amount of matching items lying anywhere on the ground. */
export const countAllLoot = (world: World, match: Partial<Item>) =>
  sumLoot(world, world.getEntities([LOOTABLE, INVENTORY, POSITION]), match);

/** Select the equipment at `index` in the equip menu (Q). */
export const equipFromMenu = (world: World, index: number) => {
  const hero = world.assertComponents(assertHero(world), [PLAYER]);
  act(world, "equip");
  advanceUntil(world, () => !!isInPopup(world, hero), 1000);
  const menu = world.assertById(hero[PLAYER].popup!);

  while (getVerticalIndex(world, menu) !== index) {
    act(world, getVerticalIndex(world, menu) < index ? "down" : "up");
  }

  act(world, "right");
  advanceUntil(world, () => !isInPopup(world, hero), 1000);
};
