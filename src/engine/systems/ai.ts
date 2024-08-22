import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { rerenderEntity } from "./renderer";
import {
  MOVABLE,
  Orientation,
  orientationPoints,
  orientations,
} from "../components/movable";
import { BEHAVIOUR } from "../components/behaviour";
import { isWalkable } from "./immersion";
import { isCollision } from "./movement";
import { add, random } from "../../game/math/std";
import { getAttackable, isFriendlyFire } from "./damage";

export default function setupAi(world: World) {
  let lastGeneration = -1;

  const onUpdate = (delta: number) => {
    const generation = world.metadata.gameEntity[RENDERABLE].generation;
    if (lastGeneration === generation) return;

    lastGeneration = generation;

    for (const entity of world.getEntities([POSITION, MOVABLE, BEHAVIOUR])) {
      const patterns = entity[BEHAVIOUR].patterns;

      for (const pattern of patterns) {
        if (pattern === "triangle") {
          if (entity[MOVABLE].orientations.length === 0) {
            entity[MOVABLE].orientations = [entity[MOVABLE].facing];
            rerenderEntity(world, entity);
          }

          const facing = entity[MOVABLE].facing as Orientation;
          const position = add(entity[POSITION], orientationPoints[facing]);
          const attackedEntity = getAttackable(world, position);

          // attackable, proceed
          if (attackedEntity && !isFriendlyFire(world, entity, attackedEntity))
            continue;

          // unable to move, attempt reorienting
          if (!isWalkable(world, position) || isCollision(world, position)) {
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
              if (
                isWalkable(world, attemptedPosition) &&
                !isCollision(world, attemptedPosition)
              ) {
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

            entity[MOVABLE].facing = newFacing;
            entity[MOVABLE].orientations = [];
            rerenderEntity(world, entity);
          }
        }
      }
    }
  };

  return { onUpdate };
}
