import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { rerenderEntity } from "./renderer";
import { MOVABLE } from "../components/movable";
import { Behaviour, BEHAVIOUR } from "../components/behaviour";
import { getBiome, getTempo, isMovable, isWalkable } from "./movement";
import {
  add,
  choice,
  copy,
  directedDistance,
  getDistance,
  normalize,
  random,
  range,
  reversed,
  rotate,
  shuffle,
  signedDistance,
  within,
} from "../../game/math/std";
import {
  calculateHealing,
  createAmountMarker,
  getAttackable,
  getLimbs,
  isDead,
  isEnemy,
  isFriendlyFire,
  isNeutral,
} from "./damage";
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
import { getLockable, isLocked, isUnlocked } from "./action";
import { ITEM } from "../components/item";
import { castSpell, lockDoor } from "./trigger";
import { dropEntity } from "./drop";
import {
  chestBoss,
  confused,
  createShout,
  createText,
  fireWaveTower,
  rage,
  rage2,
  sleep1,
  sleep2,
  waterWaveTower,
  waveTower,
  waveTowerCharged,
} from "../../game/assets/sprites";
import { colors } from "../../game/assets/colors";
import { INVENTORY } from "../components/inventory";
import { FOG } from "../components/fog";
import { LEVEL } from "../components/level";
import { BELONGABLE } from "../components/belongable";
import {
  degreesToOrientations,
  iterations,
  pointToDegree,
} from "../../game/math/tracing";
import { getProjectiles, shootArrow } from "./ballistics";
import { canCast, getExertables } from "./magic";
import { disposeEntity, getCell, moveEntity, registerEntity } from "./map";
import { getFragment, getOpaque } from "./enter";
import { TypedEntity } from "../entities";
import { STATS } from "../components/stats";
import { EXERTABLE } from "../components/exertable";
import { CASTABLE } from "../components/castable";
import { BURNABLE } from "../components/burnable";
import { createPopup } from "./popup";
import { isControllable } from "./freeze";
import {
  getIdentifier,
  getIdentifierAndComponents,
  getIdentifiersAndComponents,
  setIdentifier,
} from "../utils";
import { SPRITE } from "../components/sprite";
import { IDENTIFIABLE } from "../components/identifiable";
import { createCell } from "../../bindings/creation";
import addAttackable, { ATTACKABLE } from "../components/attackable";
import { RECHARGABLE } from "../components/rechargable";
import { addAffectable, addCollidable, addShootable } from "../components";
import { COLLIDABLE } from "../components/collidable";
import { NPC } from "../components/npc";
import { queueMessage } from "../../game/assets/utils";
import { pickupOptions, play } from "../../game/sound";
import { isImmersible } from "./immersion";
import { CLICKABLE } from "../components/clickable";
import { getEmptyAffectable } from "../components/affectable";
import { HARVESTABLE } from "../components/harvestable";
import { shootHoming } from "./homing";
import { EQUIPPABLE } from "../components/equippable";
import { SHOOTABLE } from "../components/shootable";
import { createSequence, getSequence } from "./sequence";
import { BranchSequence } from "../components/sequencable";
import { generateNpcData, UnitDefinition } from "../../game/balancing/units";

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
      const size = world.metadata.gameEntity[LEVEL].size;

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
        } else if (pattern.name === "passive") {
          if (!entity[STATS] || !entity[SPRITE] || !entity[TOOLTIP]) {
            patterns.splice(patterns.indexOf(pattern), 1);
            continue;
          }

          if (entity[CLICKABLE]?.clicked) {
            entity[BELONGABLE].faction = "wild";
            entity[SPRITE] = { ...entity[SPRITE], name: "" };

            // apply invincible and dialog manually to avoid extra tick
            world.removeComponentFromEntity(
              entity as TypedEntity<"CLICKABLE">,
              "CLICKABLE"
            );

            if (entity[HARVESTABLE]) {
              world.removeComponentFromEntity(
                entity as TypedEntity<"HARVESTABLE">,
                "HARVESTABLE"
              );
            }

            if (entity[TOOLTIP]) {
              entity[TOOLTIP].idle = rage;
              entity[TOOLTIP].changed = true;
            }

            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "wait", memory: { ticks: 4 } },
              {
                name: "dialog",
                memory: { idle: undefined },
              },
              { name: "wait", memory: { ticks: 1 } },
              { name: "vulnerable", memory: {} }
            );
          }
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
                getBiome(world, newPosition) !== "desert" ||
                getOpaque(world, newPosition) ||
                isImmersible(world, newPosition)
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
              getBiome(world, facingPosition) !== "desert" ||
              getOpaque(world, facingPosition) ||
              isImmersible(world, facingPosition)
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
          const target = add(entity[POSITION], delta);

          // avoid eternal fires
          const castableEntity = getExertables(world, target).map((exertable) =>
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
          const isLockable = getLockable(world, target);
          const isSameBiome =
            getBiome(world, entity[POSITION]) === getBiome(world, target);

          // unable to move, attempt reorienting
          if (
            !isMovable(world, entity, target) ||
            isEternalFire ||
            isLockable ||
            !isSameBiome
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
          const distance = heroEntity
            ? getDistance(entity[POSITION], heroEntity[POSITION], size, 0.69)
            : Infinity;
          const aggro = distance < 3.5;
          const close = distance < 4.25;
          const isVisible = entity[FOG].visibility === "visible";
          const isMoving = !entity[TOOLTIP].idle;
          const attackingOrientations = heroEntity
            ? relativeOrientations(
                world,
                entity[POSITION],
                heroEntity[POSITION]
              )
            : [];

          if (!heroEntity || (!aggro && !isMoving) || !isVisible || !close) {
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
                entity[ORIENTABLE].facing = attackingOrientations[0];
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
        } else if (pattern.name === "chase" || pattern.name === "chase_slow") {
          const heroEntity = getIdentifierAndComponents(world, "hero", [
            POSITION,
          ]);

          if (!heroEntity) break;

          const distance = getDistance(
            entity[POSITION],
            heroEntity[POSITION],
            size,
            0.69
          );

          if (distance > 7) break;

          const halfStep = pattern.name === "chase_slow";
          const attackingOrientations = relativeOrientations(
            world,
            entity[POSITION],
            heroEntity[POSITION]
          );

          // sidestep if against a wall
          const movements = shuffle(attackingOrientations);
          if (attackingOrientations.length === 1) {
            const linearOrientation = attackingOrientations[0];
            const sidestepOrientation =
              orientations[
                (orientations.indexOf(linearOrientation) +
                  random(0, 1) * 2 +
                  3) %
                  4
              ];
            movements.push(sidestepOrientation);
            movements.push(invertOrientation(sidestepOrientation));
          }

          if (entity[ORIENTABLE]?.facing && halfStep) {
            entity[MOVABLE].orientations = [];
            entity[ORIENTABLE].facing = undefined;
          } else {
            // don't run into spikes
            const movableOrientations = movements.filter((movingOrientation) =>
              isMovable(
                world,
                entity,
                add(entity[POSITION], orientationPoints[movingOrientation])
              )
            );
            entity[MOVABLE].orientations = movableOrientations;
          }
          rerenderEntity(world, entity);
          break;
        } else if (
          pattern.name === "orb" ||
          pattern.name === "archer" ||
          pattern.name === "violet"
        ) {
          if (!entity[TOOLTIP]) continue;

          const isPrimary = pattern.name === "orb" || pattern.name === "violet";
          const halfStep = isPrimary;
          const canReposition =
            pattern.name === "archer" || pattern.name === "violet";
          const range = pattern.name === "violet" ? 6 : 9;
          const gap = pattern.name === "violet" ? 1 : 2;

          const heroEntity = getIdentifierAndComponents(world, "hero", [
            POSITION,
            MOVABLE,
          ]);
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
          const canShoot = isPrimary
            ? canCast(
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
              )
            : true;
          const isShooting = !!entity[TOOLTIP].idle;
          const flee = canReposition
            ? blockDistance < gap + 1
            : circularDistance < 4;
          const attack =
            blockDistance > gap &&
            (isPrimary
              ? visualDistance < (range / 9) * 7
              : blockDistance <= range);
          const repositioning = canReposition && blockDistance <= range;
          const delta = heroEntity
            ? {
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
              }
            : { x: 0, y: 0 };

          if (isShooting && entity[ACTIONABLE]) {
            entity[TOOLTIP].idle = undefined;
            entity[TOOLTIP].changed = true;

            if (isPrimary) {
              entity[ACTIONABLE].primaryTriggered = true;
            } else {
              entity[ACTIONABLE].secondaryTriggered = true;
            }
            break;
          } else if (canShoot && attack && heroEntity) {
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

          let movements: Orientation[] = [];
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
            const sidestep = !halfStep && random(0, 10) === 0;
            movements = sidestep
              ? [...reversed(fleeingOrientations)]
              : fleeingOrientations;
          } else if (heroEntity && repositioning) {
            if (delta.x === 0 || delta.y === 0) break;

            const repositionOrientations: Orientation[] = [];
            if (Math.abs(delta.x) < Math.abs(delta.y)) {
              repositionOrientations.push(
                degreesToOrientations(pointToDegree({ x: delta.x, y: 0 }))[0]
              );
              repositionOrientations.push(
                invertOrientation(
                  degreesToOrientations(pointToDegree({ x: 0, y: delta.y }))[0]
                )
              );
            } else {
              repositionOrientations.push(
                degreesToOrientations(pointToDegree({ x: 0, y: delta.y }))[0]
              );
              repositionOrientations.push(
                invertOrientation(
                  degreesToOrientations(pointToDegree({ x: delta.x, y: 0 }))[0]
                )
              );
            }

            movements = repositionOrientations;
          }

          // casters only walk every second tick
          if (entity[ORIENTABLE]?.facing && halfStep) {
            entity[MOVABLE].orientations = [];
            entity[ORIENTABLE].facing = undefined;
          } else {
            // don't run into spikes
            const movableOrientations = movements.filter((movingOrientation) =>
              isMovable(
                world,
                entity,
                add(entity[POSITION], orientationPoints[movingOrientation])
              )
            );
            entity[MOVABLE].orientations = movableOrientations;
          }
          rerenderEntity(world, entity);
          break;
        } else if (pattern.name === "fairy") {
          const heroEntity = getIdentifierAndComponents(world, "hero", [
            POSITION,
          ]);
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
        } else if (pattern.name === "shout") {
          if (!entity[TOOLTIP]) continue;
          const memory = pattern.memory;

          entity[TOOLTIP].enemy = true;
          entity[TOOLTIP].override = "visible";
          for (const [key, value] of Object.entries(memory)) {
            // TODO: find a better way to infer types
            (entity[TOOLTIP] as any)[key] = value;
          }
          entity[TOOLTIP].changed = true;

          patterns.splice(patterns.indexOf(pattern), 1);
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
        } else if (pattern.name === "watch") {
          const memory = pattern.memory;
          const nextIndex = patterns.indexOf(pattern) + 1;

          if (memory.target) {
            const targetEntity = world.getEntityByIdAndComponents(
              memory.target,
              [POSITION]
            );

            // handle target leaving watched area
            if (
              !targetEntity ||
              !within(
                memory.topLeft,
                memory.bottomRight,
                targetEntity[POSITION],
                size
              )
            ) {
              memory.target = undefined;

              if (patterns[nextIndex]?.name === "kill") {
                patterns.splice(nextIndex, 1);
              }

              if (entity[TOOLTIP]) {
                entity[TOOLTIP].idle = undefined;
                entity[TOOLTIP].changed = true;
              }

              // walk back to beginning
              patterns.splice(nextIndex, 0, {
                name: "move",
                memory: { targetPosition: memory.origin },
              });
            }

            continue;
          }

          // scan area
          const delta = {
            x: directedDistance(memory.topLeft.x, memory.bottomRight.x, size),
            y: directedDistance(memory.topLeft.y, memory.bottomRight.y, size),
          };

          for (let offsetX = 0; offsetX <= delta.x; offsetX += 1) {
            for (let offsetY = 0; offsetY <= delta.y; offsetY += 1) {
              const target = add(memory.topLeft, { x: offsetX, y: offsetY });
              const attackable = getAttackable(world, target);

              // attack intruders
              if (
                attackable &&
                !isNeutral(world, attackable) &&
                isEnemy(world, entity) !== isEnemy(world, attackable)
              ) {
                memory.target = world.getEntityId(attackable);
                patterns.splice(nextIndex, 0, {
                  name: "kill",
                  memory: { target: memory.target },
                });

                if (entity[TOOLTIP]) {
                  entity[TOOLTIP].idle = rage;
                  entity[TOOLTIP].changed = true;
                }
              }
            }
          }
        } else if (pattern.name === "guard") {
          const memory = pattern.memory;
          entity[MOVABLE].orientations = [];

          // assign entrance
          if (!memory.entrance) {
            for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
              for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
                const target = add(entity[POSITION], {
                  x: offsetX,
                  y: offsetY,
                });
                const lockable = getLockable(world, target);
                if (lockable) {
                  memory.entrance = lockable;
                }
              }
            }
          }

          // invalid placement of guard
          if (!memory.entrance) {
            patterns.splice(patterns.indexOf(pattern), 1);
            continue;
          }

          const heroEntity = getIdentifierAndComponents(world, "hero", [
            POSITION,
          ]);
          const distance = heroEntity
            ? getDistance(
                memory.entrance[POSITION],
                heroEntity[POSITION],
                size,
                1
              )
            : Infinity;
          const unlocked = isUnlocked(world, memory.entrance);
          const fromInside =
            heroEntity && entity[POSITION].y === heroEntity[POSITION].y;
          const shouldOpen =
            heroEntity && (unlocked || fromInside) && distance <= 2.5;
          const shouldClose = !(unlocked || fromInside) || distance >= 3;
          const delta = {
            x: memory.entrance[POSITION].x - entity[POSITION].x,
            y: 0,
          };
          const sidesteppedOrientation = relativeOrientations(world, delta, {
            x: 0,
            y: 0,
          })[0];

          if (
            shouldOpen &&
            (!sidesteppedOrientation || Math.abs(delta.x) < 2)
          ) {
            const awayFromHero = relativeOrientations(
              world,
              heroEntity[POSITION],
              { x: entity[POSITION].x, y: heroEntity[POSITION].y }
            )[0];
            const leftPath =
              getTempo(world, add(entity[POSITION], orientationPoints.left)) !==
              0;
            const rightPath =
              getTempo(
                world,
                add(entity[POSITION], orientationPoints.right)
              ) !== 0;
            entity[MOVABLE].orientations = [
              sidesteppedOrientation ||
                awayFromHero ||
                (leftPath && !rightPath && "right") ||
                (rightPath && !leftPath && "left") ||
                choice("left", "right"),
            ];
            break;
          } else if (shouldClose && sidesteppedOrientation) {
            entity[MOVABLE].orientations = [
              invertOrientation(sidesteppedOrientation),
            ];
            break;
          }
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
        } else if (pattern.name === "rose") {
          if (!entity[STATS] || !entity[ORIENTABLE]) {
            patterns.splice(patterns.indexOf(pattern), 1);
            continue;
          }

          const heroEntity = getIdentifierAndComponents(world, "hero", [
            POSITION,
          ]);
          const flee =
            heroEntity &&
            getDistance(entity[POSITION], heroEntity[POSITION], size) < 4;

          if (flee) {
            const fleeingOrientations = relativeOrientations(
              world,
              heroEntity[POSITION],
              entity[POSITION]
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

            if (entity[ORIENTABLE].facing) {
              entity[MOVABLE].orientations = [];
              entity[ORIENTABLE].facing = undefined;
            } else {
              entity[MOVABLE].orientations = fleeingOrientations;
            }
          }
        } else if (pattern.name === "clover") {
          if (!entity[STATS] || !entity[ORIENTABLE] || !entity[TOOLTIP]) {
            patterns.splice(patterns.indexOf(pattern), 1);
            continue;
          }

          const heroEntity = getIdentifierAndComponents(world, "hero", [
            POSITION,
          ]);

          if (!heroEntity) break;

          const distance = getDistance(
            entity[POSITION],
            heroEntity[POSITION],
            size,
            0.69
          );
          if (distance > 5) break;

          const generation = (pattern.memory.generation || 0) + 1;
          pattern.memory.generation = generation;

          const healingDelay = 16;
          const healingPause = 3;
          const healingDuration = 10;
          const healingAmount = 6;
          const healingInterval = 2;
          const wait = generation > healingDelay;
          const healing = generation > healingDelay + healingPause;
          const done =
            generation > healingDelay + healingPause * 2 + healingDuration;
          const restart =
            generation > healingDelay + healingPause * 3 + healingDuration;

          if (wait) {
            if (healing && !done && generation % healingInterval === 0) {
              const { hp, healing } = calculateHealing(
                entity[STATS],
                healingAmount
              );
              entity[STATS].hp = hp;
              createAmountMarker(world, entity, healing, "up", "true");
              if (healing > 0) {
                play("pickup", pickupOptions.hp);
              }
            }

            if ((healing && !done && entity[TOOLTIP].idle) || restart) {
              entity[TOOLTIP].idle = undefined;
              entity[TOOLTIP].changed = true;
              if (restart) pattern.memory.generation = 0;
            } else if (((wait && !healing) || done) && !entity[TOOLTIP].idle) {
              entity[TOOLTIP].idle = rage;
              entity[TOOLTIP].changed = true;
            }
            break;
          }
        } else if (
          pattern.name === "kill" ||
          pattern.name === "heal" ||
          pattern.name === "unlock" ||
          pattern.name === "collect" ||
          pattern.name === "drop"
        ) {
          const movablePattern = ["kill", "heal", "collect"].includes(
            pattern.name
          );
          const placementPattern = ["drop", "sell"].includes(pattern.name);
          const memory = pattern.memory;
          const itemEntity =
            (memory.item && world.getEntityById(memory.item)) ||
            (memory.identifier &&
              world
                .getEntities([IDENTIFIABLE, ITEM])
                .filter(
                  (item) =>
                    item[IDENTIFIABLE].name === memory.identifier &&
                    item[ITEM].carrier !== entityId
                )[0]);

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
          const healed =
            pattern.name === "heal" &&
            (!targetEntity ||
              !targetEntity[STATS] ||
              targetEntity[STATS].hp >= targetEntity[STATS].maxHp ||
              !isFriendlyFire(world, entity, targetEntity));
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

          if (killed || healed || unlocked || collected || dropped) {
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

            if ((!hasArrived || !movablePattern) && memory.path)
              memory.path.shift();
          }
          break;
        } else if (pattern.name === "sell") {
          createPopup(world, entity, {
            deals: pattern.memory.deals,
            tabs: ["buy"],
          });
          patterns.splice(patterns.indexOf(pattern), 1);
          break;
        } else if (pattern.name === "action") {
          if (entity[ACTIONABLE] && pattern.memory.primary) {
            entity[ACTIONABLE].primaryTriggered = true;
          } else if (entity[ACTIONABLE] && pattern.memory.secondary) {
            entity[ACTIONABLE].secondaryTriggered = true;
          }
          patterns.splice(patterns.indexOf(pattern), 1);
          break;
        } else if (pattern.name === "invincible") {
          // drop loaded charges
          if (entity[RECHARGABLE]) {
            entity[RECHARGABLE].hit = false;

            dropEntity(
              world,
              {
                [RECHARGABLE]: entity[RECHARGABLE],
              },
              entity[POSITION]
            );
          }

          // drop any stuck arrows of all limbs
          const limbs = getLimbs(world, entity);

          for (const limbEntity of limbs) {
            if (limbEntity[SHOOTABLE]) {
              dropEntity(
                world,
                {
                  [SHOOTABLE]: limbEntity[SHOOTABLE],
                },
                limbEntity[POSITION]
              );
              limbEntity[SHOOTABLE].shots = 0;
              world.removeComponentFromEntity(
                limbEntity as TypedEntity<"SHOOTABLE">,
                "SHOOTABLE"
              );
            }
          }

          // prevent attacks and walking into entity
          if (entity[ATTACKABLE]) {
            world.removeComponentFromEntity(
              entity as TypedEntity<"ATTACKABLE">,
              "ATTACKABLE"
            );
            addCollidable(world, entity, {});
          }

          patterns.splice(patterns.indexOf(pattern), 1);
        } else if (pattern.name === "vulnerable") {
          const limbs = getLimbs(world, entity);
          for (const limbEntity of limbs) {
            addShootable(world, limbEntity, { shots: 0 });
          }

          const mobType = entity[NPC]?.type;
          const mobUnit = mobType
            ? generateNpcData(mobType)
            : ({} as Partial<UnitDefinition>);
          addAttackable(world, entity, { scratchColor: mobUnit.scratch });
          addAffectable(world, entity, getEmptyAffectable());
          world.removeComponentFromEntity(
            entity as TypedEntity<"COLLIDABLE">,
            "COLLIDABLE"
          );
          patterns.splice(patterns.indexOf(pattern), 1);
        } else if (pattern.name === "spawner") {
          const spawners = world
            .getEntities([IDENTIFIABLE, BEHAVIOUR])
            .filter(
              (spawner) =>
                spawner[IDENTIFIABLE].name === entity[IDENTIFIABLE]?.name
            );
          const spawnedEntities = world
            .getEntities([IDENTIFIABLE, NPC])
            .filter(
              (mob) => mob[IDENTIFIABLE].name === `${pattern.memory.name}:mob`
            );

          if (
            spawnedEntities.length > 0 &&
            pattern.memory.countdown === undefined
          )
            break;

          const countdown =
            pattern.memory.countdown === undefined
              ? undefined
              : pattern.memory.countdown - generation;

          let nextSpawn = pattern.memory.types[0];

          if (countdown === undefined) {
            // remove spawner
            if (pattern.memory.types.length === 0) {
              patterns.splice(patterns.indexOf(pattern), 1);
              disposeEntity(world, entity);
              break;
            }

            // trigger all spawners
            spawners.forEach((spawner) => {
              const spawnerPattern = spawner[BEHAVIOUR].patterns[0];
              if (!spawnerPattern) return;

              spawnerPattern.memory.countdown = generation + 3 * 4 + 1;
            });
          } else if (countdown === 0) {
            // spawn next mob
            pattern.memory.types.shift();
            pattern.memory.countdown = undefined;

            if (nextSpawn) {
              const mobEntity = createCell(
                world,
                entity[POSITION],
                nextSpawn,
                "fog"
              ).cell;
              setIdentifier(world, mobEntity, `${pattern.memory.name}:mob`);
              registerEntity(world, mobEntity);
            }
          }

          // show countdown
          if (countdown !== undefined && countdown <= 3 * 4 && nextSpawn) {
            queueMessage(world, entity, {
              line:
                countdown === 0
                  ? [rage]
                  : countdown % 4 === 0
                  ? createText(`${countdown / 4}`, colors.red)
                  : createText("∙", colors.maroon),
              orientation: "up",
              fast: false,
              delay: 0,
            });
          }
        } else if (pattern.name === "dummy") {
          if (!entity[STATS]) {
            patterns.splice(patterns.indexOf(pattern), 1);
            continue;
          }

          if (entity[STATS].hp < entity[STATS].maxHp) {
            if (!pattern.memory.heal) {
              pattern.memory.heal = generation + 15;
              continue;
            }
            if (pattern.memory.heal + 2 > generation) continue;

            pattern.memory.heal = generation;

            const { hp, healing } = calculateHealing(
              entity[STATS],
              Math.floor(entity[STATS].maxHp / 5)
            );
            entity[STATS].hp = hp;
            if (healing > 0) {
              createAmountMarker(world, entity, healing, "up", "true");
              play("pickup", pickupOptions.hp);
            }
          } else if (pattern.memory.heal) {
            delete pattern.memory.heal;
          }
        } else if (pattern.name === "oak_boss") {
          const heroEntity = getIdentifierAndComponents(world, "hero", [
            POSITION,
          ]);
          const castableEntity = getFragment(
            world,
            add(entity[POSITION], { x: 0, y: 1 })
          ) as TypedEntity<"POSITION" | "ORIENTABLE"> | undefined;
          const stemEntity = getFragment(
            world,
            add(entity[POSITION], { x: 0, y: 2 })
          ) as TypedEntity<"POSITION"> | undefined;
          if (
            !heroEntity ||
            !entity[STATS] ||
            !entity[SPRITE] ||
            !entity[TOOLTIP] ||
            !castableEntity ||
            !stemEntity
          ) {
            patterns.splice(patterns.indexOf(pattern), 1);
            continue;
          }

          const percentage = (100 * entity[STATS].hp) / entity[STATS].maxHp;

          if (pattern.memory.phase === undefined) {
            // set initial phase and low hp trigger
            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "oak_boss", memory: { phase: 40 } },
              { name: "oak_boss", memory: { phase: 0 } }
            );
            break;
          }

          const distance = heroEntity
            ? getDistance({ x: 0, y: 0 }, heroEntity[POSITION], size)
            : Infinity;

          if (distance > 10) break;

          if (pattern.memory.phase === 0) {
            // sleep until player clicks and wakes up
            entity[TOOLTIP].idle = [sleep1, sleep2][generation % 2];
            entity[TOOLTIP].changed = true;

            if (entity[CLICKABLE]?.clicked) {
              entity[BELONGABLE].faction = "wild";
              entity[TOOLTIP].override = "hidden";
              entity[TOOLTIP].changed = true;

              entity[TOOLTIP].idle = undefined;

              world.removeComponentFromEntity(
                entity as TypedEntity<"CLICKABLE">,
                "CLICKABLE"
              );

              patterns.splice(
                patterns.indexOf(pattern),
                1,
                { name: "dialog", memory: { override: "hidden" } },
                { name: "wait", memory: { ticks: 3 } },
                { name: "oak_boss", memory: { phase: 1 } }
              );
            }
          } else if (pattern.memory.phase === 1) {
            // open eyes
            [-1, 1].forEach((offsetX) => {
              const eyeEntity = getFragment(
                world,
                add(entity[POSITION], { x: offsetX, y: 0 })
              );
              if (!eyeEntity) return;
              eyeEntity[ORIENTABLE].facing = "up";
              rerenderEntity(world, eyeEntity);
            });

            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "wait", memory: { ticks: 3 } },
              { name: "oak_boss", memory: { phase: 2 } }
            );
          } else if (pattern.memory.phase === 2) {
            // shout at player
            patterns.splice(
              patterns.indexOf(pattern),
              1,
              {
                name: "shout",
                memory: {
                  dialogs: [
                    createShout(
                      choice(
                        "Who awakens me?",
                        "Why disturb me?",
                        "I was sleeping..."
                      )
                    ),
                  ],
                },
              },
              { name: "wait", memory: { ticks: 5 } },
              {
                name: "shout",
                memory: {
                  dialogs: [
                    createShout(
                      choice(
                        "You will pay\u0112",
                        "That's your end\u0112",
                        "Prepare to die\u0112"
                      )
                    ),
                  ],
                },
              },
              { name: "wait", memory: { ticks: 7 } },
              { name: "oak_boss", memory: { phase: 3 } }
            );
          } else if (pattern.memory.phase === 3) {
            // hide dialogs
            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "dialog", memory: { override: "hidden", dialogs: [] } },
              { name: "wait", memory: { ticks: 3 } },
              { name: "dialog", memory: { idle: rage } },
              { name: "wait", memory: { ticks: 2 } },
              { name: "dialog", memory: { idle: undefined } },
              { name: "oak_boss", memory: { phase: 4 } }
            );
          } else if (pattern.memory.phase === 4) {
            // create terrain
            shootHoming(world, castableEntity, {
              type: "oakTower",
              positions: [
                add(castableEntity[POSITION], {
                  x: -8,
                  y: 0,
                }),
              ],
            });
            shootHoming(world, castableEntity, {
              type: "oakTower",
              positions: [
                add(castableEntity[POSITION], {
                  x: 8,
                  y: 0,
                }),
              ],
            });

            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "wait", memory: { ticks: 3 } },
              { name: "oak_boss", memory: { phase: 5 } }
            );
          } else if (pattern.memory.phase === 5) {
            // become vulnerable and rage before first wave
            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "vulnerable", memory: {} },
              { name: "wait", memory: { ticks: 4 } },
              { name: "dialog", memory: { idle: rage } },
              { name: "wait", memory: { ticks: 2 } },
              { name: "dialog", memory: { idle: undefined } },
              { name: "oak_boss", memory: { phase: 6 } }
            );
          } else if (pattern.memory.phase === 6) {
            // cast first wave
            castSpell(world, castableEntity, {
              [ITEM]: {
                carrier: -1,
                bound: false,
                amount: 1,
                equipment: "primary",
                primary: "wave",
                material: "gold",
              },
            });

            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "wait", memory: { ticks: 10 } },
              { name: "oak_boss", memory: { phase: 7 } }
            );
          } else if (pattern.memory.phase === 7) {
            // schedule phases and prevent repeating last one
            let phases = shuffle([10, 20, 30]);

            if (pattern.memory.shuffled) {
              phases = shuffle(pattern.memory.shuffled.slice(0, 2));
              phases.splice(random(1, 2), 0, pattern.memory.shuffled[2]);
            }

            patterns.splice(
              patterns.indexOf(pattern),
              1,
              ...phases.map(
                (phase) => ({ name: "oak_boss", memory: { phase } } as const)
              ),
              { name: "oak_boss", memory: { phase: 7, shuffled: phases } }
            );
          } else if (pattern.memory.phase === 10) {
            // queue homing phase several times
            patterns.splice(
              patterns.indexOf(pattern),
              1,
              ...Array.from({ length: 2 }).map(
                () => ({ name: "oak_boss", memory: { phase: 11 } } as const)
              )
            );
          } else if (pattern.memory.phase === 11) {
            // rage oak and towers before shooting homing shot
            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "invincible", memory: {} },
              { name: "dialog", memory: { idle: rage } },
              { name: "wait", memory: { ticks: 2 } },
              { name: "dialog", memory: { idle: undefined } },
              { name: "oak_boss", memory: { phase: 12 } }
            );

            const towerPhase = choice(10, 20);
            const towerFlipped = choice(true, false);
            const availableTowers = getIdentifiersAndComponents(
              world,
              "oak:tower",
              [BEHAVIOUR]
            );
            const selectedTowers =
              towerPhase === 20
                ? availableTowers
                : shuffle(availableTowers).slice(-1);
            selectedTowers.forEach((towerEntity) => {
              towerEntity[BEHAVIOUR].patterns = [
                {
                  name: "oak_tower",
                  memory: { phase: towerPhase, flipped: towerFlipped },
                },
              ];
            });
          } else if (pattern.memory.phase === 12) {
            // shoot homing shot
            const homingEntity = shootHoming(world, castableEntity, {
              type: "oakHedge",
              target: world.getEntityId(heroEntity),
              positions: [],
              ttl: 25,
            });
            setIdentifier(world, homingEntity, "oak:homing");
            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "wait", memory: { ticks: 4 } },
              {
                name: "oak_boss",
                memory: { phase: 13 },
              }
            );
          } else if (pattern.memory.phase === 13) {
            // shoot double circular discs
            const discSurround = [
              { x: 3, y: 0 },
              { x: 3, y: 1 },
              { x: 1, y: 1 },
              { x: 1, y: 3 },
              { x: 0, y: 3 },
              { x: -1, y: 3 },
              { x: -1, y: 1 },
              { x: -3, y: 1 },
              { x: -3, y: 0 },
              { x: -3, y: -2 },
              { x: -2, y: -2 },
              { x: -2, y: -3 },
              { x: 0, y: -3 },
              { x: 2, y: -3 },
              { x: 2, y: -2 },
              { x: 3, y: -2 },
            ];
            const discCount = 4;
            const discOffset = 4;

            Array.from({ length: discCount }).forEach((_, index) => {
              const rotatedDiscs = rotate(discSurround, index * discOffset);
              const circularDiscs = [...rotatedDiscs, rotatedDiscs[0]];
              shootHoming(world, castableEntity, {
                type: "goldDisc",
                positions: circularDiscs,
                ttl: 15,
              });
              shootHoming(world, castableEntity, {
                type: "goldDisc",
                positions: [...reversed(circularDiscs)],
                ttl: 15,
              });
            });

            patterns.splice(patterns.indexOf(pattern), 1, {
              name: "oak_boss",
              memory: { phase: 14, generation },
            });
          } else if (pattern.memory.phase === 14) {
            // wait for homing shot to hit
            const homingEntity = getIdentifier(world, "oak:homing");

            if (!homingEntity) {
              // suspend towers
              getIdentifiersAndComponents(world, "oak:tower", [
                BEHAVIOUR,
              ]).forEach((towerEntity) => {
                towerEntity[BEHAVIOUR].patterns = [];
              });

              patterns.splice(
                patterns.indexOf(pattern),
                1,

                { name: "vulnerable", memory: {} },
                { name: "wait", memory: { ticks: 25 } }
              );
            }
          } else if (pattern.memory.phase === 20) {
            // queue wave phase several times
            patterns.splice(
              patterns.indexOf(pattern),
              1,
              ...Array.from({ length: 3 }).map(
                () => ({ name: "oak_boss", memory: { phase: 21 } } as const)
              )
            );
          } else if (pattern.memory.phase === 21) {
            // rage before wave and queue towers
            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "dialog", memory: { idle: rage } },
              { name: "wait", memory: { ticks: 2 } },
              { name: "dialog", memory: { idle: undefined } },
              { name: "oak_boss", memory: { phase: 22 } }
            );

            const availableTowers = getIdentifiersAndComponents(
              world,
              "oak:tower",
              [BEHAVIOUR, EQUIPPABLE]
            );
            availableTowers.forEach((towerEntity) => {
              const spellItem = world.getEntityByIdAndComponents(
                towerEntity[EQUIPPABLE].primary,
                [ITEM]
              );
              if (!spellItem) return;
              spellItem[ITEM].primary = "wave";
              spellItem[ITEM].material = "iron";
              spellItem[ITEM].element = undefined;
              towerEntity[BEHAVIOUR].patterns = [
                { name: "wait", memory: { ticks: random(5, 13) } },
                { name: "dialog", memory: { idle: rage } },
                { name: "wait", memory: { ticks: 2 } },
                { name: "dialog", memory: { idle: undefined } },
                { name: "action", memory: { primary: true } },
              ];
            });
          } else if (pattern.memory.phase === 22) {
            // cast wave
            castSpell(world, castableEntity, {
              [ITEM]: {
                carrier: -1,
                bound: false,
                amount: 1,
                equipment: "primary",
                primary: "wave",
                material: "gold",
              },
            });

            patterns.splice(patterns.indexOf(pattern), 1, {
              name: "wait",
              memory: { ticks: 15 },
            });
          } else if (pattern.memory.phase === 30) {
            // check available spawn points
            const plantSpawns = [
              { x: 6, y: 0 },
              { x: 5, y: 2 },
              { x: 3, y: 3 },
              { x: 0, y: 4 },
              { x: -3, y: 3 },
              { x: -5, y: 2 },
              { x: -6, y: 0 },
              { x: -5, y: -2 },
              { x: -3, y: -3 },
              { x: 0, y: -4 },
              { x: 3, y: -3 },
              { x: 5, y: -2 },
            ];
            const plantCount = 3;
            const plantOffset = 4;

            const selectedSpawns = [];
            for (let offset = 0; offset < plantOffset; offset += 1) {
              for (let index = 0; index < plantCount; index += 1) {
                const position = plantSpawns[offset + index * plantOffset];
                const cell = getCell(world, position);
                const bushEntity = Object.values(cell).find(
                  (bush) => bush[IDENTIFIABLE]?.name === "oak:bush"
                );

                if (!bushEntity) continue;

                selectedSpawns.push(position);
              }
              if (selectedSpawns.length > 0) break;
            }

            // no plants left, let towers heal only
            if (selectedSpawns.length === 0) {
              patterns.splice(patterns.indexOf(pattern), 1, {
                name: "oak_boss",
                memory: { phase: 33 },
              });
              break;
            }

            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "invincible", memory: {} },
              {
                name: "shout",
                memory: {
                  dialogs: [
                    createShout(
                      choice(
                        "Sprout\u0112",
                        "Rise\u0112",
                        "Heal\u0112",
                        "Restore\u0112"
                      )
                    ),
                  ],
                },
              },
              { name: "wait", memory: { ticks: 5 } },
              { name: "dialog", memory: { override: "hidden", dialogs: [] } },
              { name: "oak_boss", memory: { phase: 31 } },
              { name: "wait", memory: { ticks: 4 } },
              { name: "vulnerable", memory: {} },
              {
                name: "oak_boss",
                memory: {
                  phase: 32,
                  spawns: selectedSpawns,
                },
              },
              { name: "oak_boss", memory: { phase: 33 } }
            );
          } else if (pattern.memory.phase === 31) {
            // cast wave
            castSpell(world, castableEntity, {
              [ITEM]: {
                carrier: -1,
                bound: false,
                amount: 1,
                equipment: "primary",
                primary: "wave",
                element: "earth",
              },
            });
            patterns.splice(patterns.indexOf(pattern), 1);
          } else if (pattern.memory.phase === 32) {
            // spawn mobs
            pattern.memory.spawns.forEach((spawn: Position) => {
              const cell = getCell(world, spawn);
              const bushEntity = Object.values(cell).find(
                (bush) => bush[IDENTIFIABLE]?.name === "oak:bush"
              );
              if (!bushEntity) return;

              disposeEntity(world, bushEntity);
              createCell(world, copy(spawn), "oakClover", "hidden");
            });
            patterns.splice(patterns.indexOf(pattern), 1);
          } else if (pattern.memory.phase === 33) {
            // let towers heal and wait
            const availableTowers = getIdentifiersAndComponents(
              world,
              "oak:tower",
              [BEHAVIOUR, EQUIPPABLE, ORIENTABLE, POSITION]
            );
            availableTowers.forEach((towerEntity, index) => {
              const spellItem = world.getEntityByIdAndComponents(
                towerEntity[EQUIPPABLE].primary,
                [ITEM]
              );
              if (!spellItem) return;
              spellItem[ITEM].primary = "bolt";
              spellItem[ITEM].material = undefined;
              spellItem[ITEM].element = "earth";
              towerEntity[ORIENTABLE].facing =
                signedDistance(towerEntity[POSITION].x, 0, size) > 0
                  ? "right"
                  : "left";
              towerEntity[BEHAVIOUR].patterns = [
                { name: "wait", memory: { ticks: index * 2 + 1 } },
                ...Array.from({ length: 5 })
                  .map(
                    () =>
                      [
                        { name: "dialog", memory: { idle: rage } },
                        { name: "wait", memory: { ticks: 2 } },
                        { name: "dialog", memory: { idle: undefined } },
                        { name: "action", memory: { primary: true } },
                        { name: "wait", memory: { ticks: 4 } },
                      ] as const
                  )
                  .flat(),
              ];
            });
            patterns.splice(
              patterns.indexOf(pattern),
              1,
              {
                name: "wait",
                memory: { ticks: 35 },
              },
              { name: "oak_boss", memory: { phase: 34 } }
            );
          } else if (pattern.memory.phase === 34) {
            // stop towers
            const availableTowers = getIdentifiersAndComponents(
              world,
              "oak:tower",
              [BEHAVIOUR]
            );
            availableTowers.forEach((towerEntity) => {
              towerEntity[BEHAVIOUR].patterns = [];
            });
            patterns.splice(patterns.indexOf(pattern), 1);
          } else if (pattern.memory.phase === 40) {
            if (percentage < 15) {
              // advance to final phase and drop remaining phases
              entity[BEHAVIOUR].patterns = [
                { name: "oak_boss", memory: { phase: 41 } },
              ];

              // stop towers
              const availableTowers = getIdentifiersAndComponents(
                world,
                "oak:tower",
                [BEHAVIOUR]
              );
              availableTowers.forEach((towerEntity) => {
                towerEntity[BEHAVIOUR].patterns = [
                  { name: "dialog", memory: { idle: undefined } },
                ];
              });
              break;
            }
            continue;
          } else if (pattern.memory.phase === 41) {
            // scream in despair
            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "invincible", memory: {} },
              {
                name: "shout",
                memory: {
                  dialogs: [
                    createShout(
                      choice(
                        "DIE\u0112",
                        "ENOUGH\u0112",
                        "STOP\u0112",
                        "GRRAAH\u0112"
                      )
                    ),
                  ],
                },
              },
              { name: "wait", memory: { ticks: 5 } },
              { name: "dialog", memory: { override: "hidden", dialogs: [] } },
              { name: "wait", memory: { ticks: 5 } },
              { name: "dialog", memory: { idle: rage } },
              { name: "wait", memory: { ticks: 2 } },
              { name: "dialog", memory: { idle: undefined } },
              { name: "oak_boss", memory: { phase: 42 } }
            );
          } else if (pattern.memory.phase === 42) {
            // cast wave
            castSpell(world, castableEntity, {
              [ITEM]: {
                carrier: -1,
                bound: false,
                amount: 1,
                equipment: "primary",
                primary: "wave",
                material: "gold",
              },
            });
            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "wait", memory: { ticks: 7 } },
              { name: "vulnerable", memory: {} },
              { name: "oak_boss", memory: { phase: 43 } }
            );
          } else if (pattern.memory.phase === 43) {
            // show rage before casting branch
            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "dialog", memory: { idle: rage } },
              { name: "wait", memory: { ticks: 2 } },
              { name: "dialog", memory: { idle: undefined } },
              { name: "oak_boss", memory: { phase: 44 } }
            );
          } else if (pattern.memory.phase === 44) {
            // extend branch
            createSequence<"branch", BranchSequence>(
              world,
              stemEntity,
              "branch",
              "oakBranch",
              {
                grow: true,
                limbs: [],
                threshold: entity[STATS].hp - 15,
              }
            );
            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "wait", memory: { ticks: 3 } },
              { name: "dialog", memory: { idle: rage2 } },
              { name: "wait", memory: { ticks: 3 } },
              { name: "oak_boss", memory: { phase: 45 } }
            );
          } else if (pattern.memory.phase === 45) {
            // set orientation
            castableEntity[ORIENTABLE].facing = relativeOrientations(
              world,
              castableEntity[POSITION],
              heroEntity[POSITION]
            )[0];

            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "wait", memory: { ticks: 1 } },
              { name: "dialog", memory: { idle: undefined } },
              { name: "oak_boss", memory: { phase: 46 } }
            );
          } else if (pattern.memory.phase === 46) {
            // cast blast
            castSpell(world, castableEntity, {
              [ITEM]: {
                carrier: -1,
                bound: false,
                amount: 1,
                equipment: "primary",
                primary: "blast",
                material: "gold",
              },
            });

            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "wait", memory: { ticks: 3 } },
              { name: "oak_boss", memory: { phase: 47 } }
            );
          } else if (pattern.memory.phase === 47) {
            // reset orientation
            castableEntity[ORIENTABLE].facing = undefined;
            patterns.splice(patterns.indexOf(pattern), 1, {
              name: "oak_boss",
              memory: { phase: 48 },
            });
          } else if (pattern.memory.phase === 48) {
            // wait till branch is broken
            if (!getSequence(world, stemEntity, "branch")) {
              patterns.splice(patterns.indexOf(pattern), 1, {
                name: "oak_boss",
                memory: { phase: 43 },
              });
            }
          } else {
            console.log(pattern.memory.phase);
            patterns.splice(patterns.indexOf(pattern), 1);
          }
          break;
        } else if (pattern.name === "oak_tower") {
          if (pattern.memory.phase === 10) {
            // show rage before shooting discs
            const discSwirl = [
              { x: 6, y: 0 },
              { x: 6, y: -4 },
              { x: 5, y: -4 },
              { x: 5, y: 4 },
              { x: 4, y: 4 },
              { x: 4, y: -4 },
            ];
            const rightTower = signedDistance(0, entity[POSITION].x, size) > 0;
            const flippedSwirl = discSwirl.map((discPosition) => ({
              x: rightTower ? discPosition.x : -discPosition.x,
              y:
                pattern.memory.flipped !== rightTower
                  ? -discPosition.y
                  : discPosition.y,
            }));
            const discCount = 7;
            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "dialog", memory: { idle: rage } },
              { name: "wait", memory: { ticks: 2 } },
              { name: "dialog", memory: { idle: undefined } },
              ...Array.from({ length: discCount })
                .map(
                  () =>
                    [
                      {
                        name: "oak_tower",
                        memory: { phase: 30, discs: flippedSwirl },
                      },
                      {
                        name: "wait",
                        memory: { ticks: 3 },
                      },
                    ] as const
                )
                .flat()
            );
          } else if (pattern.memory.phase === 20) {
            // show rage before shooting discs
            const discQuarter = [
              { x: 9, y: 0 },
              { x: 9, y: 1 },
              { x: 8, y: 1 },
              { x: 8, y: 3 },
              { x: 6, y: 3 },
              { x: 6, y: 4 },
              { x: 3, y: 4 },
              { x: 3, y: 5 },
            ];

            const discHalfRing = discQuarter.concat(
              ...reversed(
                discQuarter.map((discPosition) => ({
                  x: -discPosition.x,
                  y: discPosition.y,
                }))
              )
            );
            const rightTower = signedDistance(0, entity[POSITION].x, size) > 0;
            const flippedHalfRing = discHalfRing.map((discPosition) => ({
              x: rightTower ? discPosition.x : -discPosition.x,
              y:
                pattern.memory.flipped !== rightTower
                  ? -discPosition.y
                  : discPosition.y,
            }));
            const discCount = 6;
            patterns.splice(
              patterns.indexOf(pattern),
              1,
              { name: "dialog", memory: { idle: rage } },
              { name: "wait", memory: { ticks: 2 } },
              { name: "dialog", memory: { idle: undefined } },
              ...Array.from({ length: discCount })
                .map(
                  () =>
                    [
                      {
                        name: "oak_tower",
                        memory: { phase: 30, discs: flippedHalfRing },
                      },
                      {
                        name: "wait",
                        memory: { ticks: 4 },
                      },
                    ] as const
                )
                .flat()
            );
          } else if (pattern.memory.phase === 30) {
            shootHoming(world, entity, {
              type: "ironDisc",
              positions: [...pattern.memory.discs],
              ttl: 35,
            });
            patterns.splice(patterns.indexOf(pattern), 1);
          }
          break;
        } else if (pattern.name === "oak_clover") {
          const oakBoss = getIdentifierAndComponents(world, "oak_boss", [
            POSITION,
          ]);

          if (!oakBoss) {
            disposeEntity(world, entity);
            break;
          }

          const healingOrientations = relativeOrientations(
            world,
            entity[POSITION],
            { x: 0, y: 0 }
          );
          const remainingOrientations = orientations.filter(
            (orientation) => !healingOrientations.includes(orientation)
          );
          const movingOrientations = [
            ...shuffle(healingOrientations),
            ...shuffle(remainingOrientations),
          ];

          // walk every second step
          if (entity[ORIENTABLE]?.facing) {
            entity[ORIENTABLE].facing = undefined;
          } else if (entity[ORIENTABLE]) {
            entity[MOVABLE].orientations = movingOrientations;
          }
        } else if (pattern.name === "chest_boss") {
          const chaseTicks = 30;
          const healTicks = 45;
          const confusedTicks = 12;
          const slashTicks = 20;
          const castTicks = 25;
          const wavesTicks = 15;
          const wavesShots = 5;

          const heroEntity = getIdentifier(world, "hero");
          const heroId = heroEntity && world.getEntityId(heroEntity);
          const spellItem = world.getEntityByIdAndComponents(
            entity[INVENTORY]?.items.find(
              (item) =>
                world.assertByIdAndComponents(item, [ITEM])[ITEM].primary ===
                "wave"
            ),
            [ITEM]
          );
          let removeDrops = false;

          if (
            !entity[ACTIONABLE] ||
            !entity[TOOLTIP] ||
            !entity[STATS] ||
            !spellItem
          ) {
            patterns.splice(patterns.indexOf(pattern), 1);
            break;
          } else if (
            pattern.memory.phase < 5 &&
            entity[STATS].hp / entity[STATS].maxHp <= 2 / 3
          ) {
            removeDrops = true;
            pattern.memory.phase = 5;
            entity[BEHAVIOUR].patterns = [pattern];
          } else if (
            pattern.memory.phase < 7 &&
            entity[STATS].hp / entity[STATS].maxHp <= 1 / 3
          ) {
            removeDrops = true;
            pattern.memory.phase = 7;
            entity[BEHAVIOUR].patterns = [pattern];
          }

          const waveTowers = world
            .getEntities([IDENTIFIABLE, SPRITE, POSITION, BEHAVIOUR])
            .filter((tower) => tower[IDENTIFIABLE].name === "chest_tower");
          const pendingPatterns = patterns.slice(-1)[0] !== pattern;
          const adjustedWavesTicks = (wavesTicks / 2) * (4 - waveTowers.length);

          if (pattern.memory.phase === 1) {
            entity[SPRITE] = chestBoss;
            entity[BELONGABLE].faction = "wild";
            patterns.splice(patterns.indexOf(pattern), 1);

            // replace statues with towers
            world
              .getEntities([IDENTIFIABLE, SPRITE, POSITION])
              .filter(
                (statue) => statue[IDENTIFIABLE].name === "chest_tower_statue"
              )
              .forEach((statue) => {
                createCell(
                  world,
                  copy(statue[POSITION]),
                  "chest_tower",
                  "visible"
                );

                disposeEntity(world, statue);
              });
          } else if (pattern.memory.phase === 2 && !pendingPatterns) {
            removeDrops = true;

            // ensure spell is set to damage
            spellItem[ITEM].element = undefined;

            // let boss cast wave
            entity[BEHAVIOUR].patterns = [
              {
                name: "chest_boss",
                memory: {
                  phase: 3,
                  position: pattern.memory.position,
                },
              },
              {
                name: "dialog",
                memory: {
                  idle: rage,
                },
              },
              {
                name: "wait",
                memory: { ticks: 3 },
              },
              {
                name: "dialog",
                memory: {
                  idle: undefined,
                },
              },
              {
                name: "action",
                memory: { primary: true },
              },
              {
                name: "wait",
                memory: { ticks: 6 },
              },
            ];
          } else if (pattern.memory.phase === 3) {
            const pendingTowers = waveTowers.filter(
              (tower) => tower[SPRITE] === waveTower
            );

            if (!pattern.memory.chase && !pendingPatterns) {
              pattern.memory.chase = generation;

              patterns.push(
                {
                  name: "dialog",
                  memory: {
                    idle: rage,
                  },
                },
                {
                  name: "wait",
                  memory: {
                    ticks: 3,
                  },
                },
                {
                  name: "kill",
                  memory: {
                    target: heroId,
                  },
                }
              );
            } else if (
              pendingTowers.length > 0 &&
              pattern.memory.chase &&
              generation >
                pattern.memory.chase +
                  (chaseTicks / 3) * (3 - pendingTowers.length) -
                  3
            ) {
              const towerEntity =
                pendingTowers[random(0, pendingTowers.length - 1)];
              towerEntity[SPRITE] = waveTowerCharged;
              towerEntity[BEHAVIOUR].patterns = [
                {
                  name: "dialog",
                  memory: {
                    idle: rage,
                  },
                },
                {
                  name: "wait",
                  memory: { ticks: 3 },
                },
                {
                  name: "dialog",
                  memory: {
                    idle: undefined,
                  },
                },
                {
                  name: "action",
                  memory: { primary: true },
                },
              ];
            } else if (
              pattern.memory.chase &&
              generation > pattern.memory.chase + chaseTicks
            ) {
              pattern.memory.chase = undefined;
              waveTowers.forEach((tower) => {
                tower[SPRITE] = waveTower;
              });
              entity[BEHAVIOUR].patterns = [
                {
                  name: "chest_boss",
                  memory: {
                    phase: 4,
                    position: pattern.memory.position,
                  },
                },
                {
                  name: "invincible",
                  memory: {},
                },
                {
                  name: "dialog",
                  memory: {
                    idle: undefined,
                  },
                },
                {
                  name: "move",
                  memory: {
                    targetPosition: pattern.memory.position,
                  },
                },
              ];
            }
          } else if (pattern.memory.phase === 4) {
            if (!pattern.memory.warned && !pendingPatterns) {
              pattern.memory.warned = generation;
              patterns.push(
                {
                  name: "wait",
                  memory: { ticks: 3 },
                },
                {
                  name: "dialog",
                  memory: {
                    idle: rage,
                  },
                },
                {
                  name: "wait",
                  memory: { ticks: 3 },
                },
                {
                  name: "dialog",
                  memory: {
                    idle: undefined,
                  },
                }
              );
            } else if (
              generation > pattern.memory.warned + 6 &&
              !pattern.memory.spawned
            ) {
              pattern.memory.spawned = generation;
              pattern.memory.healed = 0;
              // spawn 6 mobs around
              for (let i = 0; i < 6; i += 1) {
                createCell(
                  world,
                  add(entity[POSITION], {
                    x: (i % 3 === 1 ? 2 : 1) * (i < 3 ? 1 : -1),
                    y: ((i % 3) - 1) * (i < 3 ? 1 : -1),
                  }),
                  "chest_mob",
                  "visible"
                );
              }
            } else if (
              pattern.memory.spawned &&
              generation >
                pattern.memory.spawned + (pattern.memory.healed + 1) * healTicks
            ) {
              pattern.memory.healed += 1;

              // ensure spell is set to healing
              spellItem[ITEM].element = "earth";

              patterns.push({
                name: "action",
                memory: { primary: true },
              });
            }

            const chestMobs = world
              .getEntities([IDENTIFIABLE])
              .filter((entity) => entity[IDENTIFIABLE].name === "chest_mob");

            if (pattern.memory.spawned && chestMobs.length === 0) {
              pattern.memory.warned = undefined;
              pattern.memory.spawned = undefined;

              entity[BEHAVIOUR].patterns = [
                {
                  name: "chest_boss",
                  memory: {
                    phase: 2,
                    position: pattern.memory.position,
                  },
                },
                {
                  name: "vulnerable",
                  memory: {},
                },
                {
                  name: "dialog",
                  memory: {
                    idle: confused,
                  },
                },
                {
                  name: "wait",
                  memory: { ticks: confusedTicks },
                },
                {
                  name: "dialog",
                  memory: {
                    idle: undefined,
                  },
                },
              ];
            }
          } else if (pattern.memory.phase === 5 && !pendingPatterns) {
            entity[BEHAVIOUR].patterns = [
              {
                name: "chest_boss",
                memory: {
                  phase: 6,
                  position: pattern.memory.position,
                },
              },
              {
                name: "invincible",
                memory: {},
              },
              {
                name: "dialog",
                memory: {
                  idle: undefined,
                  override: "visible",
                  dialogs: [createShout(choice("Burn!", "Fire!"))],
                  enemy: true,
                },
              },
              {
                name: "move",
                memory: {
                  targetPosition: pattern.memory.position,
                },
              },
              {
                name: "wait",
                memory: {
                  ticks: 9,
                },
              },
              {
                name: "dialog",
                memory: {
                  override: undefined,
                  dialogs: [],
                },
              },
            ];

            waveTowers.forEach((tower) => {
              // set element to fire
              const towerItem = world.assertByIdAndComponents(
                tower[INVENTORY]?.items.find(
                  (item) =>
                    world.assertByIdAndComponents(item, [ITEM])[ITEM]
                      .primary === "wave"
                ),
                [ITEM]
              );
              towerItem[ITEM].element = "fire";
              tower[SPRITE] = fireWaveTower;

              // cast fire waves
              tower[BEHAVIOUR].patterns = [
                {
                  name: "dialog",
                  memory: {
                    idle: rage,
                  },
                },
                {
                  name: "wait",
                  memory: { ticks: 3 },
                },
                {
                  name: "dialog",
                  memory: {
                    idle: undefined,
                  },
                },
                {
                  name: "action",
                  memory: { primary: true },
                },
              ];
            });
          } else if (pattern.memory.phase === 6) {
            if (!pattern.memory.slashed && !pendingPatterns) {
              pattern.memory.slashed = generation;
              pattern.memory.casted = generation;
              patterns.push(
                {
                  name: "vulnerable",
                  memory: {},
                },
                {
                  name: "dialog",
                  memory: {
                    idle: rage,
                  },
                },
                {
                  name: "wait",
                  memory: { ticks: 3 },
                },
                {
                  name: "dialog",
                  memory: {
                    idle: undefined,
                  },
                },
                {
                  name: "kill",
                  memory: {
                    target: heroId,
                  },
                }
              );
            } else if (
              pattern.memory.slashed &&
              generation > pattern.memory.slashed + slashTicks
            ) {
              pattern.memory.slashed = generation;

              patterns.splice(
                1,
                0,
                {
                  name: "dialog",
                  memory: {
                    idle: rage,
                  },
                },
                {
                  name: "wait",
                  memory: { ticks: 2 },
                },
                {
                  name: "dialog",
                  memory: {
                    idle: undefined,
                  },
                },
                {
                  name: "action",
                  memory: { secondary: true },
                },
                {
                  name: "wait",
                  memory: { ticks: 6 },
                },
                {
                  name: "dialog",
                  memory: {
                    idle: rage,
                  },
                },
                {
                  name: "wait",
                  memory: { ticks: 2 },
                },
                {
                  name: "dialog",
                  memory: {
                    idle: undefined,
                  },
                }
              );
            } else if (
              pattern.memory.casted &&
              generation > pattern.memory.casted + castTicks
            ) {
              pattern.memory.casted = generation;

              const towerEntity = choice(...waveTowers);
              if (towerEntity) {
                towerEntity[BEHAVIOUR].patterns = [
                  {
                    name: "dialog",
                    memory: {
                      idle: rage,
                    },
                  },
                  {
                    name: "wait",
                    memory: { ticks: 3 },
                  },
                  {
                    name: "dialog",
                    memory: {
                      idle: undefined,
                    },
                  },
                  {
                    name: "action",
                    memory: { primary: true },
                  },
                ];
              }
            }
          } else if (pattern.memory.phase === 7 && !pendingPatterns) {
            entity[BEHAVIOUR].patterns = [
              {
                name: "chest_boss",
                memory: {
                  phase: 8,
                  position: pattern.memory.position,
                },
              },
              {
                name: "invincible",
                memory: {},
              },
              {
                name: "dialog",
                memory: {
                  idle: undefined,
                  override: "visible",
                  dialogs: [createShout(choice("Freeze!", "Ice!"))],
                  enemy: true,
                },
              },
              {
                name: "move",
                memory: {
                  targetPosition: add(pattern.memory.position, { x: 0, y: 2 }),
                },
              },
              {
                name: "wait",
                memory: {
                  ticks: 9,
                },
              },
              {
                name: "dialog",
                memory: {
                  override: undefined,
                  dialogs: [],
                },
              },
              {
                name: "vulnerable",
                memory: {},
              },
            ];

            [...waveTowers, entity].forEach((caster) => {
              // set element to water
              const casterItem = world.assertByIdAndComponents(
                caster[INVENTORY]?.items.find(
                  (item) =>
                    world.assertByIdAndComponents(item, [ITEM])[ITEM]
                      .primary === "wave"
                ),
                [ITEM]
              );
              casterItem[ITEM].element = "water";
              if (caster !== entity) {
                caster[SPRITE] = waterWaveTower;
              }

              // cast water waves
              caster[BEHAVIOUR].patterns.push(
                {
                  name: "dialog",
                  memory: {
                    idle: rage,
                  },
                },
                {
                  name: "wait",
                  memory: { ticks: 3 },
                },
                {
                  name: "dialog",
                  memory: {
                    idle: undefined,
                  },
                },
                {
                  name: "action",
                  memory: { primary: true },
                }
              );
            });
          } else if (
            pattern.memory.phase === 8 &&
            (!pendingPatterns || pattern.memory.waves)
          ) {
            if (!pattern.memory.waves) {
              world.removeComponentFromEntity(
                entity as TypedEntity<"COLLIDABLE">,
                COLLIDABLE
              );
              pattern.memory.waves = generation;
              pattern.memory.cells = [];
            } else if (
              pattern.memory.waves &&
              generation > pattern.memory.waves + adjustedWavesTicks
            ) {
              pattern.memory.waves = generation;

              const towerEntity = choice(
                ...waveTowers,
                entity as TypedEntity<"BEHAVIOUR">
              );
              towerEntity[BEHAVIOUR].patterns.push(
                {
                  name: "dialog",
                  memory: {
                    idle: rage,
                  },
                },
                {
                  name: "wait",
                  memory: { ticks: 3 },
                },
                {
                  name: "dialog",
                  memory: {
                    idle: undefined,
                  },
                },
                {
                  name: "action",
                  memory: { primary: true },
                }
              );
            }

            if (generation % 2 === 0) {
              for (let i = 0; i < wavesShots; i += 1) {
                if (pattern.memory.cells.length === 0) {
                  pattern.memory.cells = shuffle(range(-10, 10));
                }
                const cellOffset = pattern.memory.cells.pop();
                const position = add(entity[POSITION], {
                  x: cellOffset,
                  y: -4,
                });
                shootArrow(
                  world,
                  entity,
                  {},
                  {
                    [ORIENTABLE]: { facing: "down" },
                    [POSITION]: position,
                  }
                );
              }
            }
          }

          if (removeDrops) {
            // remove any pending mob drops
            world
              .getEntities([IDENTIFIABLE, ITEM])
              .filter((drop) => drop[IDENTIFIABLE].name === "chest_mob:drop")
              .forEach((item) => {
                const carrierEntity = world.assertById(item[ITEM].carrier);
                disposeEntity(world, carrierEntity);
              });
          }
        } else {
          console.error(Date.now(), "Unhandled pattern", pattern);
          patterns.splice(patterns.indexOf(pattern), 1);
        }
      }
    }
  };

  return { onUpdate };
}
