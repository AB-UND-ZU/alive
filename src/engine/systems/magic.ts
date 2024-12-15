import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { HitSequence, SEQUENCABLE } from "../components/sequencable";
import { disposeEntity, getCell } from "./map";
import { createSequence, getSequence } from "./sequence";
import { CASTABLE } from "../components/castable";
import { EXERTABLE } from "../components/exertable";
import { Entity } from "ecs";
import { AFFECTABLE } from "../components/affectable";
import { calculateDamage, isFriendlyFire } from "./damage";
import { STATS } from "../components/stats";
import { rerenderEntity } from "./renderer";

export const isAffectable = (world: World, entity: Entity) =>
  AFFECTABLE in entity;

export const getAffectables = (world: World, position: Position) =>
  Object.values(getCell(world, position)).filter((target) =>
    isAffectable(world, target)
  ) as Entity[];

// check if spell not currently active
export const canCast = (world: World, entity: Entity, item: Entity) => {
  const entityId = world.getEntityId(entity);
  return !world
    .getEntities([CASTABLE])
    .some((castable) => castable[CASTABLE].caster === entityId);
};

export default function setupMagic(world: World) {
  let referenceGenerations = -1;

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    for (const entity of world.getEntities([
      POSITION,
      CASTABLE,
      RENDERABLE,
      SEQUENCABLE,
    ])) {
      // delete finished spell entities
      if (!getSequence(world, entity, "spell")) {
        disposeEntity(world, entity);
      }
    }

    for (const entity of world.getEntities([POSITION, EXERTABLE])) {
      // affect entities only once within all exertable areas of a spell
      const castableEntity = world.assertByIdAndComponents(
        entity[EXERTABLE].castable,
        [CASTABLE]
      );

      for (const affectableEntity of getAffectables(world, entity[POSITION])) {
        const affectableId = world.getEntityId(affectableEntity);

        if (
          isFriendlyFire(world, castableEntity, affectableEntity) ||
          castableEntity[CASTABLE].affected[affectableId]
        )
          continue;

        castableEntity[CASTABLE].affected[affectableId] =
          (castableEntity[CASTABLE].affected[affectableId] || 0) + 1;

        // inflict damage
        const attack = castableEntity[CASTABLE].damage;
        const { damage, hp } = calculateDamage(
          "magic",
          attack,
          0,
          {},
          affectableEntity[STATS]
        );
        affectableEntity[STATS].hp = hp;

        // add hit marker
        createSequence<"hit", HitSequence>(
          world,
          affectableEntity,
          "hit",
          "damageHit",
          {
            damage: damage,
          }
        );

        rerenderEntity(world, affectableEntity);
      }
    }
  };

  return { onUpdate };
}
