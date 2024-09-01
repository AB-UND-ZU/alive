import { World } from "../ecs";
import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { rerenderEntity } from "./renderer";
import { FOCUSABLE } from "../components/focusable";
import { registerEntity, unregisterEntity } from "./map";

export default function setupFocus(world: World) {
  let referenceGenerations = -1;

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // handle focus highlights and trigger on any reference frame changes for simplicity
    for (const entity of world.getEntities([FOCUSABLE, RENDERABLE])) {
      const targetId = entity[FOCUSABLE].target;
      const pendingId = entity[FOCUSABLE].pendingTarget;

      // skip if no target
      if (!targetId && !pendingId) continue;

      let targetEntity = world.getEntityById(targetId);
      const pendingEntity = world.getEntityById(pendingId);

      // handle removing focus
      if (targetEntity && !pendingEntity) {
        entity[FOCUSABLE].target = undefined;
        rerenderEntity(world, entity);
        continue;
      }

      // handle target disappearing
      if (!targetEntity && targetId === pendingId) {
        console.log('lost', targetId);
        entity[FOCUSABLE].target = undefined;
        entity[FOCUSABLE].pendingTarget = undefined;
        rerenderEntity(world, entity);
        continue;
      }

      // handle changing focus
      if (pendingEntity && targetEntity !== pendingEntity) {
        entity[FOCUSABLE].target = pendingId;
        targetEntity = pendingEntity;
      }

      // keep focused position on target
      if (
        entity[POSITION].x !== targetEntity[POSITION].x ||
        entity[POSITION].y !== targetEntity[POSITION].y
      ) {
        unregisterEntity(world, entity);
        entity[POSITION].x = targetEntity[POSITION].x;
        entity[POSITION].y = targetEntity[POSITION].y;
        registerEntity(world, entity);
        rerenderEntity(world, entity);
      }
    }
  };

  return { onUpdate };
}
