import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add } from "../../game/math/std";
import { isProcessable, REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { getCell } from "./map";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";
import { isDead } from "./damage";
import { rerenderEntity } from "./renderer";
import { PUSHABLE } from "../components/pushable";
import { DISPLACABLE } from "../components/displacable";
import { relativeOrientations } from "../../game/math/path";

export const isDisplacable = (world: World, entity: Entity) =>
  DISPLACABLE in entity;

export const getDisplacable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isDisplacable(world, entity)
  ) as Entity | undefined;

export const pushEntity = (world: World, entity: Entity, target: Entity) => {
  const orientation = relativeOrientations(
    world,
    entity[POSITION],
    target[POSITION]
  )[0];
  const targetReference = world.assertByIdAndComponents(target[MOVABLE].reference, [REFERENCE]);

  if (!orientation || !isProcessable(targetReference[REFERENCE])) return;
  

  target[MOVABLE].orientations = [orientation];
  targetReference[REFERENCE].delta = 0;
  targetReference[REFERENCE].suspended = false;
  targetReference[REFERENCE].suspensionCounter = 0;
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

    // handle player running into spikes
    for (const entity of world.getEntities([
      POSITION,
      MOVABLE,
      ORIENTABLE,
      PUSHABLE,
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
      const targetEntity = getDisplacable(world, targetPosition);

      if (!targetEntity) continue;

      pushEntity(world, entity, targetEntity);
    }
  };

  return { onUpdate };
}
