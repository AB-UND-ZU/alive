import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { MOVABLE } from "../components/movable";
import { World } from "../ecs";
import { REFERENCE } from "../components/reference";
import { getCell, moveEntity } from "./map";
import { COLLIDABLE } from "../components/collidable";
import { Entity } from "ecs";
import { rerenderEntity } from "./renderer";
import { normalize, sum } from "../../game/math/std";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";
import { getAttackable, isDead, isFriendlyFire } from "./damage";
import { getCollecting, getLootable } from "./collect";
import { isImmersible, isSubmerged } from "./immersion";
import { LEVEL } from "../components/level";
import { getLockable, isLocked } from "./action";
import { createBubble } from "./water";
import { getOpaque } from "./enter";
import { ENVIRONMENT } from "../components/environment";
import { TypedEntity } from "../entities";
import { TEMPO } from "../components/tempo";
import { STATS } from "../components/stats";
import { freezeMomentum, isFrozen } from "./freeze";

// haste:-1 interval:350 (world)
// haste:0 interval:300 (scout, mage, knight)
// haste:1 interval:266 (hunter or others with haste)
// haste:2 interval:242
// haste:3 interval:225 (cap for scout, mage, knight)
// haste:4 interval:211 (cap for hunter)
// haste:5 interval:200
// haste:6 interval:190
// haste:7 interval:183 (cap with spell)
export const getHasteInterval = (world: World, haste: number) =>
  Math.floor(1000 / (Math.max(haste, -4) + 5) + 100);

export const getTempo = (world: World, position: Position) =>
  sum(
    Object.values(getCell(world, position)).map(
      (target) => target[TEMPO]?.amount || 0
    )
  );

export const getEntityHaste = (world: World, entity: Entity) =>
  entity[STATS].haste + getTempo(world, entity[POSITION]);

export const isCollision = (world: World, position: Position) =>
  Object.values(getCell(world, position)).some(
    (entity) => COLLIDABLE in (entity as Entity)
  );

export const isWalkable = (world: World, position: Position) => {
  const lockable = getLockable(world, position);
  return (
    !isCollision(world, position) &&
    !isSubmerged(world, position) &&
    !(lockable && isLocked(world, lockable)) &&
    !getAttackable(world, position) &&
    !getLootable(world, position) &&
    !getCollecting(world, position)
  );
};

export const isFlyable = (world: World, position: Position) => {
  const lockable = getLockable(world, position);
  return (
    !getOpaque(world, position) && !(lockable && isLocked(world, lockable))
  );
};

export const isMovable = (world: World, entity: Entity, position: Position) => {
  if (isWalkable(world, position)) return true;

  // allow attacking opposing entities
  const attackable = getAttackable(world, position);
  if (attackable && !isFriendlyFire(world, entity, attackable)) return true;

  return false;
};

export const getBiomes = (world: World, position: Position) =>
  Array.from(
    new Set(
      Object.values(getCell(world, position)).flatMap(
        (cell: TypedEntity) => cell[ENVIRONMENT]?.biomes || []
      )
    )
  );

export default function setupMovement(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};
  const size = world.metadata.gameEntity[LEVEL].size;

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    for (const entity of world.getEntities([POSITION, MOVABLE, RENDERABLE])) {
      const entityId = world.getEntityId(entity);
      const movableReference = world.assertByIdAndComponents(
        entity[MOVABLE].reference,
        [REFERENCE, RENDERABLE]
      );
      const entityReference = movableReference[RENDERABLE].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      const pendingOrientation = entity[MOVABLE].pendingOrientation;
      entity[MOVABLE].pendingOrientation = undefined;

      // skip if dead or frozen
      if (isDead(world, entity) || isFrozen(world, entity)) continue;

      const attemptedOrientations: Orientation[] = [
        ...entity[MOVABLE].orientations,
      ];

      if (pendingOrientation) {
        attemptedOrientations.unshift(pendingOrientation);
      }

      if (entity[MOVABLE].momentum) {
        attemptedOrientations.unshift(entity[MOVABLE].momentum);
      }

      // skip if no attempted movement
      if (attemptedOrientations.length === 0) continue;

      // set facing regardless of movement
      if (entity[ORIENTABLE] && !entity[MOVABLE].flying)
        entity[ORIENTABLE].facing = attemptedOrientations[0];

      // skip if already interacted
      if (entity[MOVABLE].lastInteraction === entityReference) continue;

      for (const orientation of attemptedOrientations) {
        const delta = orientationPoints[orientation];
        const position = {
          x: normalize(entity[POSITION].x + delta.x, size),
          y: normalize(entity[POSITION].y + delta.y, size),
        };

        if (
          isWalkable(world, position) ||
          (entity[MOVABLE].flying && isFlyable(world, position))
        ) {
          // leave bubble trail if walking through water
          if (
            isImmersible(world, entity[POSITION]) &&
            !entity[MOVABLE].flying
          ) {
            createBubble(world, entity[POSITION]);
          }

          moveEntity(world, entity, position);

          // set facing to actual movement
          if (entity[ORIENTABLE] && !entity[MOVABLE].flying)
            entity[ORIENTABLE].facing = orientation;

          // preserve momentum before suspending frame
          freezeMomentum(world, entity, orientation);

          rerenderEntity(world, entity);
          break;
        }
      }

      // mark as interacted but keep pending movement
      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
