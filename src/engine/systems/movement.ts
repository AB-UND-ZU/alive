import ECS, { World } from "ecs";
import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { MOVABLE } from "../components/movable";
import { MAP } from "../components/map";

const WORLD_TICK = 350;

export default function setupMovement(world: World) {
  let accumulatedDelta = 0;

  const onUpdate = (delta: number) => {
    accumulatedDelta += delta;

    const metadata = ECS.getEntity(world, [MAP, RENDERABLE]);

    if (!metadata) return;

    if (accumulatedDelta >= WORLD_TICK) {
      accumulatedDelta -= WORLD_TICK;

      for (const entity of ECS.getEntities(world, [POSITION, MOVABLE, RENDERABLE])) {
        if (entity[MOVABLE].dx === 0 && entity[MOVABLE].dy === 0) continue;

        entity[POSITION].x += entity[MOVABLE].dx;
        entity[POSITION].y += entity[MOVABLE].dy;

        entity[RENDERABLE].generation += 1;
        metadata[RENDERABLE].generation += 1;
      }
    }
  }

  return { onUpdate };
}