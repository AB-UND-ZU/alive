import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { rerenderEntity } from "./renderer";
import { MOVABLE } from "../components/movable";
import { Behaviour, BEHAVIOUR } from "../components/behaviour";
import { isMovable, isWalkable } from "./movement";
import { add, copy, random } from "../../game/math/std";
import { isDead, isFriendlyFire } from "./damage";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
  orientations,
} from "../components/orientable";
import { findPath, relativeOrientation } from "../../game/math/path";
import { TOOLTIP } from "../components/tooltip";
import { ACTIONABLE } from "../components/actionable";
import { isLocked } from "./action";
import { ITEM, Material } from "../components/item";
import { LOCKABLE } from "../components/lockable";
import { SPRITE } from "../components/sprite";
import { LIGHT } from "../components/light";
import { updateWalkable } from "./map";
import { lockMaterials } from "./trigger";
import { lockedIron, shop } from "../../game/assets/sprites";
import { dropItem } from "./drop";

export default function setupAi(world: World) {
  let lastGeneration = -1;

  const onUpdate = (delta: number) => {
    const generation = world.metadata.gameEntity[RENDERABLE].generation;
    if (lastGeneration === generation) return;

    lastGeneration = generation;

    for (const entity of world.getEntities([POSITION, MOVABLE, BEHAVIOUR])) {
      const patterns = (entity[BEHAVIOUR] as Behaviour).patterns;
      const pattern = patterns[0];
      const entityId = world.getEntityId(entity);

      // skip if dead or no pattern
      if (isDead(world, entity) || !pattern) continue;

      if (pattern.name === "triangle") {
        const facing = (entity[ORIENTABLE].facing ||
          orientations[random(0, orientations.length - 1)]) as Orientation;

        if (entity[MOVABLE].orientations.length === 0) {
          entity[MOVABLE].orientations = [facing];
          continue;
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
              (orientations.indexOf(preferredFacing) + 2) % orientations.length
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
      } else if (pattern.name === "dialog") {
        const memory = pattern.memory;

        for (const [key, value] of Object.entries(memory)) {
          entity[TOOLTIP][key] = value;
        }

        patterns.shift();
      } else if (pattern.name === "lock") {
        const memory = pattern.memory;
        const targetEntity = world.getEntityById(memory.target);

        // lock door
        targetEntity[LOCKABLE].locked = true;
        targetEntity[SPRITE] =
          lockMaterials[targetEntity[LOCKABLE].material as Material]?.door ||
          lockedIron;
        targetEntity[LIGHT].orientation = undefined;
        rerenderEntity(world, targetEntity);
        updateWalkable(world, targetEntity[POSITION]);

        patterns.shift();
      } else if (pattern.name === "move") {
        const memory = pattern.memory;
        entity[MOVABLE].orientations = [];

        // recalculate path if path obstructed
        const uninitialized = !memory.path;
        let attemptedPosition = memory.path?.[0] as Position | undefined;
        const hasArrived =
          entity[POSITION].x === memory.position.x &&
          entity[POSITION].y === memory.position.y;
        let pathObstructed =
          attemptedPosition && !isWalkable(world, attemptedPosition);
        const remainingPath =
          !uninitialized && !hasArrived && memory.path.length === 0;

        // finish if path reached
        if (hasArrived) {
          patterns.shift();
          continue;
        }

        if (uninitialized || pathObstructed || remainingPath) {
          const path = findPath(world, entity[POSITION], memory.position);
          if (path.length > 0) {
            memory.path = path;
            attemptedPosition = memory.path[0];
            pathObstructed = false;
          } else {
            memory.path = undefined;
          }
        }

        if (attemptedPosition && !pathObstructed) {
          memory.path.shift();

          const targetOrientation = relativeOrientation(
            world,
            entity[POSITION],
            attemptedPosition
          );
          entity[MOVABLE].orientations = [targetOrientation];
        }
      } else if (
        pattern.name === "kill" ||
        pattern.name === "unlock" ||
        pattern.name === "collect" ||
        pattern.name === "drop" ||
        pattern.name === "sell"
      ) {
        const movablePattern = ["kill", "collect"].includes(pattern.name);
        const itemPattern = ["drop", "sell"].includes(pattern.name);
        const memory = pattern.memory;
        const itemEntity = world.getEntityById(memory.item);
        const targetEntity =
          pattern.name === "collect"
            ? world.getEntityById(itemEntity[ITEM].carrier)
            : itemPattern
            ? { [POSITION]: pattern.memory.position }
            : world.getEntityById(memory.target);
        entity[MOVABLE].orientations = [];

        // end if target not actionable
        const killed =
          pattern.name === "kill" &&
          (!targetEntity ||
            isDead(world, targetEntity) ||
            isFriendlyFire(world, entity, targetEntity));
        const collected =
          pattern.name === "collect" &&
          itemEntity &&
          itemEntity[ITEM].carrier === entityId;
        const dropped =
          itemPattern &&
          itemEntity &&
          itemEntity[ITEM].carrier !== entityId;
        const unlocked =
          pattern.name === "unlock" &&
          targetEntity &&
          !isLocked(world, targetEntity);

        if (killed || unlocked || collected || dropped) {
          patterns.shift();
          continue;
        }

        // recalculate path if target moved or path obstructed
        const uninitialized = !memory.path;
        const targetMoved =
          targetEntity[POSITION].x !== memory.position?.x ||
          targetEntity[POSITION].y !== memory.position?.y;
        let attemptedPosition = memory.path?.[0] as Position | undefined;
        let hasArrived =
          attemptedPosition &&
          attemptedPosition?.x === memory.position?.x &&
          attemptedPosition?.y === memory.position?.y;
        let pathObstructed =
          !hasArrived &&
          attemptedPosition &&
          !isWalkable(world, attemptedPosition);

        if (uninitialized || targetMoved || pathObstructed) {
          memory.position = copy(targetEntity[POSITION]);
          const path = findPath(world, entity[POSITION], memory.position, true);

          if (path.length > 0) {
            memory.path = path;
            attemptedPosition = memory.path[0];
            pathObstructed = false;
            hasArrived =
              attemptedPosition &&
              attemptedPosition?.x === memory.position?.x &&
              attemptedPosition?.y === memory.position?.y;
          } else {
            memory.path = undefined;
          }
        }

        // move or act depending on pattern
        if (attemptedPosition && !pathObstructed) {
          if (!hasArrived || movablePattern) {
            const targetOrientation = relativeOrientation(
              world,
              entity[POSITION],
              attemptedPosition
            );
            entity[MOVABLE].orientations = [targetOrientation];
          }

          if (hasArrived && pattern.name === "unlock") {
            entity[ACTIONABLE].triggered = true;
          } else if (hasArrived && itemPattern) {
            const containerEntity = dropItem(
              world,
              [memory.item],
              memory.position
            );

            if (pattern.name === "sell") {
              containerEntity[TOOLTIP].idle = shop;
            }
          }

          if (!hasArrived || !movablePattern) memory.path.shift();
        }
      }
    }
  };

  return { onUpdate };
}
