import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { disposeEntity, getCell } from "./map";
import { rerenderEntity } from "./renderer";
import { ACTIONABLE } from "../components/actionable";
import { EQUIPPABLE } from "../components/equippable";
import { INVENTORY } from "../components/inventory";
import { CONDITIONABLE } from "../components/conditionable";
import { isControllable } from "./freeze";
import { Orientation } from "../components/orientable";
import { HOOKABLE } from "../components/hookable";
import { isWalkable } from "./movement";
import { isSubmerged } from "./immersion";
import { BUMPABLE } from "../components/bumpable";
import { BAITABLE } from "../components/baitable";
import { attemptBubbleAbsorb } from "./magic";
import { getDistance } from "../../game/math/std";
import { LEVEL } from "../components/level";

export const getHookables = (world: World, position: Position) =>
  Object.values(getCell(world, position)).filter(
    (entity) => HOOKABLE in entity
  ) as Entity[];

export const getHookable = (world: World, position: Position) =>
  getHookables(world, position)[0];

export const isWireTossable = (world: World, position: Position) =>
  isWalkable(world, position) ||
  getHookable(world, position) ||
  isSubmerged(world, position);

export default function setupFishing(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // handle entities fishing
    for (const entity of world.getEntities([
      ACTIONABLE,
      CONDITIONABLE,
      EQUIPPABLE,
      INVENTORY,
      MOVABLE,
      RENDERABLE,
    ])) {
      const entityId = world.getEntityId(entity);
      const entityReference = world.assertByIdAndComponents(
        entity[MOVABLE].reference,
        [RENDERABLE]
      )[RENDERABLE].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      // skip if not fishing or already tossing
      const condition = entity[CONDITIONABLE].hook;
      if (!isControllable(world, entity) || !condition) continue;

      const targetOrientation: Orientation | null =
        entity[MOVABLE].pendingOrientation || entity[MOVABLE].orientations[0];

      if (!targetOrientation) continue;

      if (!condition.orientation) {
        condition.orientation = targetOrientation;
        rerenderEntity(world, entity);
      }

      // mark as interacted but keep pending movement
      entity[MOVABLE].lastInteraction = entityReference;
    }

    // handle catching targets in baits
    for (const entity of world.getEntities([
      BAITABLE,
      BUMPABLE,
      RENDERABLE,
      POSITION,
    ])) {
      const entityId = world.getEntityId(entity);
      const caughtId = entity[BAITABLE].caught;
      const caughtEntity = world.getEntityByIdAndComponents(caughtId, [
        HOOKABLE,
        POSITION,
      ]);
      const size = world.metadata.gameEntity[LEVEL].size;

      // dispose remaining baits
      const casterEntity = world.getEntityById(entity[BAITABLE].caster);
      if (!casterEntity?.[CONDITIONABLE]?.hook) {
        disposeEntity(world, entity);
        continue;
      }

      if (caughtId) {
        // clean up escaped catches
        if (
          !caughtEntity ||
          getDistance(entity[POSITION], caughtEntity[POSITION], size) !== 0
        ) {
          entity[BAITABLE].caught = undefined;
        }
      }

      // skip if already caught something
      if (entity[BAITABLE].caught) continue;

      const hookable = getHookable(world, entity[POSITION]);

      if (hookable) {
        const hookableId = world.getEntityId(hookable);

        if (attemptBubbleAbsorb(world, hookable)) {
          hookable[HOOKABLE].escaping = true;
        } else {
          hookable[HOOKABLE].escaping = false;
        }

        hookable[HOOKABLE].hooked = entityId;
        hookable[HOOKABLE].casting = undefined;
        entity[BAITABLE].caught = hookableId;
        entity[BUMPABLE].orientation = "down";
        entity[BUMPABLE].generation = entity[RENDERABLE].generation;
        rerenderEntity(world, entity);
      }
    }

    // handle hooked entities
    for (const entity of world.getEntities([HOOKABLE, MOVABLE, RENDERABLE])) {
      const entityId = world.getEntityId(entity);
      const entityReference = world.assertByIdAndComponents(
        entity[MOVABLE].reference,
        [RENDERABLE]
      )[RENDERABLE].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      // skip if not hooked
      if (
        !isControllable(world, entity) ||
        (!entity[HOOKABLE].hooked && !entity[HOOKABLE].catching)
      )
        continue;

      const hookedId = entity[HOOKABLE].hooked;
      const baitEntity =
        hookedId &&
        world.getEntityByIdAndComponents(hookedId, [
          BAITABLE,
          BUMPABLE,
          RENDERABLE,
        ]);
      const catchingId = entity[HOOKABLE].catching;
      const casterEntity = catchingId && world.getEntityById(catchingId);

      // clear up stale hooks
      if ((catchingId && !casterEntity) || (hookedId && !baitEntity)) {
        entity[HOOKABLE].hooked = undefined;
        entity[HOOKABLE].catching = undefined;
        entity[HOOKABLE].escaping = false;
        continue;
      }

      const targetOrientation: Orientation | null =
        entity[MOVABLE].pendingOrientation || entity[MOVABLE].orientations[0];

      if (!targetOrientation) continue;

      if (
        (!baitEntity && !casterEntity) ||
        (!entity[HOOKABLE].catching && entity[HOOKABLE].escaping)
      ) {
        // escape
        entity[HOOKABLE].hooked = undefined;
        entity[HOOKABLE].catching = undefined;
        entity[HOOKABLE].escaping = false;
        continue;
      } else if (!entity[HOOKABLE].escaping && baitEntity) {
        // escape on next movement
        entity[HOOKABLE].escaping = true;
        baitEntity[BUMPABLE].orientation = "down";
        baitEntity[BUMPABLE].generation = baitEntity[RENDERABLE].generation;
        rerenderEntity(world, baitEntity);

        if (entity[BUMPABLE]) {
          entity[BUMPABLE].generation = entity[RENDERABLE].generation;
          entity[BUMPABLE].orientation = targetOrientation;
        }
      }

      // mark as interacted but keep pending movement
      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
