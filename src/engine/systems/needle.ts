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
import { PLAYER } from "../components/player";
import { getIdentifier } from "../utils";

export default function setupNeedle(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, string> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // handle needles
    for (const entity of world.getEntities([
      ORIENTABLE,
      TRACKABLE,
      RENDERABLE,
    ])) {
      const entityId = world.getEntityId(entity);
      const originId = entity[ITEM] ? entity[ITEM].carrier : entityId;
      const targetId = entity[TRACKABLE].target;

      const heroEntity = world.getEntity([PLAYER]);
      const heroId = heroEntity && world.getEntityId(heroEntity);

      if (heroId && !entity[TRACKABLE].target) {
        // point dropped compass to hero
        entity[TRACKABLE].target = heroId;
        continue;
      } else if (originId === targetId && targetId === heroId) {
        // point picked up compass to player spawn
        const spawn = getIdentifier(world, "spawn");
        entity[TRACKABLE].target = spawn && world.getEntityId(spawn);
        continue;
      }

      // reset needle
      if (!originId || !targetId) {
        entity[ORIENTABLE].facing = undefined;
        continue;
      }

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
        : originEntity[RENDERABLE]?.generation || 0;
      const targetReference = targetEntity[MOVABLE]
        ? world.assertByIdAndComponents(targetEntity[MOVABLE].reference, [
            RENDERABLE,
          ])[RENDERABLE].generation
        : targetEntity[RENDERABLE]?.generation || 0;
      const entityReference = `${originId}.${originReference}:${targetId}.${targetReference}`;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      const currentOrientation = entity[ORIENTABLE].facing;
      const targetOrientations = relativeOrientations(
        world,
        originEntity[POSITION],
        targetEntity[POSITION]
      );

      // reorient needle lazily, only if within 45° of a linear direction
      // is not matching current orientation, or if flipping edges
      if (
        ((targetOrientations.length === 1 || !currentOrientation) &&
          currentOrientation !== targetOrientations[0]) ||
        !targetOrientations.includes(currentOrientation)
      ) {
        entity[ORIENTABLE].facing = targetOrientations[0];
        rerenderEntity(world, entity);
        rerenderEntity(world, originEntity);
      }
    }
  };

  return { onUpdate };
}
