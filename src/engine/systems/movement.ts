import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { MOVABLE } from "../components/movable";
import { World } from "../ecs";
import { REFERENCE } from "../components/reference";
import { getCell, moveEntity } from "./map";
import { COLLIDABLE } from "../components/collidable";
import { Entity } from "ecs";
import { rerenderEntity } from "./renderer";
import {
  getDistance,
  normalize,
  random,
  signedDistance,
  sum,
} from "../../game/math/std";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";
import {
  getAttackable,
  getEntityStats,
  isDead,
  isFriendlyFire,
} from "./damage";
import { getCollecting, getLootable } from "./collect";
import { isImmersible, isSubmerged } from "./immersion";
import { BiomeName, LEVEL } from "../components/level";
import { canUnlock, getLockable, getWarpable, isLocked } from "./action";
import { createBubble } from "./water";
import { getOpaque } from "./enter";
import { TypedEntity } from "../entities";
import { TEMPO } from "../components/tempo";
import { freezeMomentum, isFrozen } from "./freeze";
import { createItemName, queueMessage } from "../../game/assets/utils";
import { addBackground, createText } from "../../game/assets/sprites";
import { colors } from "../../game/assets/colors";
import { isTouch } from "../../components/Dimensions";
import { invertOrientation } from "../../game/math/path";
import {
  getPopup,
  getTab,
  isInPopup,
  isPopupAvailable,
  popupActions,
} from "./popup";
import { getSequence } from "./sequence";
import { PLAYER } from "../components/player";
import { npcVariants, play } from "../../game/sound";
import { NPC } from "../components/npc";
import { LAYER } from "../components/layer";
import { FOG } from "../components/fog";
import { SPRITE } from "../components/sprite";
import { LOCKABLE } from "../components/lockable";
import { getClickable } from "./click";
import { CLICKABLE } from "../components/clickable";
import { getSpikable } from "./spike";
import { getOverlappingCell } from "../../game/math/matrix";

// haste:-4 interval:1100
// haste:-3 interval:600
// haste:-2 interval:433
// haste:-1 interval:350 (world)
// haste:0 interval:300 (scout, mage, knight)
// haste:1 interval:266 (hunter or others with haste)
// haste:2 interval:242
// haste:3 interval:225
// haste:4 interval:211
// haste:5 interval:200
// haste:6 interval:190
// haste:7 interval:183
export const getHasteInterval = (world: World, haste: number) =>
  Math.floor(1000 / (Math.max(haste, -4) + 5) + 100);

export const getTempo = (world: World, position: Position) =>
  sum(
    Object.values(getCell(world, position)).map(
      (target) => target[TEMPO]?.amount || 0
    )
  );

const popupHaste = 8;

export const getEntityHaste = (world: World, entity: Entity) =>
  isInPopup(world, entity)
    ? popupHaste
    : getEntityStats(world, entity).haste + getTempo(world, entity[POSITION]);

export const isCollision = (world: World, position: Position) =>
  Object.values(getCell(world, position)).some(
    (entity) => COLLIDABLE in (entity as Entity)
  );

export const isWalkable = (world: World, position: Position) => {
  if (
    !getOverlappingCell(
      world.metadata.gameEntity[LEVEL].initialized,
      position.x,
      position.y
    )
  )
    return false;

  const lockable = getLockable(world, position);
  return (
    !isCollision(world, position) &&
    !isSubmerged(world, position) &&
    !(lockable && isLocked(world, lockable)) &&
    !getAttackable(world, position) &&
    !getLootable(world, position) &&
    !getCollecting(world, position) &&
    !getClickable(world, position)
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

  if (getSpikable(world, position)) return false;

  // allow attacking opposing entities
  const attackable = getAttackable(world, position);
  if (attackable && !isFriendlyFire(world, entity, attackable)) return true;

  // allow clicking
  const clickable = getClickable(world, position);
  if (clickable && (!clickable[CLICKABLE].player || entity[PLAYER]))
    return true;

  return false;
};

export const getBiome = (world: World, position: Position): BiomeName => {
  const biomes = world.metadata.gameEntity[LEVEL].biomes;
  if (biomes.length === 0) return "jungle";

  return getOverlappingCell(
    world.metadata.gameEntity[LEVEL].biomes,
    position.x,
    position.y
  );
};

export default function setupMovement(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const size = world.metadata.gameEntity[LEVEL].size;
    const hero = world.getEntity([PLAYER, POSITION, LAYER]);

    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // let displacable units and mobs take precendence over player movements
    const orderedEntities = [
      ...(world.getEntities([
        POSITION,
        MOVABLE,
        RENDERABLE,
        `!${PLAYER}` as unknown as typeof PLAYER,
      ]) as TypedEntity<"POSITION" | "MOVABLE" | "RENDERABLE">[]),
      ...world.getEntities([POSITION, MOVABLE, RENDERABLE, PLAYER]),
    ];

    for (const entity of orderedEntities) {
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
      if (
        isDead(world, entity) ||
        (isFrozen(world, entity) && !entity[MOVABLE].momentum)
      )
        continue;

      const attemptedOrientations: Orientation[] = [
        ...entity[MOVABLE].orientations,
      ];

      if (
        pendingOrientation &&
        !attemptedOrientations.includes(pendingOrientation)
      ) {
        attemptedOrientations.push(pendingOrientation);
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
      if (
        entity[MOVABLE].lastInteraction === entityReference &&
        !entity[MOVABLE].momentum
      )
        continue;

      let movedOrientation: Orientation | undefined = undefined;

      for (const orientation of attemptedOrientations) {
        const delta = orientationPoints[orientation];
        const position = {
          x: normalize(entity[POSITION].x + delta.x, size),
          y: normalize(entity[POSITION].y + delta.y, size),
        };

        const lockable = getLockable(world, position);
        const popup = getPopup(world, position);
        const warp = getWarpable(world, position);

        if (
          entity[PLAYER] &&
          !isWalkable(world, position) &&
          lockable &&
          isLocked(world, lockable) &&
          !getSequence(world, lockable, "unlock")
        ) {
          // show message if unlockable
          queueMessage(world, entity, {
            line: canUnlock(world, entity, lockable)
              ? [
                  ...createText(
                    isTouch ? "Tap on " : "[SPACE] to ",
                    colors.silver,
                    colors.black
                  ),
                  ...createText("OPEN", colors.black, colors.lime),
                ]
              : addBackground(
                  [
                    ...createText("Need ", colors.silver),
                    ...createItemName({
                      consume: "key",
                      material: lockable[LOCKABLE].material,
                    }),
                    ...createText("!", colors.silver),
                  ],
                  colors.black
                ),
            orientation: invertOrientation(orientation),
            fast: false,
            delay: 0,
          });
          continue;
        } else if (
          entity[PLAYER] &&
          !isWalkable(world, position) &&
          popup &&
          isPopupAvailable(world, popup)
        ) {
          // show message if popup available
          const action = popupActions[getTab(world, popup)];
          queueMessage(world, entity, {
            line: [
              ...createText(
                isTouch ? "Tap on " : "[SPACE] to ",
                colors.silver,
                colors.black
              ),
              ...createText(action, colors.black, colors.lime),
            ],
            orientation: invertOrientation(orientation),
            fast: false,
            delay: 0,
          });
          continue;
        } else if (entity[PLAYER] && warp) {
          queueMessage(world, entity, {
            line: [
              ...createText(
                isTouch ? "Tap on " : "[SPACE] to ",
                colors.silver,
                colors.black
              ),
              ...createText("WARP", colors.black, colors.lime),
            ],
            orientation:
              signedDistance(entity[POSITION].y, warp[POSITION].y, size) >= 0
                ? "up"
                : "down",
            fast: false,
            delay: 0,
          });
        } else if (
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

          const proximity =
            Object.values(getCell(world, position)).filter(
              (cell) => cell[RENDERABLE] && cell[SPRITE]?.layers.length
            ).length > 0
              ? 1
              : 0.5;
          moveEntity(world, entity, position);

          if (entity[PLAYER]) {
            const variant = isImmersible(world, position)
              ? 3
              : getTempo(world, position) < 0
              ? 2
              : 1;
            play("move", {
              intensity: movableReference[REFERENCE].tick,
              variant,
              proximity,
            });
          } else if (entity[NPC] && entity[FOG]?.visibility === "visible") {
            play("slide", {
              intensity: movableReference[REFERENCE].tick,
              proximity: hero
                ? 1 / (getDistance(hero[POSITION], entity[POSITION], size) + 1)
                : 0.5,
              variant: npcVariants[entity[NPC].type],
              delay: random(0, 50),
            });
          }

          // set facing to actual movement
          if (entity[ORIENTABLE] && !entity[MOVABLE].flying)
            entity[ORIENTABLE].facing = orientation;

          rerenderEntity(world, entity);

          movedOrientation = orientation;
          break;
        }
      }

      // preserve momentum before suspending frame
      freezeMomentum(world, entity, movedOrientation);

      // mark as interacted but keep pending movement
      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
