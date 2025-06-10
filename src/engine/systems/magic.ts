import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { SEQUENCABLE } from "../components/sequencable";
import { disposeEntity, getCell } from "./map";
import { getSequence } from "./sequence";
import { CASTABLE } from "../components/castable";
import { EXERTABLE } from "../components/exertable";
import { Entity } from "ecs";
import { AFFECTABLE } from "../components/affectable";
import {
  calculateDamage,
  createAmountMarker,
  DamageType,
  isFriendlyFire,
} from "./damage";
import { STATS } from "../components/stats";
import { rerenderEntity } from "./renderer";
import { relativeOrientations } from "../../game/math/path";
import { BURNABLE } from "../components/burnable";

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
    const worldGeneration = world.metadata.gameEntity[RENDERABLE].generation;

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    for (const entity of world.getEntities([
      POSITION,
      CASTABLE,
      RENDERABLE,
      SEQUENCABLE,
    ])) {
      // keep eternal fires
      const casterEntity = world.getEntityById(entity[CASTABLE].caster);
      if (casterEntity?.[BURNABLE]?.eternal) continue;

      // delete finished spell entities
      if (!getSequence(world, entity, "spell")) {
        disposeEntity(world, entity);
      }
    }

    for (const entity of world.getEntities([POSITION, EXERTABLE])) {
      // affect entities only once within all exertable areas of a spell
      // unless it is eternal burning fire
      const castableEntity = world.getEntityByIdAndComponents(
        entity[EXERTABLE].castable,
        [CASTABLE, POSITION]
      );

      // clean up orphaned AoE
      if (!castableEntity) {
        disposeEntity(world, entity);
        continue;
      }

      const casterEntity = world.getEntityById(castableEntity[CASTABLE].caster);
      const isEternalFire = casterEntity?.[BURNABLE]?.eternal;

      for (const affectableEntity of getAffectables(world, entity[POSITION])) {
        const affectableId = world.getEntityId(affectableEntity);
        const affectedGeneration =
          castableEntity[CASTABLE].affected[affectableId];

        if (
          isFriendlyFire(world, castableEntity, affectableEntity) ||
          (affectedGeneration &&
            (!isEternalFire || affectedGeneration === worldGeneration))
        )
          continue;

        // set affected generation
        castableEntity[CASTABLE].affected[affectableId] = worldGeneration;

        let damageType: DamageType | undefined = undefined;
        if (castableEntity[CASTABLE].damage) {
          // inflict damage
          damageType = "magic";
        }
        
        if (castableEntity[CASTABLE].burn) {
          // burn while standing inside
          damageType = "true";
        }

        if (damageType) {
          const { damage, hp } = calculateDamage(
            damageType,
            castableEntity[CASTABLE].damage,
            0,
            {},
            affectableEntity[STATS]
          );
          affectableEntity[STATS].hp = hp;

          const orientation = relativeOrientations(
            world,
            castableEntity[POSITION],
            affectableEntity[POSITION]
          )[0];

          // add hit marker
          createAmountMarker(world, affectableEntity, -damage, orientation);
        }

        rerenderEntity(world, affectableEntity);
      }
    }
  };

  return { onUpdate };
}
