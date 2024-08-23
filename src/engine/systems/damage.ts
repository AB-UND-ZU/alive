import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE, Orientation, orientationPoints } from "../components/movable";
import { MELEE } from "../components/melee";
import { getCell, registerEntity } from "./map";
import { ATTACKABLE } from "../components/attackable";
import { rerenderEntity } from "./renderer";
import { NPC } from "../components/npc";
import { entities } from "..";
import { PARTICLE } from "../components/particle";
import { SPRITE } from "../components/sprite";
import { hit } from "../../game/assets/sprites";

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

      const targetPosition = add(
        entity[POSITION],
        orientationPoints[targetOrientation]
      );
      const targetEntity = getAttackable(world, targetPosition);

      if (!targetEntity || isFriendlyFire(world, entity, targetEntity))
        continue;

      // handle attacking
      targetEntity[ATTACKABLE].hp = Math.max(
        0,
        targetEntity[ATTACKABLE].hp - entity[MELEE].dmg
      );

      const hitEntity = entities.createHit(world, {
        [PARTICLE]: { ttl: 200, reference: world.getEntityId(entity) },
        [POSITION]: targetPosition,
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: hit,
      });
      registerEntity(world, hitEntity);
      rerenderEntity(world, targetEntity);
    }
  };

  return { onUpdate };
}
