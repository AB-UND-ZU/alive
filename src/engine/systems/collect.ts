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
import { INVENTORY } from "../components/inventory";
import { isDead } from "./damage";

export const getLootable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (entity) =>
      LOOTABLE in entity && INVENTORY in entity && !isEmpty(world, entity)
  ) as Entity;

export const isEmpty = (world: World, entity: Entity) =>
  !(INVENTORY in entity) ||
  !(LOOTABLE in entity) ||
  Object.values(entity[INVENTORY]).filter(Boolean).length === 0;

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

      if (!targetEntity) continue;

      // handle pick up
      const targetSlot = Object.keys(targetEntity[INVENTORY])[0];

      if (!targetSlot) continue;

      const existingId = entity[INVENTORY][targetSlot];
      const targetItem = world.getEntityById(
        targetEntity[INVENTORY][targetSlot]
      );
      // add existing render count if item is replaced
      if (existingId) {
        const existingItem = world.getEntityById(existingId);
        targetItem[RENDERABLE].generation +=
          existingItem[RENDERABLE].generation;
      }

      entity[INVENTORY][targetSlot] = targetEntity[INVENTORY][targetSlot];
      targetEntity[INVENTORY][targetSlot] = undefined;

      // mark as interacted
      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
