import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { MOVABLE, Orientation, orientationPoints } from "../components/movable";
import { World } from "../ecs";

const WORLD_TICK = 350;

export default function setupMovement(world: World) {
  let accumulatedDelta = 0;

  const onUpdate = (delta: number) => {
    accumulatedDelta += delta;

    if (accumulatedDelta >= WORLD_TICK) {
      accumulatedDelta -= WORLD_TICK;

      for (const entity of world.getEntities([POSITION, MOVABLE, RENDERABLE])) {
        if (entity[MOVABLE].orientations.length === 0) continue;

        const orientation = entity[MOVABLE].orientations[0] as Orientation;
        const point = orientationPoints[orientation];
        entity[POSITION].x += point[0];
        entity[POSITION].y += point[1];

        entity[RENDERABLE].generation += 1;
        world.metadata.generation += 1;
      }
    }
  }

  return { onUpdate };
}