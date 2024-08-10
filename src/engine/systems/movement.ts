import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { MOVABLE, Orientation, orientationPoints } from "../components/movable";
import { World } from "../ecs";
import { isProcessable, REFERENCE } from "../components/reference";
import { registerEntity, unregisterEntity } from "./map";
import { COLLIDABLE } from "../components/collidable";

const isCollision = (world: World, position: Position) =>
  Object.values(world.metadata.map[position.x]?.[position.y] || {}).some(
    (cell) => COLLIDABLE in cell
  );

export default function setupMovement(world: World) {
  const onUpdate = (delta: number) => {
    // add delta to reference frames
    for (const entity of world.getEntities([REFERENCE])) {
      const reference = entity[REFERENCE];

      // skip if suspended reference has passed
      if (isProcessable(reference) && reference.suspended) continue;

      reference.delta += delta;
    }

    for (const entity of world.getEntities([POSITION, MOVABLE, RENDERABLE])) {
      const attemptedOrientations: Orientation[] = [
        ...entity[MOVABLE].orientations,
      ];
      const pendingOrientation = entity[MOVABLE].pendingOrientation;

      if (pendingOrientation) {
        attemptedOrientations.unshift(pendingOrientation);
      }

      if (attemptedOrientations.length === 0) continue;

      const reference = world.getEntityById(entity[MOVABLE].reference)[
        REFERENCE
      ];

      if (
        !isProcessable(reference) ||
        (reference.suspended && !pendingOrientation)
      )
        continue;

      for (const orientation of attemptedOrientations) {
        const delta = orientationPoints[orientation];
        const position = {
          x: entity[POSITION].x + delta.x,
          y: entity[POSITION].y + delta.y,
        };

        if (!isCollision(world, position)) {
          unregisterEntity(world, entity);

          entity[POSITION].x = position.x;
          entity[POSITION].y = position.y;

          registerEntity(world, entity);

          entity[RENDERABLE].generation += 1;
          world.metadata.gameEntity[RENDERABLE].generation += 1;
          break;
        }
      }

      entity[MOVABLE].pendingOrientation = null;
    }

    // mark reference frames as processed
    for (const entity of world.getEntities([REFERENCE])) {
      const reference = entity[REFERENCE];
      if (isProcessable(reference) && !reference.suspended) {
        reference.delta -= reference.tick;

        if (reference.pendingSuspended) {
          reference.suspended = true;
        }
      }
    }
  };

  return { onUpdate };
}
