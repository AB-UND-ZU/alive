import { World } from "../ecs";
import { entities } from "..";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { SEQUENCABLE, SlashSequence } from "../components/sequencable";
import { disposeEntity, getCell } from "./map";
import { createSequence, getSequences } from "./sequence";
import { CASTABLE } from "../components/castable";
import { EXERTABLE } from "../components/exertable";
import { Entity } from "ecs";
import { AFFECTABLE } from "../components/affectable";
import {
  calculateDamage,
  calculateHealing,
  createAmountMarker,
  isDead,
  isFriendlyFire,
} from "./damage";
import { emptyStats, STATS } from "../components/stats";
import { rerenderEntity } from "./renderer";
import { relativeOrientations } from "../../game/math/path";
import { BURNABLE } from "../components/burnable";
import { PLAYER } from "../components/player";
import { extinguishEntity, getBurnables } from "./burn";
import { freezeTerrain, getFreezables, isFrozen } from "./freeze";
import { BELONGABLE } from "../components/belongable";
import { ORIENTABLE } from "../components/orientable";
import { SPRITE } from "../components/sprite";
import { EQUIPPABLE } from "../components/equippable";
import { ITEM } from "../components/item";
import { copy } from "../../game/math/std";
import { none } from "../../game/assets/sprites";
import { MOVABLE } from "../components/movable";
import { consumeCharge } from "./trigger";

export const isAffectable = (world: World, entity: Entity) =>
  AFFECTABLE in entity;

export const getAffectables = (world: World, position: Position) =>
  Object.values(getCell(world, position)).filter((target) =>
    isAffectable(world, target)
  ) as Entity[];

export const isExertable = (world: World, entity: Entity) =>
  EXERTABLE in entity;

export const getExertables = (world: World, position: Position) =>
  Object.values(getCell(world, position)).filter((target) =>
    isExertable(world, target)
  ) as Entity[];

// check if spell not currently active
export const canCast = (world: World, entity: Entity, item: Entity) => {
  const entityId = world.getEntityId(entity);
  return !world
    .getEntities([CASTABLE, SEQUENCABLE])
    .some(
      (castable) =>
        castable[CASTABLE].caster === entityId &&
        !castable[SEQUENCABLE].states.smoke
    );
};

// normalize particle amounts to spell damage
export const getParticleAmount = (world: World, amount: number) => {
  if (amount >= 5) return 3;
  if (amount >= 3) return 2;
  return 1;
};

export const chargeSlash = (world: World, entity: Entity, slash: Entity) => {
  consumeCharge(world, entity, "charge");

  const entityId = world.getEntityId(entity);
  const swordEntity = world.assertByIdAndComponents(entity[EQUIPPABLE].sword, [
    ITEM,
  ]);
  const slashMaterial = swordEntity[ITEM].material === "iron" ? "iron" : "wood";
  const { damage } = calculateDamage(
    world,
    "physical",
    swordEntity[ITEM].amount,
    entity,
    emptyStats
  );
  const spellEntity = entities.createSpell(world, {
    [BELONGABLE]: { faction: entity[BELONGABLE].faction },
    [CASTABLE]: {
      affected: {},
      damage: Math.ceil(damage / 2),
      burn: 0,
      freeze: 0,
      heal: 0,
      caster: entityId,
      medium: "physical",
    },
    [ORIENTABLE]: {},
    [POSITION]: copy(entity[POSITION]),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
  });
  const tick = world.assertByIdAndComponents(entity[MOVABLE].reference, [
    REFERENCE,
  ])[REFERENCE].tick;

  // spin sword around
  createSequence<"slash", SlashSequence>(
    world,
    spellEntity,
    "slash",
    "chargeSlash",
    {
      tick,
      material: slashMaterial,
      castable: world.getEntityId(spellEntity),
      exertables: [],
    }
  );
};

export default function setupMagic(world: World) {
  let referenceGenerations = -1;
  const playerHealings: Record<number, number> = {};
  const playerDots: Record<number, number> = {};

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

      // delete finished spell entities and smoke anchors
      if (getSequences(world, entity).length === 0) {
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
          (isFriendlyFire(world, castableEntity, affectableEntity) &&
            !castableEntity[CASTABLE].heal) ||
          (affectedGeneration &&
            (!isEternalFire || affectedGeneration === worldGeneration))
        )
          continue;

        if (isFriendlyFire(world, castableEntity, affectableEntity)) {
          // process healing
          if (castableEntity[CASTABLE].heal && affectableEntity[STATS]) {
            const { healing, hp } = calculateHealing(
              affectableEntity[STATS],
              castableEntity[CASTABLE].heal
            );
            affectableEntity[STATS].hp = hp;

            createAmountMarker(world, affectableEntity, healing, "up");
          }
        } else {
          // inflict direct damage
          if (castableEntity[CASTABLE].damage) {
            const damageType = castableEntity[CASTABLE].medium;
            const { damage, hp } = calculateDamage(
              world,
              damageType,
              castableEntity[CASTABLE].damage,
              {},
              affectableEntity
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

          // set affected unit on fire
          const targetBurn = castableEntity[CASTABLE].burn;
          const curentBurn = affectableEntity[AFFECTABLE].burn;
          if (targetBurn > curentBurn && !isDead(world, affectableEntity)) {
            affectableEntity[AFFECTABLE].burn = targetBurn;
          }

          // freeze affected units
          const targetFreeze = castableEntity[CASTABLE].freeze;
          const curentFreeze = affectableEntity[AFFECTABLE].freeze;
          if (targetFreeze > curentFreeze && !isDead(world, affectableEntity)) {
            affectableEntity[AFFECTABLE].freeze = targetFreeze;
          }
        }

        // extinguish unit if burning and frozen
        if (
          affectableEntity[AFFECTABLE].freeze > 0 &&
          affectableEntity[AFFECTABLE].burn > 0
        ) {
          affectableEntity[AFFECTABLE].freeze = 0;
          extinguishEntity(world, affectableEntity);
        }

        // set affected generation
        castableEntity[CASTABLE].affected[affectableId] = worldGeneration;

        rerenderEntity(world, affectableEntity);
      }

      for (const burnableEntity of getBurnables(world, entity[POSITION])) {
        if (
          burnableEntity[BURNABLE].combusted ||
          castableEntity[CASTABLE].caster === world.getEntityId(burnableEntity)
        )
          continue;

        const targetBurn = castableEntity[CASTABLE].burn;
        const targetFreeze = castableEntity[CASTABLE].freeze;
        const isBurning = burnableEntity[BURNABLE].burning;

        // set terrain on fire
        if (targetBurn > 0 && !isBurning) {
          burnableEntity[BURNABLE].burning = true;
        }

        // extinguish burning fires
        if (targetFreeze > 0 && isBurning) {
          extinguishEntity(world, burnableEntity);
        }
      }

      // freeze terrain
      for (const freezableEntity of getFreezables(world, entity[POSITION])) {
        const targetFreeze = castableEntity[CASTABLE].freeze;

        if (
          isFrozen(world, freezableEntity) ||
          targetFreeze === 0 ||
          castableEntity[CASTABLE].caster === world.getEntityId(freezableEntity)
        )
          continue;

        freezeTerrain(world, freezableEntity);
      }
    }

    // process healing animation after consumption
    for (const entity of world.getEntities([SEQUENCABLE, PLAYER, STATS])) {
      const entityId = world.getEntityId(entity);
      const total = entity[PLAYER].healingReceived;
      const healing = total - (playerHealings[entityId] || 0);

      if (healing === 0) continue;

      playerHealings[entityId] = total;
      createAmountMarker(world, entity, healing, "up");
    }

    // process DoT on affectable units
    for (const entity of world.getEntities([SEQUENCABLE, AFFECTABLE, STATS])) {
      const entityId = world.getEntityId(entity);
      const dot = entity[AFFECTABLE].dot;
      const delta = dot - (playerDots[entityId] || 0);

      if (delta === 0) continue;

      const { damage, hp } = calculateDamage(world, "true", delta, {}, entity);
      entity[STATS].hp = hp;

      // add hit marker
      createAmountMarker(world, entity, -damage, "up");

      playerDots[entityId] = dot;
    }
  };

  return { onUpdate };
}
