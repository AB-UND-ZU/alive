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
import { disposeEntity, disposeFrame, getCell } from "./map";
import { createSequence, getSequences } from "./sequence";
import { Castable, CASTABLE, getEmptyCastable } from "../components/castable";
import { EXERTABLE } from "../components/exertable";
import { Entity } from "ecs";
import { AFFECTABLE } from "../components/affectable";
import {
  applyProcs,
  calculateDamage,
  calculateHealing,
  createAmountMarker,
  getAttackable,
  isDead,
  isEnemy,
  isFriendlyFire,
} from "./damage";
import { STATS } from "../components/stats";
import { rerenderEntity } from "./renderer";
import { relativeOrientations } from "../../game/math/path";
import { BURNABLE } from "../components/burnable";
import { emptyReceivedStats, Player, PLAYER } from "../components/player";
import { extinguishEntity, getBurnables } from "./burn";
import { freezeTerrain, getFreezables, isFrozen, thawTerrain } from "./freeze";
import { BELONGABLE } from "../components/belongable";
import { ORIENTABLE } from "../components/orientable";
import { SPRITE } from "../components/sprite";
import { ITEM } from "../components/item";
import { copy, getDistance } from "../../game/math/std";
import {
  createText,
  getStatColor,
  getStatSprite,
  none,
} from "../../game/assets/sprites";
import { brighten, colors } from "../../game/assets/colors";
import { MOVABLE } from "../components/movable";
import { consumeCharge } from "./trigger";
import { isInPopup } from "./popup";
import { queueMessage } from "../../game/assets/utils";
import { pickupOptions, play } from "../../game/sound";
import { LEVEL } from "../components/level";
import { getAbilityStats } from "../../game/balancing/abilities";
import { CONDITIONABLE } from "../components/conditionable";
import { getFragment } from "./enter";
import { FRAGMENT } from "../components/fragment";
import { HOMING } from "../components/homing";

export const isAffectable = (world: World, entity: Entity) =>
  AFFECTABLE in entity;

export const getAffectable = (
  world: World,
  position: Position,
  fragment = false
) => {
  const targetEntity = Object.values(getCell(world, position)).find((target) =>
    isAffectable(world, target)
  ) as Entity | undefined;

  if (targetEntity) return targetEntity;

  const fragmentEntity = getFragment(world, position);

  if (!fragmentEntity) return;

  if (fragment) return fragmentEntity;

  const structurableEntity = world.assertById(
    fragmentEntity[FRAGMENT].structure
  );

  if (isAffectable(world, structurableEntity)) return structurableEntity;
};

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

export const attemptBubbleAbsorb = (world: World, entity: Entity) => {
  if (entity[CONDITIONABLE]?.block) {
    entity[CONDITIONABLE].block.amount -= 1;

    queueMessage(world, entity, {
      line: createText("BLOCKED", colors.grey),
      orientation: "up",
      fast: false,
      delay: 0,
    });

    if (entity[CONDITIONABLE].block.amount <= 0) {
      delete entity[CONDITIONABLE].block;
    }
    return true;
  }
  return false;
};

export const chargeSlash = (world: World, entity: Entity, slash: Entity) => {
  if (!isEnemy(world, entity)) {
    consumeCharge(world, entity, { stackable: "charge" });
  }

  const slashStats = getAbilityStats(slash[ITEM]);
  const spellEntity = entities.createSpell(world, {
    [BELONGABLE]: { faction: entity[BELONGABLE].faction },
    [CASTABLE]: {
      ...getEmptyCastable(world, entity),
      ...slashStats,
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
      material: slash[ITEM].material,
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

export const hasTriggered = (
  world: World,
  affected: Castable["affected"][number],
  retrigger: number
) => {
  const worldGeneration = world.metadata.gameEntity[RENDERABLE].generation;
  const worldDelta = world.metadata.gameEntity[REFERENCE].delta;

  return (
    !affected ||
    (retrigger > 0 &&
      (worldGeneration > affected.generation + retrigger ||
        (worldGeneration >= affected.generation + retrigger &&
          worldDelta >= affected.delta)))
  );
};

export default function setupMagic(world: World) {
  let referenceGenerations = -1;
  const playerStats: Player["receivedStats"] = { ...emptyReceivedStats };
  const entityDots: Record<number, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);
    const worldGeneration = world.metadata.gameEntity[RENDERABLE].generation;
    const worldDelta = world.metadata.gameEntity[REFERENCE].delta;
    const heroEntity = world.getEntity([PLAYER, POSITION]);
    const size = world.metadata.gameEntity[LEVEL].size;

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    for (const entity of world.getEntities([
      POSITION,
      CASTABLE,
      RENDERABLE,
    ])) {
      // unmark when entity leaves retriggering AoE
      if (entity[CASTABLE].retrigger > 0) {
        Object.entries(entity[CASTABLE].affected).forEach(
          ([entityId, affected]) => {
            if (!hasTriggered(world, affected, entity[CASTABLE].retrigger))
              return;

            const affectedEntity = world.getEntityByIdAndComponents(
              parseInt(entityId),
              [AFFECTABLE, POSITION]
            );
            const castableId = world.getEntityId(entity);

            if (
              !affectedEntity ||
              !getExertables(world, affectedEntity[POSITION]).some(
                (exertable) => exertable[EXERTABLE].castable === castableId
              )
            ) {
              // stop ticking frames
              const frameId = entity[CASTABLE].affected[entityId].frame;
              if (frameId) {
                disposeFrame(world, world.assertById(frameId));
                delete entity[CASTABLE].affected[entityId].frame;
              }

              delete entity[CASTABLE].affected[entityId];
            }
          }
        );
      }

      // keep eternal fires
      const casterEntity = world.getEntityById(entity[CASTABLE].caster);
      if (casterEntity?.[BURNABLE]?.eternal) continue;

      // delete finished spell entities and smoke anchors
      if (getSequences(world, entity).length === 0 && !entity[HOMING]) {
        // ensure any remaining retrigger frames are disposed properly
        Object.values(entity[CASTABLE].affected).forEach((affected) => {
          if (affected.frame) {
            const frameEntity = world.assertById(affected.frame);
            disposeFrame(world, frameEntity);
            delete affected.frame;
          }
        });
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

      const targetEntity = castableEntity[CASTABLE].melee
        ? getAttackable(world, entity[POSITION])
        : getAffectable(world, entity[POSITION]);

      if (targetEntity) {
        const affectableId = world.getEntityId(targetEntity);
        const previousAffected =
          castableEntity[CASTABLE].affected[affectableId];

        if (
          isDead(world, targetEntity) ||
          (isFriendlyFire(world, castableEntity, targetEntity) &&
            !castableEntity[CASTABLE].heal) ||
          !hasTriggered(
            world,
            previousAffected,
            castableEntity[CASTABLE].retrigger
          )
        )
          continue;

        // set affected generation
        castableEntity[CASTABLE].affected[affectableId] = previousAffected
          ? {
              ...previousAffected,
              generation:
                previousAffected.generation +
                castableEntity[CASTABLE].retrigger,
            }
          : {
              generation: worldGeneration,
              delta: worldDelta,
            };

        // start ticking empty frame to ensure next tick is called in time
        if (
          castableEntity[CASTABLE].retrigger > 0 &&
          !castableEntity[CASTABLE].affected[affectableId].frame
        ) {
          const retriggerEntity = entities.createFrame(world, {
            [REFERENCE]: {
              tick:
                world.metadata.gameEntity[REFERENCE].tick *
                castableEntity[CASTABLE].retrigger,
              delta: 0,
              suspended: false,
              suspensionCounter: -1,
            },
            [RENDERABLE]: { generation: 1 },
          });

          castableEntity[CASTABLE].affected[affectableId].frame =
            world.getEntityId(retriggerEntity);
        }

        const hasDamage =
          castableEntity[CASTABLE].melee ||
          castableEntity[CASTABLE].magic ||
          castableEntity[CASTABLE].true;
        const hasProcs =
          castableEntity[CASTABLE].burn ||
          castableEntity[CASTABLE].freeze ||
          castableEntity[CASTABLE].drain;

        // prevent spell if bubble is active

        if (
          (hasDamage || hasProcs) &&
          attemptBubbleAbsorb(world, targetEntity)
        ) {
          continue;
        }

        // create hit marker
        const fragmentEntity =
          (castableEntity[CASTABLE].melee
            ? getAttackable(world, entity[POSITION], true)
            : getAffectable(world, entity[POSITION], true)) || targetEntity;

        if (isFriendlyFire(world, castableEntity, targetEntity)) {
          // process healing
          if (castableEntity[CASTABLE].heal && targetEntity[STATS]) {
            const { healing, hp } = calculateHealing(
              targetEntity[STATS],
              castableEntity[CASTABLE].heal
            );
            targetEntity[STATS].hp = hp;

            createAmountMarker(world, fragmentEntity, healing, "up", "true");
            if (healing > 0) {
              play("pickup", pickupOptions.hp);
            }
          }
        } else {
          // inflict direct damage
          if (hasDamage) {
            const { damage, hp } = calculateDamage(
              world,
              castableEntity[CASTABLE],
              casterEntity || {},
              targetEntity
            );
            targetEntity[STATS].hp = hp;

            // play sound
            const proximity = heroEntity
              ? 1 /
                (getDistance(entity[POSITION], heroEntity[POSITION], size) + 1)
              : 0.5;
            play("magic", { intensity: damage, proximity });

            const orientation = relativeOrientations(
              world,
              castableEntity[POSITION],
              targetEntity[POSITION]
            )[0];

            // add hit marker
            createAmountMarker(
              world,
              fragmentEntity,
              -damage,
              orientation,
              castableEntity[CASTABLE].melee ? "melee" : "magic"
            );
          }

          // process burning and freezing on hit
          applyProcs(
            world,
            casterEntity,
            {
              burn: castableEntity[CASTABLE].burn,
              freeze: castableEntity[CASTABLE].freeze,
              drain: castableEntity[CASTABLE].drain,
            },
            entity[EXERTABLE].castable,
            targetEntity
          );
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
      let previousStats = 0;

      for (const key in entity[PLAYER].receivedStats) {
        const statName = key as keyof Player["receivedStats"];
        const statValue = entity[PLAYER].receivedStats[statName];
        const pendingStat = statValue - playerStats[statName];
        playerStats[statName] = statValue;

        if (pendingStat <= 0) continue;

        const delay = previousStats * 500;

        if (statName === "hp") {
          createAmountMarker(world, entity, pendingStat, "up", "true");
        } else if (statName === "mp") {
          const statColor = getStatColor(statName);
          queueMessage(world, entity, {
            line: createText(`+${pendingStat}`, statColor),
            orientation: "up",
            fast: false,
            delay: 0,
          });
        } else if (["maxHp", "maxMp"].includes(statName)) {
          const statSprite = getStatSprite(statName);
          const statColor = getStatColor(statName);
          queueMessage(world, entity, {
            line: createText(
              `+${pendingStat} ${statSprite.name}`,
              colors.black,
              brighten(statColor)
            ),
            orientation: "up",
            fast: false,
            delay,
          });
          previousStats += 1;
        } else continue;

        play("pickup", {
          delay,
          ...pickupOptions[statName as "hp" | "maxHp" | "mp" | "maxMp"],
        });
      }
    }

    // process DoT on affectable units
    for (const entity of world.getEntities([
      SEQUENCABLE,
      AFFECTABLE,
      STATS,
      POSITION,
    ])) {
      const entityId = world.getEntityId(entity);
      const dot = entity[AFFECTABLE].dot;
      const delta = dot - (entityDots[entityId] || 0);

      if (delta === 0) continue;

      // burst bubble on dot
      entityDots[entityId] = dot;
      if (attemptBubbleAbsorb(world, entity)) continue;

      const { damage, hp } = calculateDamage(
        world,
        { true: delta },
        {},
        entity
      );
      entity[STATS].hp = hp;

      const proximity = heroEntity
        ? 1 / (getDistance(entity[POSITION], heroEntity[POSITION], size) + 1)
        : 0.5;
      play("magic", { intensity: damage, proximity });

      // add hit marker
      createAmountMarker(world, entity, -damage, "up", "magic");
    }
  };

  return { onUpdate };
}
