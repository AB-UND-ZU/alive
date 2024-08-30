import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { MOVABLE } from "../components/movable";
import { World } from "../ecs";
import { REFERENCE } from "../components/reference";
import { getCell, registerEntity, unregisterEntity } from "./map";
import { COLLIDABLE } from "../components/collidable";
import { Entity } from "ecs";
import { rerenderEntity } from "./renderer";
import { isWalkable } from "./immersion";
import { add } from "../../game/math/std";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";
import { isDead } from "./damage";

export const isCollision = (world: World, position: Position) =>
  Object.values(getCell(world, position)).some(
    (entity) => COLLIDABLE in (entity as Entity)
  );

export default function setupMovement(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    for (const entity of world.getEntities([POSITION, MOVABLE, RENDERABLE])) {
      const entityId = world.getEntityId(entity);
      const entityReference = world.getEntityById(entity[MOVABLE].reference)[
        RENDERABLE
      ].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      const pendingOrientation = entity[MOVABLE].pendingOrientation;
      entity[MOVABLE].pendingOrientation = null;

      // skip if dead
      if (isDead(world, entity)) continue;

      const attemptedOrientations: Orientation[] = [
        ...entity[MOVABLE].orientations,
      ];

      if (pendingOrientation) {
        attemptedOrientations.unshift(pendingOrientation);
      }

      // skip if no attempted movement
      if (attemptedOrientations.length === 0) continue;

      // set facing regardless of movement
      if (entity[ORIENTABLE])
        entity[ORIENTABLE].facing = attemptedOrientations[0];

      // skip if already interacted
      if (entity[MOVABLE].lastInteraction === entityReference) continue;

      for (const orientation of attemptedOrientations) {
        const delta = orientationPoints[orientation];
        const position = add(entity[POSITION], delta);

        if (!isCollision(world, position) && isWalkable(world, position)) {
          unregisterEntity(world, entity);

          entity[POSITION].x = position.x;
          entity[POSITION].y = position.y;

          // set facing to actual movement
          if (entity[ORIENTABLE]) entity[ORIENTABLE].facing = orientation;

          registerEntity(world, entity);
          rerenderEntity(world, entity);
          break;
        }
      }

      // mark as interacted
      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
