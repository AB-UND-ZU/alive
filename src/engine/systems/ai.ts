import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { rerenderEntity } from "./renderer";
import { MOVABLE } from "../components/movable";
import { BEHAVIOUR } from "../components/behaviour";
import { isMovable } from "./movement";
import { add, random } from "../../game/math/std";
import { isDead } from "./damage";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
  orientations,
} from "../components/orientable";

export default function setupAi(world: World) {
  let lastGeneration = -1;

  const onUpdate = (delta: number) => {
    const generation = world.metadata.gameEntity[RENDERABLE].generation;
    if (lastGeneration === generation) return;

    lastGeneration = generation;

    for (const entity of world.getEntities([POSITION, MOVABLE, BEHAVIOUR])) {
      // skip if dead
      if (isDead(world, entity)) continue;

      const patterns = entity[BEHAVIOUR].patterns;

      for (const pattern of patterns) {
        if (pattern === "triangle") {
          const facing = (entity[ORIENTABLE].facing ||
            orientations[random(0, orientations.length - 1)]) as Orientation;

          if (entity[MOVABLE].orientations.length === 0) {
            entity[MOVABLE].orientations = [facing];
            rerenderEntity(world, entity);
          }

          const position = add(entity[POSITION], orientationPoints[facing]);

          // unable to move, attempt reorienting
          if (!isMovable(world, entity, position)) {
            const preferredFacing =
              orientations[
                (orientations.indexOf(facing) + 1 + random(0, 1) * 2) %
                  orientations.length
              ];
            const attemptedFacings = [
              preferredFacing,
              orientations[
                (orientations.indexOf(preferredFacing) + 2) %
                  orientations.length
              ],
              orientations[
                (orientations.indexOf(facing) + 2) % orientations.length
              ],
            ];
            let newFacing;
            for (const attemptedFacing of attemptedFacings) {
              const attemptedPosition = add(
                entity[POSITION],
                orientationPoints[attemptedFacing]
              );
              if (isMovable(world, entity, attemptedPosition)) {
                newFacing = attemptedFacing;
                break;
              }
            }
            if (!newFacing) {
              newFacing =
                orientations[
                  (orientations.indexOf(facing) +
                    random(1, orientations.length - 1)) %
                    orientations.length
                ];
            }

            entity[ORIENTABLE].facing = newFacing;
            entity[MOVABLE].orientations = [];
            rerenderEntity(world, entity);
          }
        }
      }
    }
  };

  return { onUpdate };
}
