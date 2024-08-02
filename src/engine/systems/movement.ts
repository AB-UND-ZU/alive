import ECS, { World } from "ecs";
import { POSITION } from "../components/position";
import { PLAYER } from "../components/player";
import { RENDERABLE } from "../components/renderable";

const WORLD_TICK = 350;

export default function setupMovement(world: World) {
  let accumulatedDelta = 0;

  const onUpdate = (delta: number) => {
    accumulatedDelta += delta;

    if (accumulatedDelta >= WORLD_TICK) {
      accumulatedDelta -= WORLD_TICK;

      for (const entity of ECS.getEntities(world, [POSITION, PLAYER, RENDERABLE])) {
        entity[POSITION].x += 1;
        entity[POSITION].y += 1;
        entity[RENDERABLE].generation += 1;
      }
    }
  }

  return { onUpdate };
}