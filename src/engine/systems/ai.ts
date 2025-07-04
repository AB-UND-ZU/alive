import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { rerenderEntity } from "./renderer";
import { MOVABLE } from "../components/movable";
import { Behaviour, BEHAVIOUR } from "../components/behaviour";
import { getBiomes, isMovable, isWalkable } from "./movement";
import {
  add,
  copy,
  getDistance,
  normalize,
  random,
  signedDistance,
} from "../../game/math/std";
import { getAttackable, isDead, isFriendlyFire } from "./damage";
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
import { getLockable, isLocked } from "./action";
import { ITEM } from "../components/item";
import { lockDoor } from "./trigger";
import { dropEntity } from "./drop";
import {
  confused,
  createShout,
  rage,
  sleep1,
  sleep2,
} from "../../game/assets/sprites";
import { INVENTORY } from "../components/inventory";
import { FOG } from "../components/fog";
import { LEVEL } from "../components/level";
import { BELONGABLE } from "../components/belongable";
import { iterations } from "../../game/math/tracing";
import { getProjectiles } from "./ballistics";
import { canCast, getExertables } from "./magic";
import { getCell, moveEntity } from "./map";
import { getOpaque } from "./enter";
import { TypedEntity } from "../entities";
import { STATS } from "../components/stats";
import { EXERTABLE } from "../components/exertable";
import { CASTABLE } from "../components/castable";
import { BURNABLE } from "../components/burnable";
import { sellItems } from "./shop";
import { isControllable } from "./freeze";
import { getIdentifierAndComponents } from "../utils";

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
    ])) {
      const patterns = (entity[BEHAVIOUR] as Behaviour).patterns;
      const entityId = world.getEntityId(entity);

      // always reset movement first to cover cases of changed patterns
      if (entity[MOVABLE]) {
        entity[MOVABLE].orientations = [];
      }

      // skip if dead, no patterns or frozen
      if (
        isDead(world, entity) ||
        patterns.length === 0 ||
        !isControllable(world, entity)
      )
        continue;

      for (const pattern of [...patterns]) {
        if (pattern.name === "wait") {
          if (pattern.memory.ticks === 0) {
            patterns.splice(patterns.indexOf(pattern), 1);
            continue;
          }

          pattern.memory.ticks -= 1;
          break;
        } else if (pattern.name === "tumbleweed") {
          const facingPosition = add(entity[POSITION], orientationPoints.right);

          if (pattern.memory.hidden === true) {
            let spawnPosition = copy(entity[POSITION]);
            while (true) {
              const newPosition = {
                x: normalize(
                  spawnPosition.x - 1,
                  world.metadata.gameEntity[LEVEL].size
                ),
                y: spawnPosition.y,
              };
              spawnPosition.x = newPosition.x;
              if (
                !(
                  getBiomes(world, newPosition).includes("desert") ||
                  getBiomes(world, newPosition).includes("path")
                )
              )
                break;
            }
            moveEntity(world, entity, spawnPosition);
            pattern.memory.hidden = false;

            // restore full hp
            if (entity[STATS]) {
              entity[STATS].hp = entity[STATS].maxHp;
            }
          } else if (pattern.memory.hidden === false) {
            if (random(0, 3) === 0) {
              entity[FOG].fixed = false;
              entity[MOVABLE].orientations = ["right"];
              delete pattern.memory.hidden;
            }
          } else if (entity[ORIENTABLE] && !entity[ORIENTABLE].facing) {
            entity[ORIENTABLE].facing = orientations[random(0, 3)];
          } else if (
            !Object.values(getCell(world, facingPosition)).some(
              (cell: TypedEntity) =>
                (cell[BEHAVIOUR]?.patterns || []).some(
                  (pattern) => pattern.name === "tumbleweed"
                )
            )
          ) {
            if (
              !(
                getBiomes(world, facingPosition).includes("desert") ||
                getBiomes(world, facingPosition).includes("path")
              ) ||
              getOpaque(world, facingPosition)
            ) {
              entity[FOG].fixed = true;
              entity[FOG].visibility = "hidden";
              pattern.memory.hidden = true;
              moveEntity(
                world,
                entity,
                add(entity[POSITION], orientationPoints.right)
              );
            } else {
              entity[MOVABLE].orientations = ["right"];
            }
          }

          // rotate tumbleweed
          if (entity[ORIENTABLE]?.facing) {
            entity[ORIENTABLE].facing =
              orientations[
                (orientations.indexOf(entity[ORIENTABLE].facing) + 1) % 4
              ];
          }

          rerenderEntity(world, entity);
          break;
        } else if (pattern.name === "prism") {
          const facing = (entity[ORIENTABLE]?.facing ||
            orientations[random(0, orientations.length - 1)]) as Orientation;

          entity[MOVABLE].orientations = [facing];

          const delta = orientationPoints[facing];
          const position = add(entity[POSITION], delta);

          // avoid eternal fires
          const castableEntity = getExertables(world, position).map(
            (exertable) =>
              world.getEntityByIdAndComponents(exertable[EXERTABLE].castable, [
                CASTABLE,
              ])
          )[0];
          const fireEntity = world.getEntityByIdAndComponents(
            castableEntity?.[CASTABLE].caster,
            [BURNABLE]
          );
          const isEternalFire =
            fireEntity?.[BURNABLE].eternal &&
            castableEntity?.[CASTABLE] &&
            castableEntity[CASTABLE].burn > 0;
          const isLockable = getLockable(world, position);

          // unable to move, attempt reorienting
          if (
            !isMovable(world, entity, position) ||
            isEternalFire ||
            isLockable
          ) {
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

          // show rage if player is in walkable line
          const PRISM_RANGE = 8;
          let inWalkableRange = false;
          for (let range = 1; range <= PRISM_RANGE; range += 1) {
            const ragePosition = add(entity[POSITION], {
              x: delta.x * range,
              y: delta.y * range,
            });
            if (!isMovable(world, entity, ragePosition)) break;

            const attackable = getAttackable(world, ragePosition);
            if (
              attackable &&
              !isFriendlyFire(world, entity, attackable) &&
              entity[TOOLTIP]
            ) {
              inWalkableRange = true;
              break;
            }
          }
          if (inWalkableRange && entity[TOOLTIP] && !entity[TOOLTIP]?.idle) {
            entity[TOOLTIP].idle = rage;
            entity[TOOLTIP].changed = true;
          } else if (!inWalkableRange && entity[TOOLTIP]?.idle) {
            entity[TOOLTIP].idle = undefined;
            entity[TOOLTIP].changed = true;
          }

          break;
        } else if (pattern.name === "eye") {
          if (!entity[TOOLTIP]) continue;

          const heroEntity = getIdentifierAndComponents(world, "hero", [
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

          if (entity[TOOLTIP].idle === rage) {
            entity[TOOLTIP].idle = undefined;
            entity[TOOLTIP].changed = true;
          } else if (!isMoving) {
            entity[TOOLTIP].idle = rage;
            entity[TOOLTIP].changed = true;
          }

          entity[MOVABLE].orientations = orientations;
          rerenderEntity(world, entity);
          break;
        } else if (pattern.name === "orb") {
          if (!entity[TOOLTIP]) continue;
          const heroEntity = getIdentifierAndComponents(world, "hero", [
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
                    .equipment === "primary"
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
            entity[ACTIONABLE].primaryTriggered = true;
            break;
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

            if (
              entity[ORIENTABLE] &&
              entity[ACTIONABLE] &&
              shootingOrientation
            ) {
              entity[ORIENTABLE].facing = shootingOrientation;
              entity[TOOLTIP].idle = rage;
              entity[TOOLTIP].changed = true;
              rerenderEntity(world, entity);
              break;
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

            // sidestep if against a wall
            if (fleeingOrientations.length === 1) {
              const linearOrientation = fleeingOrientations[0];
              const sidestepOrientation =
                orientations[
                  (orientations.indexOf(linearOrientation) +
                    random(0, 1) * 2 +
                    3) %
                    4
                ];
              fleeingOrientations.push(sidestepOrientation);
              fleeingOrientations.push(invertOrientation(sidestepOrientation));
            }

            // only walk every second tick
            if (entity[ORIENTABLE]?.facing) {
              entity[MOVABLE].orientations = [];
              entity[ORIENTABLE].facing = undefined;
            } else {
              entity[MOVABLE].orientations = fleeingOrientations;
            }
            rerenderEntity(world, entity);
            break;
          }
        } else if (pattern.name === "fairy") {
          const heroEntity = getIdentifierAndComponents(world, "hero", [
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
          if (!entity[TOOLTIP]) continue;
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
          if (!entity[TOOLTIP]) continue;
          const memory = pattern.memory;
          entity[BELONGABLE].faction = "hostile";
          entity[TOOLTIP].changed = true;
          entity[TOOLTIP].idle = rage;
          entity[TOOLTIP].enemy = true;
          entity[TOOLTIP].override = memory.shout ? "visible" : undefined;
          entity[TOOLTIP].dialogs = memory.shout
            ? [createShout(memory.shout)]
            : [];

          patterns.splice(patterns.indexOf(pattern), 1);
        } else if (pattern.name === "soothe") {
          if (!entity[TOOLTIP]) continue;
          entity[BELONGABLE].faction = "settler";
          entity[TOOLTIP].changed = true;
          entity[TOOLTIP].idle = undefined;
          entity[TOOLTIP].enemy = undefined;
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
          pattern.name === "drop"
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
              entity[ACTIONABLE].primaryTriggered = true;
            } else if (hasArrived && placementPattern) {
              if (pattern.name === "drop") {
                dropEntity(
                  world,
                  { [INVENTORY]: { items: [memory.item] } },
                  memory.targetPosition
                );
              }
            }

            if (!hasArrived || !movablePattern || !memory.path)
              memory.path.shift();
          }
          break;
        } else if (pattern.name === "sell") {
          sellItems(
            world,
            entity,
            [
              {
                item: pattern.memory.item,
                stock: 1,
                price: pattern.memory.activation,
              },
            ],
            "buy"
          );

          patterns.splice(patterns.indexOf(pattern), 1);
          break;
        } else {
          console.error(Date.now(), "Unhandled pattern", pattern);
        }
      }
    }
  };

  return { onUpdate };
}
