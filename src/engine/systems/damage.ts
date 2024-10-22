import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { MELEE } from "../components/melee";
import { getCell } from "./map";
import { ATTACKABLE } from "../components/attackable";
import { rerenderEntity } from "./renderer";
import { ITEM } from "../components/item";
import { Orientation, orientationPoints } from "../components/orientable";
import { EQUIPPABLE } from "../components/equippable";
import { COUNTABLE } from "../components/countable";
import { isGhost } from "./fate";
import { createSequence } from "./sequence";
import { MeleeSequence } from "../components/sequencable";

export const isDead = (world: World, entity: Entity) =>
  (ATTACKABLE in entity && entity[COUNTABLE].hp <= 0) || isGhost(world, entity);

export const isEnemy = (world: World, entity: Entity) =>
  entity[ATTACKABLE]?.enemy;

export const isFriendlyFire = (world: World, entity: Entity, target: Entity) =>
  isEnemy(world, entity) === isEnemy(world, target);

export const getAttackable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (target) => ATTACKABLE in target && COUNTABLE in target
  ) as Entity | undefined;

export default function setupDamage(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // handle melee attacks
    for (const entity of world.getEntities([
      POSITION,
      MOVABLE,
      MELEE,
      EQUIPPABLE,
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

      // skip if entity has no sword equipped or already interacted
      if (
        !entity[EQUIPPABLE].melee ||
        entity[MOVABLE].lastInteraction === entityReference
      )
        continue;

      // skip if dead
      if (isDead(world, entity)) continue;

      const targetOrientation: Orientation | null =
        entity[MOVABLE].pendingOrientation || entity[MOVABLE].orientations[0];

      if (!targetOrientation) continue;

      const delta = orientationPoints[targetOrientation];
      const targetPosition = add(entity[POSITION], delta);
      const targetEntity = getAttackable(world, targetPosition);

      if (!targetEntity || isFriendlyFire(world, entity, targetEntity))
        continue;

      // mark as interacted
      entity[MOVABLE].pendingOrientation = undefined;
      entity[MOVABLE].lastInteraction = entityReference;

      // do nothing if target is dead and pending decay
      if (isDead(world, targetEntity)) continue;

      // handle attacking
      const sword = world.assertByIdAndComponents(entity[EQUIPPABLE].melee, [
        ITEM,
      ]);
      const damage = sword[ITEM].amount;
      targetEntity[COUNTABLE].hp = Math.max(
        0,
        targetEntity[COUNTABLE].hp - damage
      );
      createSequence<"melee", MeleeSequence>(
        world,
        entity,
        "melee",
        "swordAttack",
        { facing: targetOrientation, damage }
      );

      rerenderEntity(world, targetEntity);
    }
  };

  return { onUpdate };
}
