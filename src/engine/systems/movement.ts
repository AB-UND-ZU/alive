import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { MOVABLE } from "../components/movable";
import { World } from "../ecs";

const WORLD_TICK = 350;

export default function setupMovement(world: World) {
  let accumulatedDelta = 0;

  const onUpdate = (delta: number) => {
    accumulatedDelta += delta;

    if (accumulatedDelta >= WORLD_TICK) {
      accumulatedDelta -= WORLD_TICK;

      for (const entity of world.getEntities([POSITION, MOVABLE, RENDERABLE])) {
        if (entity[MOVABLE].dx === 0 && entity[MOVABLE].dy === 0) continue;

        entity[POSITION].x += entity[MOVABLE].dx;
        entity[POSITION].y += entity[MOVABLE].dy;

        entity[RENDERABLE].generation += 1;
        world.metadata.generation += 1;
      }
    }
  }

  return { onUpdate };
}