import { World } from "../ecs";
import { entities } from "..";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import {
  MeleeSequence,
  SEQUENCABLE,
  SlashSequence,
} from "../components/sequencable";
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
  getAttackables,
  isDead,
  isEnemy,
  isFriendlyFire,
} from "./damage";
import { emptyStats, STATS } from "../components/stats";
import { rerenderEntity } from "./renderer";
import { relativeOrientations } from "../../game/math/path";
import { BURNABLE } from "../components/burnable";
import { PLAYER } from "../components/player";
import { extinguishEntity, getBurnables } from "./burn";
import { freezeTerrain, getFreezables, isFrozen, thawTerrain } from "./freeze";
import { BELONGABLE } from "../components/belongable";
import { ORIENTABLE } from "../components/orientable";
import { SPRITE } from "../components/sprite";
import { EQUIPPABLE } from "../components/equippable";
import { ITEM } from "../components/item";
import { copy } from "../../game/math/std";
import { createText, none, xp } from "../../game/assets/sprites";
import * as colors from "../../game/assets/colors";
import { MOVABLE } from "../components/movable";
import { consumeCharge } from "./trigger";
import { isInPopup } from "./popup";
import { queueMessage } from "../../game/assets/utils";
import { play } from "../../game/sound";

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

// check if spell not currently active or in popup
export const canCast = (world: World, entity: Entity, item: Entity) => {
  if (isInPopup(world, entity)) return false;

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
  if (amount >= 1) return 1;
  return 0;
};

export const chargeSlash = (world: World, entity: Entity, slash: Entity) => {
  if (!isEnemy(world, entity)) {
    consumeCharge(world, entity, { stackable: "charge" });
  }

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

  // create rotating slash
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

  createSequence<"melee", MeleeSequence>(
    world,
    entity,
    "melee",
    "swordAttack",
    { facing: "right", tick, rotate: true }
  );

  play("slash");
};

export default function setupMagic(world: World) {
  let referenceGenerations = -1;
  const playerHp: Record<number, number> = {};
  const playerMp: Record<number, number> = {};
  const playerXp: Record<number, number> = {};
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

      const targetEntities =
        castableEntity[CASTABLE].medium === "physical"
          ? getAttackables(world, entity[POSITION])
          : getAffectables(world, entity[POSITION]);
      for (const targetEntity of targetEntities) {
        const affectableId = world.getEntityId(targetEntity);
        const affectedGeneration =
          castableEntity[CASTABLE].affected[affectableId];

        if (
          isDead(world, targetEntity) ||
          (isFriendlyFire(world, castableEntity, targetEntity) &&
            !castableEntity[CASTABLE].heal) ||
          (affectedGeneration &&
            (!isEternalFire || affectedGeneration === worldGeneration))
        )
          continue;

        // set affected generation
        castableEntity[CASTABLE].affected[affectableId] = worldGeneration;

        if (isFriendlyFire(world, castableEntity, targetEntity)) {
          // process healing
          if (castableEntity[CASTABLE].heal && targetEntity[STATS]) {
            const { healing, hp } = calculateHealing(
              targetEntity[STATS],
              castableEntity[CASTABLE].heal
            );
            targetEntity[STATS].hp = hp;

            createAmountMarker(world, targetEntity, healing, "up");
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
              targetEntity
            );
            targetEntity[STATS].hp = hp;

            // play sound
            play("magic", { intensity: damage });

            const orientation = relativeOrientations(
              world,
              castableEntity[POSITION],
              targetEntity[POSITION]
            )[0];

            // add hit marker
            createAmountMarker(world, targetEntity, -damage, orientation);
          }

          if (!targetEntity[AFFECTABLE]) continue;

          // set affected unit on fire
          const targetBurn = castableEntity[CASTABLE].burn;
          const curentBurn = targetEntity[AFFECTABLE].burn;
          if (targetBurn > curentBurn && !isDead(world, targetEntity)) {
            targetEntity[AFFECTABLE].burn = targetBurn;
          }

          // freeze affected units
          const targetFreeze = castableEntity[CASTABLE].freeze;
          const curentFreeze = targetEntity[AFFECTABLE].freeze;
          if (targetFreeze > curentFreeze && !isDead(world, targetEntity)) {
            targetEntity[AFFECTABLE].freeze = targetFreeze;
          }
        }

        // extinguish unit if burning and frozen
        if (
          targetEntity[AFFECTABLE].freeze > 0 &&
          targetEntity[AFFECTABLE].burn > 0
        ) {
          targetEntity[AFFECTABLE].freeze = 0;
          extinguishEntity(world, targetEntity);
        }

        rerenderEntity(world, targetEntity);
      }

      const targetBurn = castableEntity[CASTABLE].burn;
      const targetFreeze = castableEntity[CASTABLE].freeze;

      for (const burnableEntity of getBurnables(world, entity[POSITION])) {
        if (
          burnableEntity[BURNABLE].combusted ||
          castableEntity[CASTABLE].caster === world.getEntityId(burnableEntity)
        )
          continue;

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

      // freeze or thaw terrain
      for (const freezableEntity of getFreezables(world, entity[POSITION])) {
        if (
          castableEntity[CASTABLE].caster === world.getEntityId(freezableEntity)
        )
          continue;

        if (!isFrozen(world, freezableEntity) && targetFreeze > 0) {
          freezeTerrain(world, freezableEntity);
        } else if (isFrozen(world, freezableEntity) && targetBurn > 0) {
          thawTerrain(world, freezableEntity);
        }
      }
    }

    // process healing, mana and XP animation after consumption
    for (const entity of world.getEntities([SEQUENCABLE, PLAYER, STATS])) {
      const entityId = world.getEntityId(entity);
      const hpReceived = entity[PLAYER].healingReceived;
      const pendingHp = hpReceived - (playerHp[entityId] || 0);

      if (pendingHp > 0) {
        playerHp[entityId] = hpReceived;
        createAmountMarker(world, entity, pendingHp, "up");
      }

      const mpReceived = entity[PLAYER].manaReceived;
      const pendingMp = mpReceived - (playerMp[entityId] || 0);

      if (pendingMp > 0) {
        playerMp[entityId] = mpReceived;
        queueMessage(world, entity, {
          line: createText(`+${pendingMp}`, colors.blue),
          orientation: "up",
          fast: false,
          delay: 0,
        });
      }

      const xpReceived = entity[PLAYER].xpReceived;
      const pendingXp = xpReceived - (playerXp[entityId] || 0);

      if (pendingXp > 0) {
        playerXp[entityId] = xpReceived;
        queueMessage(world, entity, {
          line: createText(`${pendingXp}x ${xp.name}`, colors.silver),
          orientation: "up",
          fast: false,
          delay: 0,
        });
      }
    }

    // process DoT on affectable units
    for (const entity of world.getEntities([SEQUENCABLE, AFFECTABLE, STATS])) {
      const entityId = world.getEntityId(entity);
      const dot = entity[AFFECTABLE].dot;
      const delta = dot - (playerDots[entityId] || 0);

      if (delta === 0) continue;

      const { damage, hp } = calculateDamage(world, "true", delta, {}, entity);
      entity[STATS].hp = hp;

      play("magic", { intensity: damage });

      // add hit marker
      createAmountMarker(world, entity, -damage, "up");

      playerDots[entityId] = dot;
    }
  };

  return { onUpdate };
}
