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
import { isDead } from "./loot";
import { getAttackable, isFriendlyFire } from "./damage";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";

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

      // skip if dead
      if (isDead(world, entity)) continue;

      const attemptedOrientations: Orientation[] = [
        ...entity[MOVABLE].orientations,
      ];
      const pendingOrientation = entity[MOVABLE].pendingOrientation;

      if (pendingOrientation) {
        attemptedOrientations.unshift(pendingOrientation);
      }

      // skip if no attempted movement
      if (attemptedOrientations.length === 0) continue;

      for (const orientation of attemptedOrientations) {
        const delta = orientationPoints[orientation];
        const position = add(entity[POSITION], delta);

        // don't move if attacked earlier
        const attackable = getAttackable(world, position);
        if (attackable && !isFriendlyFire(world, entity, attackable)) break;

        if (!isCollision(world, position) && isWalkable(world, position)) {
          unregisterEntity(world, entity);

          entity[POSITION].x = position.x;
          entity[POSITION].y = position.y;

          if (entity[ORIENTABLE]) entity[ORIENTABLE].facing = orientation;

          registerEntity(world, entity);
          rerenderEntity(world, entity);
          break;
        }
      }

      entity[MOVABLE].pendingOrientation = null;
    }
  };

  return { onUpdate };
}
