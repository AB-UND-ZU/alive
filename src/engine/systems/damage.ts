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

export const getAttackable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (entity) => ATTACKABLE in (entity as Entity)
  ) as Entity;

export const isFriendlyFire = (world: World, entity: Entity, target: Entity) =>
  target[ATTACKABLE].enemy === NPC in entity;

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
      RENDERABLE,
    ])) {
      const entityId = world.getEntityId(entity);
      const entityReference = world.getEntityById(entity[MOVABLE].reference)[
        RENDERABLE
      ].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      const targetOrientation: Orientation | null =
        entity[MOVABLE].pendingOrientation || entity[MOVABLE].orientations[0];

      if (!targetOrientation) continue;

      const delta = orientationPoints[targetOrientation];
      const targetPosition = add(entity[POSITION], delta);
      const targetEntity = getAttackable(world, targetPosition);

      if (!targetEntity || isFriendlyFire(world, entity, targetEntity))
        continue;

      // handle attacking
      const sword = world.getEntityById(entity[MELEE].item);
      const damage = sword[ITEM].dmg;
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
      const targetAnimation = targetEntity[ANIMATABLE] as Animatable;

      if (swordAnimation) {
        swordAnimation.states.melee = {
          name: "swordAttack",
          reference: world.getEntityId(animationEntity),
          elapsed: 0,
          args: { facing: targetOrientation },
          particles: swordAnimation.states.melee?.particles || {},
        };
      }

      if (targetAnimation) {
        targetAnimation.states.counter = {
          name: "damageCounter",
          reference: world.getEntityId(animationEntity),
          elapsed: 0,
          args: {
            facing: targetOrientation,
            amount: damage + (targetAnimation.states.counter?.args.amount || 0),
          },
          particles: targetAnimation.states.counter?.particles || {},
        };
      }

      rerenderEntity(world, targetEntity);
    }
  };

  return { onUpdate };
}
