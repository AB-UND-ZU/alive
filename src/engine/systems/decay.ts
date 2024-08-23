import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { Entity } from "ecs";
import { PARTICLE } from "../components/particle";
import { unregisterEntity } from "./map";

export const isExpired = (world: World, entity: Entity) =>
  entity[PARTICLE].ttl <= 0;

export default function setupDecay(world: World) {
  const particleTtls: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    for (const entity of world.getEntities([POSITION, PARTICLE, RENDERABLE])) {
      const entityId = world.getEntityId(entity);

      // register initial ttl
      if (!(entityId in particleTtls)) {
        particleTtls[entityId] = entity[PARTICLE].ttl;
      }

      entity[PARTICLE].ttl -= delta;

      if (isExpired(world, entity)) {
        unregisterEntity(world, entity);
        world.removeEntity(entity);
      }
    }
  };

  return { onUpdate };
}
