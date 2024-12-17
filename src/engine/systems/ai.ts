import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { rerenderEntity } from "./renderer";
import { MOVABLE } from "../components/movable";
import { Behaviour, BEHAVIOUR } from "../components/behaviour";
import { isMovable, isWalkable } from "./movement";
import {
  add,
  copy,
  getDistance,
  random,
  signedDistance,
} from "../../game/math/std";
import { isDead, isFriendlyFire } from "./damage";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
  orientations,
} from "../components/orientable";
import {
  findPath,
  invertOrientation,
  relativeOrientations,
} from "../../game/math/path";
import { TOOLTIP } from "../components/tooltip";
import { ACTIONABLE } from "../components/actionable";
import { isLocked } from "./action";
import { ITEM } from "../components/item";
import { lockDoor } from "./trigger";
import { dropEntity, sellItem } from "./drop";
import {
  confused,
  createShout,
  rage,
  sleep1,
  sleep2,
} from "../../game/assets/sprites";
import { ATTACKABLE } from "../components/attackable";
import { INVENTORY } from "../components/inventory";
import { FOG } from "../components/fog";
import { LEVEL } from "../components/level";
import { BELONGABLE } from "../components/belongable";
import { iterations } from "../../game/math/tracing";
import { getProjectiles } from "./ballistics";
import { canCast } from "./magic";

export default function setupAi(world: World) {
  let lastGeneration = -1;

  const onUpdate = (delta: number) => {
    const generation = world.metadata.gameEntity[RENDERABLE].generation;
    if (lastGeneration === generation) return;

    lastGeneration = generation;

    for (const entity of world.getEntities([
      BELONGABLE,
      POSITION,
      MOVABLE,
      BEHAVIOUR,
      FOG,
      TOOLTIP,
      ATTACKABLE,
    ])) {
      const patterns = (entity[BEHAVIOUR] as Behaviour).patterns;
      const entityId = world.getEntityId(entity);

      // always reset movement first to cover cases of changed patterns
      if (entity[MOVABLE]) {
        entity[MOVABLE].orientations = [];
      }

      // skip if dead or no patterns
      if (isDead(world, entity) || patterns.length === 0) continue;

      for (const pattern of [...patterns]) {
        if (pattern.name === "wait") {
          if (pattern.memory.ticks === 0) {
            patterns.splice(patterns.indexOf(pattern), 1);
            continue;
          }

          pattern.memory.ticks -= 1;
          break;
        } else if (pattern.name === "prism") {
          const facing = (entity[ORIENTABLE]?.facing ||
            orientations[random(0, orientations.length - 1)]) as Orientation;

          entity[MOVABLE].orientations = [facing];

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
              invertOrientation(preferredFacing),
              invertOrientation(facing),
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

            if (entity[ORIENTABLE]) entity[ORIENTABLE].facing = newFacing;
            entity[MOVABLE].orientations = [];
            rerenderEntity(world, entity);
          }
          break;
        } else if (pattern.name === "eye") {
          const heroEntity = world.getIdentifierAndComponents("hero", [
            POSITION,
          ]);
          const size = world.metadata.gameEntity[LEVEL].size;
          const distance = heroEntity
            ? getDistance(entity[POSITION], heroEntity[POSITION], size, 0.69)
            : Infinity;
          const aggro = distance < 3.5;
          const close = distance < 4.25;
          const isVisible = entity[FOG].visibility === "visible";
          const isMoving = !entity[TOOLTIP].idle;
          const orientations = heroEntity
            ? relativeOrientations(
                world,
                entity[POSITION],
                heroEntity[POSITION]
              )
            : [];

          if (!heroEntity || (!aggro && !isMoving) || !isVisible) {
            const sprite = close
              ? confused
              : [sleep1, sleep2][
                  world.metadata.gameEntity[RENDERABLE].generation % 2
                ];
            if (entity[TOOLTIP].idle !== sprite) {
              entity[TOOLTIP].idle = sprite;
              entity[TOOLTIP].changed = true;
            }

            // open eyes by setting orientation
            if (entity[ORIENTABLE]) {
              if (close && !entity[ORIENTABLE].facing)
                entity[ORIENTABLE].facing = orientations[0];
              else if (!close) entity[ORIENTABLE].facing = undefined;
            }

            break;
          }

          if (!isMoving) {
            entity[TOOLTIP].idle = undefined;
            entity[TOOLTIP].changed = true;
          }

          entity[MOVABLE].orientations = orientations;
          rerenderEntity(world, entity);
          break;
        } else if (pattern.name === "orb") {
          const heroEntity = world.getIdentifierAndComponents("hero", [
            POSITION,
            MOVABLE,
          ]);
          const size = world.metadata.gameEntity[LEVEL].size;
          const circularDistance = heroEntity
            ? getDistance(entity[POSITION], heroEntity[POSITION], size)
            : Infinity;
          const blockDistance = heroEntity
            ? getDistance(
                entity[POSITION],
                heroEntity[POSITION],
                size,
                1,
                false
              )
            : Infinity;
          const visualDistance = heroEntity
            ? getDistance(
                entity[POSITION],
                heroEntity[POSITION],
                size,
                0.69,
                false
              )
            : Infinity;
          const canShoot = canCast(
            world,
            entity,
            world.assertByIdAndComponents(
              entity[INVENTORY]?.items.find(
                (itemId) =>
                  world.assertByIdAndComponents(itemId, [ITEM])[ITEM]
                    .equipment === "active"
              ),
              [ITEM]
            )
          );
          const isShooting = !!entity[TOOLTIP].idle;
          const flee = circularDistance < 4;
          const attack = blockDistance > 2 && visualDistance < 7;

          if (isShooting && entity[ACTIONABLE]) {
            entity[TOOLTIP].idle = undefined;
            entity[TOOLTIP].changed = true;
            entity[ACTIONABLE].triggered = true;
          } else if (canShoot && attack && heroEntity) {
            const delta = {
              x: signedDistance(
                entity[POSITION].x,
                heroEntity[POSITION].x,
                size
              ),
              y: signedDistance(
                entity[POSITION].y,
                heroEntity[POSITION].y,
                size
              ),
            };

            let shootingOrientation: Orientation | undefined;

            // shoot straight
            for (const direction in orientationPoints) {
              const orientation = direction as Orientation;
              if (
                Math.sign(delta.x) ===
                  Math.sign(orientationPoints[orientation].x) &&
                Math.sign(delta.y) ===
                  Math.sign(orientationPoints[orientation].y)
              ) {
                shootingOrientation = orientation;
                break;
              }
            }

            // shoot into momentum
            const speedFactor = 1.5;
            for (const iteration of iterations) {
              if (shootingOrientation) break;

              const directionOffset =
                (delta.x * iteration.direction.x) / speedFactor +
                (delta.y * iteration.direction.y) / speedFactor / 0.69;
              const normalOffset =
                delta.x * iteration.normal.x + delta.y * iteration.normal.y;
              if (
                directionOffset > 0 &&
                Math.abs(normalOffset) < directionOffset &&
                heroEntity[MOVABLE].orientations[0] ===
                  orientations[
                    (orientations.indexOf(iteration.orientation) +
                      (normalOffset > 0 ? 3 : 1)) %
                      4
                  ]
              ) {
                shootingOrientation = iteration.orientation;
              }
            }

            if (entity[ORIENTABLE] && entity[ACTIONABLE]) {
              entity[ORIENTABLE].facing = undefined;
              if (shootingOrientation) {
                entity[ORIENTABLE].facing = shootingOrientation;
                entity[TOOLTIP].idle = rage;
                entity[TOOLTIP].changed = true;
                rerenderEntity(world, entity);
                break;
              }
            }
          }

          if (flee && heroEntity) {
            // invert direction by argument order
            const fleeingOrientations = relativeOrientations(
              world,
              heroEntity[POSITION],
              entity[POSITION],
              1
            );
            entity[MOVABLE].orientations = fleeingOrientations;
            rerenderEntity(world, entity);
            break;
          }
        } else if (pattern.name === "fairy") {
          const heroEntity = world.getIdentifierAndComponents("hero", [
            POSITION,
          ]);
          const size = world.metadata.gameEntity[LEVEL].size;
          const distance = heroEntity
            ? getDistance(entity[POSITION], heroEntity[POSITION], size)
            : Infinity;
          const flee = distance < 5.5;
          const sidestep = distance < 7;
          let sidestepped = false;

          if (sidestep && heroEntity) {
            // dodge incoming projectiles
            for (const iteration of iterations) {
              if (sidestepped) break;
              for (let direction = 1; direction < 3; direction += 1) {
                const position = add(entity[POSITION], {
                  x: iteration.direction.x * direction,
                  y: iteration.direction.y * direction,
                });
                const projectile = getProjectiles(world, position)[0];
                if (
                  projectile &&
                  !isFriendlyFire(world, entity, projectile) &&
                  projectile[ORIENTABLE].facing ===
                    invertOrientation(iteration.orientation)
                ) {
                  const sidestepOrientations = [
                    orientations[
                      (orientations.indexOf(iteration.orientation) + 1) % 4
                    ],
                  ];
                  sidestepOrientations.push(
                    invertOrientation(sidestepOrientations[0])
                  );
                  if (Math.random() > 0.5) {
                    sidestepOrientations.reverse();
                  }
                  sidestepOrientations.push(
                    invertOrientation(iteration.orientation)
                  );
                  entity[MOVABLE].orientations = sidestepOrientations;
                  rerenderEntity(world, entity);
                  sidestepped = true;
                  break;
                }
              }
            }
          }

          if (!sidestepped && flee && heroEntity) {
            // invert direction by argument order
            const fleeingOrientations = relativeOrientations(
              world,
              heroEntity[POSITION],
              entity[POSITION]
            );
            let randomize = 0;
            if (fleeingOrientations.length === 1) {
              randomize = Math.random() ** (distance - 0.5);
              fleeingOrientations.push(
                orientations[
                  (orientations.indexOf(fleeingOrientations[0]) +
                    1 +
                    random(0, 1) * 2) %
                    4
                ]
              );
            }
            fleeingOrientations.push(invertOrientation(fleeingOrientations[1]));

            if (randomize > 0.9) {
              if (Math.random() > 0.5) {
                fleeingOrientations.reverse();
              } else {
                fleeingOrientations.push(fleeingOrientations.shift()!);
              }
            }

            entity[MOVABLE].orientations = fleeingOrientations;
            rerenderEntity(world, entity);
            break;
          }
        } else if (pattern.name === "dialog") {
          const memory = pattern.memory;

          for (const [key, value] of Object.entries(memory)) {
            // TODO: find a better way to infer types
            (entity[TOOLTIP] as any)[key] = value;
          }
          entity[TOOLTIP].changed = true;

          patterns.splice(patterns.indexOf(pattern), 1);
        } else if (pattern.name === "lock") {
          const memory = pattern.memory;

          // lock door
          const targetEntity = world.assertById(memory.target);
          lockDoor(world, targetEntity);

          patterns.splice(patterns.indexOf(pattern), 1);
          break;
        } else if (pattern.name === "enrage") {
          const memory = pattern.memory;
          entity[BELONGABLE].faction = "hostile";
          entity[TOOLTIP].changed = true;
          entity[TOOLTIP].idle = rage;
          entity[TOOLTIP].override = memory.shout ? "visible" : undefined;
          entity[TOOLTIP].dialogs = memory.shout
            ? [createShout(memory.shout)]
            : [];

          patterns.splice(patterns.indexOf(pattern), 1);
        } else if (pattern.name === "soothe") {
          entity[BELONGABLE].faction = "settler";
          entity[TOOLTIP].changed = true;
          entity[TOOLTIP].idle = undefined;
          entity[TOOLTIP].override = undefined;
          entity[TOOLTIP].dialogs = [];

          patterns.splice(patterns.indexOf(pattern), 1);
        } else if (pattern.name === "move") {
          const memory = pattern.memory;
          entity[MOVABLE].orientations = [];

          // recalculate path if path obstructed
          const uninitialized = !memory.path;
          let attemptedPosition = memory.path?.[0] as Position | undefined;
          const hasArrived =
            entity[POSITION].x === memory.targetPosition.x &&
            entity[POSITION].y === memory.targetPosition.y;

          // finish if path reached
          if (hasArrived) {
            patterns.splice(patterns.indexOf(pattern), 1);
            continue;
          }

          // recalculate path if route changed or path obstructed
          let pathObstructed =
            attemptedPosition && !isWalkable(world, attemptedPosition);
          const remainingPath =
            !uninitialized && !hasArrived && memory.path.length === 0;
          const originChanged =
            !memory.originPosition ||
            memory.originPosition.x !== entity[POSITION].x ||
            memory.originPosition.y !== entity[POSITION].y;

          if (
            uninitialized ||
            pathObstructed ||
            remainingPath ||
            originChanged
          ) {
            memory.originPosition = copy(entity[POSITION]);
            const path = findPath(
              world.metadata.gameEntity[LEVEL].walkable,
              memory.originPosition,
              memory.targetPosition
            );
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

            const targetOrientation = relativeOrientations(
              world,
              entity[POSITION],
              attemptedPosition,
              1
            )[0];
            entity[MOVABLE].orientations = targetOrientation
              ? [targetOrientation]
              : [];
          }
          break;
        } else if (
          pattern.name === "kill" ||
          pattern.name === "unlock" ||
          pattern.name === "collect" ||
          pattern.name === "drop" ||
          pattern.name === "sell"
        ) {
          const movablePattern = ["kill", "collect"].includes(pattern.name);
          const placementPattern = ["drop", "sell"].includes(pattern.name);
          const memory = pattern.memory;
          const itemEntity = memory.item && world.getEntityById(memory.item);

          const targetEntity =
            pattern.name === "collect"
              ? itemEntity && world.getEntityById(itemEntity[ITEM].carrier)
              : placementPattern
              ? { [POSITION]: pattern.memory.targetPosition }
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
            (!itemEntity ||
              !targetEntity ||
              (itemEntity && itemEntity[ITEM].carrier === entityId));
          const dropped =
            placementPattern &&
            itemEntity &&
            itemEntity[ITEM].carrier !== entityId;
          const unlocked =
            pattern.name === "unlock" &&
            targetEntity &&
            !isLocked(world, targetEntity);

          if (killed || unlocked || collected || dropped) {
            patterns.splice(patterns.indexOf(pattern), 1);
            continue;
          }

          // recalculate path if route changed or path obstructed
          const uninitialized = !memory.path;
          const targetMoved =
            targetEntity[POSITION].x !== memory.targetPosition?.x ||
            targetEntity[POSITION].y !== memory.targetPosition?.y;
          let attemptedPosition = memory.path?.[0] as Position | undefined;
          let hasArrived =
            attemptedPosition &&
            attemptedPosition?.x === memory.targetPosition?.x &&
            attemptedPosition?.y === memory.targetPosition?.y;
          let pathObstructed =
            !hasArrived &&
            attemptedPosition &&
            !isWalkable(world, attemptedPosition);
          const remainingPath =
            !uninitialized && !hasArrived && memory.path.length === 0;
          const originChanged =
            !memory.originPosition ||
            memory.originPosition.x !== entity[POSITION].x ||
            memory.originPosition.y !== entity[POSITION].y;

          if (
            uninitialized ||
            targetMoved ||
            pathObstructed ||
            remainingPath ||
            originChanged
          ) {
            memory.originPosition = copy(entity[POSITION]);
            memory.targetPosition = copy(targetEntity[POSITION]);
            const path = findPath(
              world.metadata.gameEntity[LEVEL].walkable,
              entity[POSITION],
              memory.targetPosition,
              true
            );

            if (path.length > 0) {
              memory.path = path;
              attemptedPosition = memory.path[0];
              pathObstructed = false;
              hasArrived =
                attemptedPosition &&
                attemptedPosition?.x === memory.targetPosition?.x &&
                attemptedPosition?.y === memory.targetPosition?.y;
            } else {
              memory.path = undefined;
            }
          }

          // move or act depending on pattern
          if (attemptedPosition && !pathObstructed) {
            if (!hasArrived || movablePattern) {
              const targetOrientation = relativeOrientations(
                world,
                entity[POSITION],
                attemptedPosition,
                1
              )[0];
              entity[MOVABLE].orientations = [targetOrientation];
            }

            if (hasArrived && pattern.name === "unlock" && entity[ACTIONABLE]) {
              entity[ACTIONABLE].triggered = true;
            } else if (hasArrived && placementPattern) {
              if (pattern.name === "drop") {
                dropEntity(
                  world,
                  { [INVENTORY]: { items: [memory.item] } },
                  memory.targetPosition
                );
              } else if (pattern.name === "sell") {
                sellItem(
                  world,
                  memory.item,
                  memory.targetPosition,
                  memory.activation
                );
              }
            }

            if (!hasArrived || !movablePattern || !memory.path)
              memory.path.shift();
          }
          break;
        } else {
          console.error(Date.now(), "Unhandled pattern", pattern);
        }
      }
    }
  };

  return { onUpdate };
}
