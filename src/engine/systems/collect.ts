import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { getCell } from "./map";
import { Orientation, orientationPoints } from "../components/orientable";
import { LOOTABLE } from "../components/lootable";
import { PLAYER } from "../components/player";
import { isDead } from "./damage";
import { EQUIPPABLE } from "../components/equippable";
import { INVENTORY } from "../components/inventory";
import { ITEM } from "../components/item";
import { COUNTABLE } from "../components/countable";
import { getAnimations } from "./animate";
import { getEntityGeneration, rerenderEntity } from "./renderer";

export const getLootable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (entity) =>
      LOOTABLE in entity && INVENTORY in entity && !isEmpty(world, entity)
  ) as Entity;

export const isEmpty = (world: World, entity: Entity) =>
  !(INVENTORY in entity) ||
  !(LOOTABLE in entity) ||
  entity[INVENTORY].items.length === 0;

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
      MOVABLE,
      PLAYER,
      EQUIPPABLE,
      INVENTORY,
      COUNTABLE,
      RENDERABLE,
    ])) {
      const entityId = world.getEntityId(entity);
      const entityReference = world.getEntityById(entity[MOVABLE].reference)[
        RENDERABLE
      ].generation;

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

      if (!targetEntity || !targetEntity[LOOTABLE].accessible) continue;

      // handle pick up
      const itemId = targetEntity[INVENTORY].items[0];

      if (!itemId) continue;

      // initiate collecting animation
      targetEntity[LOOTABLE].target = entityId;
      const itemEntity = world.getEntityById(itemId);
      itemEntity[ITEM].carrier = entityId;

      // mark as interacted
      entity[MOVABLE].lastInteraction = entityReference;
    }

    // handle items being received
    for (const entity of world.getEntities([
      POSITION,
      MOVABLE,
      LOOTABLE,
      INVENTORY,
      COUNTABLE,
      RENDERABLE,
    ])) {
      const entityId = world.getEntityId(entity);
      const entityReference = getEntityGeneration(world, entity);

      // skip if entity hasn't had any changes
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      const targetId = entity[INVENTORY].items[0];

      // wait until target is set and animation is finished
      if (
        !targetId ||
        !entity[LOOTABLE].target ||
        getAnimations(world, entity).length > 0
      )
        continue;

      const targetItem = world.getEntityById(targetId);
      const targetSlot = targetItem[ITEM].slot;
      const targetCounter = targetItem[ITEM].counter;
      const recevingEntity = world.getEntityById(entity[LOOTABLE].target);

      if (targetSlot) {
        const existingId = recevingEntity[EQUIPPABLE][targetSlot];

        // add existing render count if item is replaced
        if (existingId) {
          const existingItem = world.getEntityById(existingId);
          targetItem[RENDERABLE].generation += getEntityGeneration(
            world,
            existingItem
          );

          // TODO: handle dropping existing item instead
          world.removeEntity(existingId);
        }

        recevingEntity[EQUIPPABLE][targetSlot] = targetId;
        recevingEntity[INVENTORY].items.push(targetId);
      } else if (targetCounter) {
        recevingEntity[COUNTABLE][targetCounter] += targetItem[ITEM].amount;
      }

      entity[INVENTORY].items.splice(
        entity[INVENTORY].items.indexOf(targetId),
        1
      );

      // rerender target
      rerenderEntity(world, recevingEntity);
    }
  };

  return { onUpdate };
}
