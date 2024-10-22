import { World } from "../ecs";
import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { ORIENTABLE } from "../components/orientable";
import { ITEM } from "../components/item";
import { rerenderEntity } from "./renderer";
import { TRACKABLE } from "../components/trackable";
import { relativeOrientations } from "../../game/math/path";

export default function setupNeedle(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, string> = {};

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

      // reset needle
      if (!originId || !targetId || originId === targetId) {
        entity[ORIENTABLE].facing = undefined;
        continue;
      }

      const entityId = world.getEntityId(entity);
      const originEntity = world.getEntityByIdAndComponents(originId, [
        POSITION,
      ]);
      const targetEntity = world.getEntityByIdAndComponents(targetId, [
        POSITION,
      ]);

      // clear target if focus is lost
      if (!targetEntity || !originEntity) {
        entity[TRACKABLE].target = undefined;
        continue;
      }

      const originReference = originEntity[MOVABLE]
        ? world.assertByIdAndComponents(originEntity[MOVABLE].reference, [
            RENDERABLE,
          ])[RENDERABLE].generation
        : 0;
      const targetReference = targetEntity[MOVABLE]
        ? world.assertByIdAndComponents(targetEntity[MOVABLE].reference, [
            RENDERABLE,
          ])[RENDERABLE].generation
        : 0;
      const entityReference = `${originId}.${originReference}:${targetId}.${targetReference}`;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      const targetOrientation = relativeOrientations(
        world,
        originEntity[POSITION],
        targetEntity[POSITION]
      )[0];

      // reorient needle
      if (entity[ORIENTABLE].facing !== targetOrientation) {
        entity[ORIENTABLE].facing = targetOrientation;
        rerenderEntity(world, entity);
        rerenderEntity(world, originEntity);
      }
    }
  };

  return { onUpdate };
}
