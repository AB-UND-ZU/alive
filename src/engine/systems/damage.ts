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
import { NPC } from "../components/npc";
import { entities } from "..";
import { ITEM } from "../components/item";
import { ANIMATABLE, Animatable } from "../components/animatable";
import { Orientation, orientationPoints } from "../components/orientable";
import { INVENTORY } from "../components/inventory";

export const isDead = (world: World, entity: Entity) =>
  entity[ATTACKABLE].hp <= 0;

export const isFriendlyFire = (world: World, entity: Entity, target: Entity) =>
  target[ATTACKABLE].enemy === NPC in entity;

export const getAttackable = (
  world: World,
  entity: Entity,
  position: Position
) =>
  Object.values(getCell(world, position)).find(
    (target) =>
      ATTACKABLE in target &&
      !isDead(world, target) &&
      !isFriendlyFire(world, entity, target)
  ) as Entity;

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
      INVENTORY,
      RENDERABLE,
    ])) {
      const entityId = world.getEntityId(entity);
      const entityReference = world.getEntityById(entity[MOVABLE].reference)[
        RENDERABLE
      ].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      // skip if entity has no sword equipped or already interacted
      if (
        !entity[INVENTORY].melee ||
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
      const targetEntity = getAttackable(world, entity, targetPosition);

      if (!targetEntity) continue;

      // handle attacking
      const sword = world.getEntityById(entity[INVENTORY].melee);
      const damage = sword[ITEM].amount;
      targetEntity[ATTACKABLE].hp = Math.max(
        0,
        targetEntity[ATTACKABLE].hp - damage
      );

      const animationEntity = entities.createAnimation(world, {
        [REFERENCE]: {
          tick: -1,
          delta: 0,
          suspended: false,
          pendingSuspended: false,
        },
        [RENDERABLE]: { generation: 1 },
      });
      const swordAnimation = sword[ANIMATABLE] as Animatable;

      if (swordAnimation) {
        swordAnimation.states.melee = {
          name: "swordAttack",
          reference: world.getEntityId(animationEntity),
          elapsed: 0,
          args: { facing: targetOrientation },
          particles: swordAnimation.states.melee?.particles || {},
        };
      }

      rerenderEntity(world, targetEntity);

      // mark as interacted
      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
