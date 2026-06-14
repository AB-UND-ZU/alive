import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { getCell } from "./map";
import { Orientation, orientationPoints } from "../components/orientable";
import { rerenderEntity } from "./renderer";
import { PUSHABLE } from "../components/pushable";
import { DISPLACABLE } from "../components/displacable";
import { isControllable, isFrozen } from "./freeze";
import { isDead } from "./damage";
import { MOUNTABLE } from "../components/mountable";
import { isWalkable } from "./movement";

export const isDisplacable = (world: World, entity: Entity) =>
  DISPLACABLE in entity && !isFrozen(world, entity) && !isDead(world, entity);

export const getDisplacable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isDisplacable(world, entity)
  ) as Entity | undefined;

export const pushEntity = (
  world: World,
  entity: Entity,
  orientation: Orientation
) => {
  const targetReference = world.assertByIdAndComponents(
    entity[MOVABLE].reference,
    [REFERENCE]
  );

  if (!orientation) return;

  entity[MOVABLE].orientations = [orientation];

  if (targetReference === world.metadata.gameEntity) return;

  targetReference[REFERENCE].delta = targetReference[REFERENCE].tick;
  targetReference[REFERENCE].suspended = false;
  targetReference[REFERENCE].suspensionCounter = -1;
  rerenderEntity(world, targetReference);
};

export default function setupPush(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // stop sliding boxes or drifting boats
    for (const entity of world.getEntities([POSITION, MOVABLE, DISPLACABLE])) {
      if (entity[MOVABLE].momentum || entity[MOUNTABLE]?.passenger) continue;

      const targetReference = world.assertByIdAndComponents(
        entity[MOVABLE].reference,
        [REFERENCE]
      );

      if (targetReference === world.metadata.gameEntity) return;

      entity[MOVABLE].orientations = [];
      targetReference[REFERENCE].suspensionCounter = 0;
    }

    // handle player pushing displacable entities
    for (const entity of world.getEntities([POSITION, MOVABLE, PUSHABLE])) {
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

      // skip if unable to interact
      if (!isControllable(world, entity)) continue;

      const targetOrientation: Orientation | null =
        entity[MOVABLE].momentum ||
        entity[MOVABLE].orientations[0] ||
        entity[MOVABLE].pendingOrientation;

      if (!targetOrientation) continue;

      const delta = orientationPoints[targetOrientation];
      const targetPosition = add(entity[POSITION], delta);
      const targetEntity = getDisplacable(world, targetPosition);

      if (
        !targetEntity ||
        !isWalkable(world, targetEntity[POSITION], targetEntity)
      )
        continue;

      pushEntity(world, targetEntity, targetOrientation);

      // prevent attacking boxes but allow movements
      entity[MOVABLE].momentum = targetOrientation;
      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
