import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { MOVABLE, Orientation, orientationPoints } from "../components/movable";
import { World } from "../ecs";
import { isProcessable, REFERENCE } from "../components/reference";

export default function setupMovement(world: World) {
  const onUpdate = (delta: number) => {
    // add delta reference frames
    for (const entity of world.getEntities([REFERENCE])) {
      entity[REFERENCE].delta += delta;
    }

    for (const entity of world.getEntities([POSITION, MOVABLE, RENDERABLE])) {
      if (entity[MOVABLE].orientations.length === 0) continue;

      if (!isProcessable(entity[MOVABLE].reference[REFERENCE])) continue;

      const orientation = entity[MOVABLE].orientations[0] as Orientation;
      const point = orientationPoints[orientation];
      entity[POSITION].x += point[0];
      entity[POSITION].y += point[1];

      entity[RENDERABLE].generation += 1;
      world.metadata.gameEntity[RENDERABLE].generation += 1;
    }

    // mark reference frames as processed
    for (const entity of world.getEntities([REFERENCE])) {
      const reference = entity[REFERENCE];
      if (isProcessable(reference)) {
        reference.delta -= reference.tick;
      }
    }
  };

  return { onUpdate };
}
