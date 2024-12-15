import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { getCell, updateWalkable } from "./map";
import { Orientation, orientationPoints } from "../components/orientable";
import { LOOTABLE } from "../components/lootable";
import { isDead } from "./damage";
import { EQUIPPABLE } from "../components/equippable";
import { INVENTORY } from "../components/inventory";
import { Item, ITEM, STACK_SIZE } from "../components/item";
import { rerenderEntity } from "./renderer";
import { isTradable } from "./action";
import { removeFromInventory } from "./trigger";
import { COLLECTABLE } from "../components/collectable";
import { getMaxCounter } from "../../game/assets/sprites";
import { createSequence, getSequence } from "./sequence";
import { CollectSequence } from "../components/sequencable";
import { STATS } from "../components/stats";

export const isLootable = (world: World, entity: Entity) =>
  LOOTABLE in entity &&
  INVENTORY in entity &&
  entity[INVENTORY].items.length > 0 &&
  !isTradable(world, entity);

export const getLootable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isLootable(world, entity)
  ) as Entity | undefined;

export const isCollecting = (world: World, entity: Entity) =>
  LOOTABLE in entity &&
  INVENTORY in entity &&
  getSequence(world, entity, "collect");

export const getCollecting = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isCollecting(world, entity)
  ) as Entity | undefined;

export const getStackable = (world: World, entity: Entity, item: Item) => {
  const stackId = entity[INVENTORY].items.find((itemId: number) => {
    const inventoryItem = world.assertByIdAndComponents(itemId, [ITEM]);
    return (
      inventoryItem[ITEM].stackable === item.stackable &&
      inventoryItem[ITEM].material === item.material &&
      inventoryItem[ITEM].amount < STACK_SIZE
    );
  });

  return world.getEntityByIdAndComponents(stackId, [ITEM]);
};

export const isEmpty = (world: World, entity: Entity) =>
  INVENTORY in entity &&
  LOOTABLE in entity &&
  entity[INVENTORY].items.length === 0 &&
  !isCollecting(world, entity);

export const isFull = (world: World, entity: Entity) =>
  INVENTORY in entity &&
  entity[INVENTORY].items.length >= entity[INVENTORY].size;

export const collectItem = (
  world: World,
  entity: Entity,
  target: Entity,
  fullStack = false
) => {
  // handle pick up
  for (
    let itemIndex = target[INVENTORY].items.length - 1;
    itemIndex >= 0;
    itemIndex -= 1
  ) {
    const itemId = target[INVENTORY].items[itemIndex];
    const itemEntity = world.assertByIdAndComponents(itemId, [ITEM]);

    // reduce counter items
    const stat = itemEntity[ITEM].stat;
    const equipment = itemEntity[ITEM].equipment;
    const consume = itemEntity[ITEM].consume;
    const stackable = itemEntity[ITEM].stackable;

    if (stat) {
      // skip if counter exceeded
      const maxCounter = getMaxCounter(stat);
      if (
        entity[STATS][stat] >= 99 ||
        (maxCounter !== stat &&
          entity[STATS][stat] === entity[STATS][maxCounter])
      )
        continue;

      itemEntity[ITEM].amount -= 1;
    } else if (
      (equipment || (stackable && fullStack)) &&
      isFull(world, entity)
    ) {
      // skip if inventory full
      continue;
    } else if (stackable && !fullStack) {
      // skip if no more space to stack
      if (
        isFull(world, entity) &&
        !getStackable(world, entity, itemEntity[ITEM])
      ) {
        continue;
      } else {
        itemEntity[ITEM].amount -= 1;
      }
    }

    // remove from target inventory
    if (
      equipment ||
      consume ||
      ((stat || stackable) && itemEntity[ITEM].amount === 0) ||
      (stackable && fullStack)
    ) {
      removeFromInventory(world, target, itemEntity);
    }

    // assign new carrier on discrete items
    if (!stat && (!stackable || fullStack)) {
      itemEntity[ITEM].carrier = world.getEntityId(entity);
    }

    // initiate collecting animation on player
    createSequence<"collect", CollectSequence>(
      world,
      entity,
      "collect",
      "itemCollect",
      { origin: target[POSITION], itemId, fullStack }
    );

    // update walkable
    updateWalkable(world, target[POSITION]);

    rerenderEntity(world, target);
    break;
  }
};

export default function setupCollect(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // handle player collecting
    for (const entity of world.getEntities([
      POSITION,
      COLLECTABLE,
      MOVABLE,
      EQUIPPABLE,
      INVENTORY,
      STATS,
      RENDERABLE,
    ])) {
      const entityId = world.getEntityId(entity);
      const entityReference = world.assertByIdAndComponents(
        entity[MOVABLE].reference,
        [RENDERABLE]
      )[RENDERABLE].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      // skip if entity already interacted
      if (entity[MOVABLE].lastInteraction === entityReference) continue;

      // skip if dead
      if (isDead(world, entity)) continue;

      const targetOrientation: Orientation | null =
        entity[MOVABLE].pendingOrientation || entity[MOVABLE].orientations[0];

      if (!targetOrientation) continue;

      const delta = orientationPoints[targetOrientation];
      const targetPosition = add(entity[POSITION], delta);
      const targetEntity = getLootable(world, targetPosition);

      if (!targetEntity) continue;

      collectItem(world, entity, targetEntity);

      // mark as interacted
      entity[MOVABLE].pendingOrientation = undefined;
      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
