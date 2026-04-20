import { World } from "../ecs";
import { entities } from "..";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import {
  AuraSequence,
  MeleeSequence,
  SEQUENCABLE,
  SlashSequence,
} from "../components/sequencable";
import { disposeEntity, disposeFrame, getCell } from "./map";
import { createSequence, getSequences } from "./sequence";
import { Castable, CASTABLE, getEmptyCastable } from "../components/castable";
import { EXERTABLE } from "../components/exertable";
import { Entity } from "ecs";
import { AFFECTABLE, getEmptyAffectable } from "../components/affectable";
import {
  applyProcs,
  calculateDamage,
  calculateHealing,
  createAmountMarker,
  getAttackable,
  getAttackables,
  getRoot,
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
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";
import { SPRITE } from "../components/sprite";
import { ITEM, Material } from "../components/item";
import { combine, copy, getDistance } from "../../game/math/std";
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
import { ATTACKABLE } from "../components/attackable";
import { generateUnitData } from "../../game/balancing/units";
import { BUMPABLE } from "../components/bumpable";
import { COLLIDABLE } from "../components/collidable";
import { DISPLACABLE } from "../components/displacable";
import { FOG } from "../components/fog";
import { LAYER } from "../components/layer";
import { SHOOTABLE } from "../components/shootable";
import { DROPPABLE } from "../components/droppable";
import { getHasteInterval } from "./movement";
import { findAdjacentDroppable } from "./drop";
import { SWIMMABLE } from "../components/swimmable";
import { getBlockable } from "./action";
import { getEquipmentStats } from "../../game/balancing/equipment";
import { EQUIPPABLE } from "../components/equippable";
import { NPC } from "../components/npc";

export const isAffectable = (world: World, entity: Entity) =>
  AFFECTABLE in entity;

export const getAffectable = (
  world: World,
  position: Position,
  fragment = false
) => {
  if (getBlockable(world, position)) return;

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
  getBlockable(world, position)
    ? []
    : (Object.values(getCell(world, position)).filter((target) =>
        isAffectable(world, target)
      ) as Entity[]);

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
        castable[SEQUENCABLE].states.spell
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
  const swordEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE]?.sword,
    [ITEM]
  );

  if (!swordEntity) return;

  if (!isEnemy(world, entity)) {
    consumeCharge(world, entity, { stackable: "charge" });
  }

  const swordStats = getEquipmentStats(swordEntity[ITEM], entity[NPC]?.type);
  const abilityStats = getAbilityStats(slash[ITEM]);

  const slashStats = {
    ...abilityStats,
    melee: abilityStats.melee + swordStats.melee,
  };

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

const totemUnits = {
  wood: "woodTotem",
  iron: "ironTotem",
  gold: "goldTotem",
  diamond: "diamondTotem",
  ruby: "rubyTotem",
} as const;

export const summonTotem = (world: World, entity: Entity, totem: Entity) => {
  if (!isEnemy(world, entity)) {
    consumeCharge(world, entity, { stackable: "charge" });
  }
  const size = world.metadata.gameEntity[LEVEL].size;
  const orientation = entity[ORIENTABLE].facing as Orientation | undefined;
  const totemStats = getAbilityStats(totem[ITEM]);
  const totemUnit = generateUnitData(
    totemUnits[totem[ITEM].material as Material]
  );
  const target = findAdjacentDroppable(
    world,
    combine(
      size,
      entity[POSITION],
      orientation ? orientationPoints[orientation] : { x: 0, y: 0 }
    )
  );
  const frameEntity = entities.createFrame(world, {
    [REFERENCE]: {
      tick: getHasteInterval(world, 7),
      delta: 0,
      suspended: true,
      suspensionCounter: -1,
    },
    [RENDERABLE]: { generation: 0 },
  });

  const totemEntity = entities.createTotem(world, {
    [AFFECTABLE]: getEmptyAffectable(),
    [ATTACKABLE]: { scratchColor: totemUnit.scratch },
    [BELONGABLE]: { faction: entity[BELONGABLE].faction },
    [BUMPABLE]: { generation: 0 },
    [CASTABLE]: {
      ...getEmptyCastable(world, entity),
      ...totemStats,
    },
    [COLLIDABLE]: {},
    [DISPLACABLE]: {},
    [DROPPABLE]: { decayed: false, evaporate: totemUnit.evaporate },
    [EXERTABLE]: { castable: -1 },
    [FOG]: { visibility: "hidden", type: "object" },
    [LAYER]: {},
    [MOVABLE]: {
      orientations: [],
      reference: world.getEntityId(frameEntity),
      spring: {
        duration: frameEntity[REFERENCE].tick,
      },
      lastInteraction: 0,
      flying: false,
    },
    [POSITION]: target,
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SHOOTABLE]: { shots: 0 },
    [STATS]: {
      ...totemUnit.stats,
      maxHp: totemStats.duration,
      hp: totemStats.duration,
      armor: -totemStats.duration,
      resist: -totemStats.duration,
    },
    [SPRITE]: totemUnit.sprite,
    [SWIMMABLE]: { swimming: false },
  });
  totemEntity[CASTABLE].caster = world.getEntityId(entity);
  totemEntity[EXERTABLE].castable = world.getEntityId(totemEntity);

  // cast totem aura
  createSequence<"aura", AuraSequence>(
    world,
    totemEntity,
    "aura",
    "totemAura",
    {
      progress: 0,
      range: totemStats.range,
      duration: totemStats.duration,
      areas: [],
      material: totem[ITEM].material,
      element: totem[ITEM].element,
    }
  );
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

    for (const entity of world.getEntities([POSITION, CASTABLE, RENDERABLE])) {
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
      if (
        getSequences(world, entity).length === 0 &&
        !entity[HOMING] &&
        casterEntity !== entity
      ) {
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

      const targetEntities = castableEntity[CASTABLE].melee
        ? getAttackables(world, entity[POSITION])
        : getAffectables(world, entity[POSITION]);

      for (const targetEntity of targetEntities) {
        const rootEntity = getRoot(world, targetEntity);
        const affectableId = world.getEntityId(rootEntity);
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

        let hasAffected = castableEntity[CASTABLE].forceAffecting;
        const hasDamage =
          castableEntity[CASTABLE].melee ||
          castableEntity[CASTABLE].magic ||
          castableEntity[CASTABLE].true;
        const hasProcs =
          castableEntity[CASTABLE].burn ||
          castableEntity[CASTABLE].freeze ||
          castableEntity[CASTABLE].knock ||
          castableEntity[CASTABLE].drain ||
          casterEntity?.[CONDITIONABLE]?.zap;
        const fragmentEntity =
          (castableEntity[CASTABLE].melee
            ? getAttackable(world, entity[POSITION], true)
            : getAffectable(world, entity[POSITION], true)) || targetEntity;

        // prevent spell if bubble is active
        if (
          (hasDamage || hasProcs) &&
          attemptBubbleAbsorb(world, targetEntity)
        ) {
          hasAffected = true;
        } else if (isFriendlyFire(world, castableEntity, targetEntity)) {
          // process healing
          if (castableEntity[CASTABLE].heal && targetEntity[STATS]) {
            const { healing, hp } = calculateHealing(
              targetEntity[STATS],
              castableEntity[CASTABLE].heal
            );

            // create hit marker
            if (healing > 0) {
              targetEntity[STATS].hp = hp;
              createAmountMarker(world, fragmentEntity, healing, "up", "true");
              play("pickup", pickupOptions.hp);
              hasAffected = true;
            }
          }
        } else {
          const orientation = relativeOrientations(
            world,
            castableEntity[POSITION],
            targetEntity[POSITION]
          )[0];

          // inflict direct damage
          if (hasDamage) {
            hasAffected = true;

            const { damage, hp } = calculateDamage(
              world,
              castableEntity[CASTABLE],
              casterEntity || {},
              targetEntity
            );
            targetEntity[STATS].hp = hp;

            // propagate damage
            if (targetEntity !== rootEntity) {
              const { hp } = calculateDamage(
                world,
                { true: damage },
                {},
                rootEntity
              );
              rootEntity[STATS].hp = hp;
              rerenderEntity(world, rootEntity);
            }

            // play sound
            const proximity = heroEntity
              ? 1 /
                (getDistance(entity[POSITION], heroEntity[POSITION], size) + 1)
              : 0.5;
            play("magic", { intensity: damage, proximity });

            // add hit marker
            createAmountMarker(
              world,
              fragmentEntity,
              -damage,
              orientation,
              castableEntity[CASTABLE].melee ? "melee" : "magic"
            );
          }

          if (hasProcs) {
            // process burning and freezing on hit
            const procced = applyProcs(
              world,
              casterEntity,
              castableEntity[CASTABLE],
              entity[EXERTABLE].castable,
              rootEntity,
              entity[ORIENTABLE]?.facing || orientation
            );
            hasAffected = hasAffected || procced;
          }
        }

        if (hasAffected) {
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

      // propagate damage
      const rootEntity = getRoot(world, entity);
      if (entity !== rootEntity) {
        const { hp } = calculateDamage(world, { true: damage }, {}, rootEntity);
        rootEntity[STATS].hp = hp;
        rerenderEntity(world, rootEntity);
      }

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
