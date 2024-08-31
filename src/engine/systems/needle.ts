import { World } from "../ecs";
import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { ORIENTABLE } from "../components/orientable";
import { isDead } from "./damage";
import { ITEM } from "../components/item";
import { rerenderEntity } from "./renderer";
import { TRACKABLE } from "../components/trackable";
import { degreesToOrientations, pointToDegree } from "../../game/math/tracing";
import { LOOTABLE } from "../components/lootable";

export default function setupNeedle(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // handle compass needles
    for (const entity of world.getEntities([
      ITEM,
      ORIENTABLE,
      TRACKABLE,
      RENDERABLE,
    ])) {
      const originId = entity[ITEM].carrier;
      const targetId = entity[TRACKABLE].target;

      if (!originId || !targetId || originId === targetId) continue;

      const entityId = world.getEntityId(entity);
      const originEntity = world.getEntityById(originId);
      const targetEntity = world.getEntityById(targetId);
      const originReference = originEntity[MOVABLE].reference
        ? world.getEntityById(originEntity[MOVABLE].reference)[RENDERABLE]
            .generation
        : 0;
      const targetReference = targetEntity[MOVABLE].reference
        ? world.getEntityById(targetEntity[MOVABLE].reference)[RENDERABLE]
            .generation
        : 0;
      const entityReference = originReference + targetReference;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      const currentOrientation = entity[ORIENTABLE].facing;
      const delta = {
        x: targetEntity[POSITION].x - originEntity[POSITION].x,
        y: targetEntity[POSITION].y - originEntity[POSITION].y,
      };
      const targetOrientation = degreesToOrientations(pointToDegree(delta))[0];

      if (currentOrientation === targetOrientation) continue;

      // reorient needle
      entity[ORIENTABLE].facing = targetOrientation;
      rerenderEntity(world, entity);

      // reorient lootable container
      if (isDead(world, originEntity) && originEntity[LOOTABLE].accessible) {
        originEntity[ORIENTABLE].facing = targetOrientation;
        rerenderEntity(world, originEntity);
      }
    }
  };

  return { onUpdate };
}
