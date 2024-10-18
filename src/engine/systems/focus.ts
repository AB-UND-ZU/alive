import { World } from "../ecs";
import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { rerenderEntity } from "./renderer";
import { FOCUSABLE } from "../components/focusable";
import { moveEntity } from "./map";
import { ITEM } from "../components/item";
import { isLootable } from "./collect";
import { isDead } from "./damage";
import { PLAYER } from "../components/player";

export default function setupFocus(world: World) {
  let referenceGenerations = -1;

  const onUpdate = (delta: number) => {
    const heroEntity = world.getEntity([PLAYER]);
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // handle focus highlights and trigger on any reference frame changes for simplicity
    for (const entity of world.getEntities([FOCUSABLE, RENDERABLE])) {
      let targetId = entity[FOCUSABLE].target;
      let pendingId = entity[FOCUSABLE].pendingTarget;

      // focus compass on inital drop
      const compassEntity = world.getIdentifier("compass");
      const carrierEntity =
        compassEntity && world.getEntityById(compassEntity[ITEM].carrier);

      if (
        !targetId &&
        !pendingId &&
        carrierEntity &&
        isLootable(world, carrierEntity) &&
        heroEntity &&
        !isDead(world, heroEntity)
      ) {
        entity[FOCUSABLE].pendingTarget = compassEntity[ITEM].carrier;
        pendingId = entity[FOCUSABLE].pendingTarget;
      }

      let targetEntity = world.getEntityById(targetId);
      const pendingEntity = world.getEntityById(pendingId);

      // skip if no target
      if (!targetId && !pendingId) continue;

      // handle removing focus
      if (targetEntity && !pendingEntity) {
        entity[FOCUSABLE].target = undefined;
        rerenderEntity(world, entity);
        continue;
      }

      // handle target disappearing
      if (!targetEntity && !pendingEntity) {
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
        moveEntity(world, entity, targetEntity[POSITION]);
        rerenderEntity(world, entity);
      }
    }
  };

  return { onUpdate };
}
