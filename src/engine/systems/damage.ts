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
import { ITEM, ItemStats, rechargables } from "../components/item";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";
import { EQUIPPABLE } from "../components/equippable";
import { isGhost } from "./fate";
import { createSequence, getSequence } from "./sequence";
import { MarkerSequence, MeleeSequence } from "../components/sequencable";
import { BELONGABLE, neutrals, tribes } from "../components/belongable";
import {
  attributes,
  emptyUnitStats,
  UnitStats,
  STATS,
} from "../components/stats";
import { colors } from "../../game/assets/colors";
import { createText } from "../../game/assets/sprites";
import { PLAYER } from "../components/player";
import { isControllable } from "./freeze";
import { RECHARGABLE } from "../components/rechargable";
import { Castable, DamageType } from "../components/castable";
import { TypedEntity } from "../entities";
import { queueMessage } from "../../game/assets/utils";
import { pickupOptions, play } from "../../game/sound";
import { getEquipmentStats } from "../../game/balancing/equipment";
import { NPC } from "../components/npc";
import { getAbilityStats } from "../../game/balancing/abilities";
import { closePopup, getActivePopup } from "./popup";
import { Affectable, AFFECTABLE } from "../components/affectable";
import { extinguishEntity } from "./burn";
import { FRAGMENT } from "../components/fragment";
import { getFragment, isFragment } from "./enter";
import { CONDITIONABLE } from "../components/conditionable";
import { isDecaying } from "./drop";
import { STRUCTURABLE } from "../components/structurable";

export const isDead = (world: World, entity: Entity) =>
  (STATS in entity && entity[STATS].hp <= 0) || isGhost(world, entity);

export const isNpc = (world: World, entity: Entity) => NPC in entity;

export const isTribe = (world: World, entity: Entity) =>
  BELONGABLE in entity && tribes.includes(entity[BELONGABLE].faction);

export const isEnemy = (world: World, entity: Entity) =>
  BELONGABLE in entity && !tribes.includes(entity[BELONGABLE].faction);

export const isNeutral = (world: World, entity: Entity) =>
  BELONGABLE in entity && neutrals.includes(entity[BELONGABLE].faction);

export const isFriendlyFire = (
  world: World,
  entity: Entity,
  target: Entity
) => {
  if (!target[BELONGABLE]) return true;

  const entityFaction = entity[BELONGABLE].faction;
  const targetFaction = target[BELONGABLE].faction;

  return (
    entityFaction === targetFaction ||
    (isTribe(world, entity) && isTribe(world, target)) ||
    (isNeutral(world, entity) && isNeutral(world, target)) ||
    (entityFaction === "wild" && targetFaction === "unit")
  );
};

export const isFightable = (world: World, entity: Entity) =>
  ATTACKABLE in entity &&
  !(isDead(world, entity) && !isDecaying(world, entity));

export const getAttackable = (
  world: World,
  position: Position,
  fragment = false
) => {
  const targetEntity = Object.values(getCell(world, position)).find(
    (target) => ATTACKABLE in target && STATS in target
  ) as Entity | undefined;

  if (targetEntity) return targetEntity;

  const fragmentEntity = getFragment(world, position);

  if (!fragmentEntity) return;

  if (fragment) return fragmentEntity;

  const structurableEntity = world.assertById(
    fragmentEntity[FRAGMENT].structure
  );

  if (ATTACKABLE in structurableEntity && STATS in structurableEntity)
    return structurableEntity;
};

export const getAttackables = (world: World, position: Position) =>
  Object.values(getCell(world, position)).filter(
    (target) => ATTACKABLE in target && STATS in target
  ) as Entity[];

export const getRoot = (world: World, entity: Entity) =>
  isFragment(world, entity) ? getStructure(world, entity) : entity;

export const getStructure = (world: World, entity: Entity) =>
  world.getEntityById(entity[FRAGMENT].structure);

export const getLimbs = (world: World, entity: Entity) => {
  const limbs = [entity];

  if (entity[STRUCTURABLE]) {
    const entityId = world.getEntityId(entity);
    for (const limbEntity of world.getEntities([FRAGMENT])) {
      if (limbEntity[FRAGMENT].structure === entityId) {
        limbs.push(limbEntity);
      }
    }
  }
  return limbs;
};

export const getEntityStats = (
  world: World,
  entity: TypedEntity
): UnitStats => {
  const entityStats = { ...(entity[STATS] || emptyUnitStats) };
  Object.values(entity[EQUIPPABLE] || {}).forEach((itemId) => {
    const item = world.getEntityByIdAndComponents(itemId, [ITEM]);

    if (!item) return;

    const isAbility = item[ITEM].primary || item[ITEM].secondary;
    const itemStats = isAbility
      ? getAbilityStats(item[ITEM], entity[NPC]?.type)
      : getEquipmentStats(item[ITEM], entity[NPC]?.type);

    attributes.forEach((attribute) => {
      entityStats[attribute] += itemStats[attribute];
    });
  });

  return entityStats;
};

export const getEntityDisplayStats = (
  world: World,
  entity: TypedEntity
): UnitStats => {
  const entityStats = getEntityStats(world, entity);
  return {
    ...entityStats,
    vision: entityStats.vision + 3,
    haste: entityStats.haste + 3,
  };
};

// damage is calculated as follows:
//   attack  = attacker item + offensive stat
//   defense = defender item + defensive stat
//   delta   = attack - defense
// if attack <= 0
//   damage  = 0
// if delta > 0
//   damage  = delta
// else
//   damage  = 1 / (2 - delta)
// example values:
//   atk | def | dmg
//    3  |  0  |  3
//    3  |  1  |  2
//    3  |  3  | 0.5
//    3  |  5  | 0.25
export const calculateDamage = (
  world: World,
  itemStats: Partial<Pick<Castable, DamageType>>,
  attackerEntity: TypedEntity,
  defenderEntity: TypedEntity
) => {
  const attackerStats = getEntityStats(world, attackerEntity);
  const defenderStats = getEntityStats(world, defenderEntity);

  const offensive = itemStats.melee
    ? itemStats.melee + attackerStats.power
    : itemStats.magic
    ? itemStats.magic + attackerStats.wisdom
    : itemStats.true || 0;
  const defensive = itemStats.melee
    ? defenderStats.armor
    : itemStats.magic
    ? defenderStats.resist
    : 0;

  const attack = itemStats.melee || itemStats.magic || itemStats.true || 0;
  const delta = offensive - defensive;
  const damage = attack <= 0 ? 0 : delta > 0 ? delta : 1 / (2 - delta);
  const newHp = Math.max(0, defenderStats.hp - damage);

  const visibleHp = defenderStats.hp >= 1 ? Math.floor(defenderStats.hp) : 1;
  const visibleNewHp = newHp >= 1 ? Math.floor(newHp) : newHp === 0 ? 0 : 1;
  const passedThreshold = visibleNewHp < visibleHp;
  const visibleDamage = damage >= 1 ? damage : passedThreshold ? 1 : 0;

  return { damage: visibleDamage, hp: newHp };
};

export const calculateHealing = (targetStats: UnitStats, amount: number) => {
  const hp = Math.min(targetStats.maxHp, targetStats.hp + amount);
  const visibleHealing = Math.ceil(hp - targetStats.hp);
  return { hp, healing: visibleHealing };
};

export const applyEffects = (
  world: World,
  targetEntity: Entity,
  burn: number,
  freeze: number
) => {
  if (!targetEntity[AFFECTABLE]) return;

  const targetStats = getEntityStats(world, targetEntity);

  // set affected unit on fire
  const targetBurn = burn - targetStats.damp;
  const curentBurn = targetEntity[AFFECTABLE].burn;
  if (
    burn > 0 &&
    targetBurn > 0 &&
    targetBurn > curentBurn &&
    !isDead(world, targetEntity)
  ) {
    targetEntity[AFFECTABLE].burn = targetBurn;
  }

  // freeze affected units
  const targetFreeze = freeze - targetStats.thaw;
  const curentFreeze = targetEntity[AFFECTABLE].freeze;
  if (
    freeze > 0 &&
    targetFreeze > 0 &&
    targetFreeze > curentFreeze &&
    !isDead(world, targetEntity)
  ) {
    targetEntity[AFFECTABLE].freeze = targetFreeze;
  }

  // extinguish unit if burning and frozen
  if (
    targetEntity[AFFECTABLE].freeze > 0 &&
    targetEntity[AFFECTABLE].burn > 0
  ) {
    targetEntity[AFFECTABLE].freeze = 0;
    extinguishEntity(world, targetEntity);
  }
};

const procDelay = 100;

export const applyProcs = (
  world: World,
  attackerEntity: Entity,
  itemStats: Pick<ItemStats, "burn" | "freeze" | "drain">,
  procId: number,
  targetEntity: Entity
) => {
  if (!targetEntity[AFFECTABLE]) return;

  const { [procId]: lastProc, ...otherProcs } = (
    targetEntity[AFFECTABLE] as Affectable
  ).procs;
  const generation = world.metadata.gameEntity[RENDERABLE].generation;

  if (lastProc && lastProc + procDelay > generation) return;

  // process burn and freeze
  applyEffects(world, targetEntity, itemStats.burn, itemStats.freeze);

  // handle drain
  const drain = itemStats.drain;
  if (drain > 0) {
    const { healing, hp } = calculateHealing(attackerEntity[STATS], drain);
    attackerEntity[STATS].hp = hp;
    if (healing > 0) {
      createAmountMarker(world, attackerEntity, drain, "up", "true");
      play("pickup", pickupOptions.hp);
    }
  }

  // mark proc as handled
  targetEntity[AFFECTABLE].procs[procId] = generation;

  // clean up stale procs
  Object.entries(otherProcs).forEach(([procId, procGeneration]) => {
    if (
      procGeneration + procDelay <= generation ||
      !world.getEntityById(parseInt(procId))
    ) {
      delete targetEntity[AFFECTABLE].procs[procId];
    }
  });
};

export const createAmountMarker = (
  world: World,
  entity: Entity,
  amount: number,
  orientation: Orientation,
  type: DamageType
) => {
  if (!getSequence(world, entity, "marker")) {
    createSequence<"marker", MarkerSequence>(
      world,
      entity,
      "marker",
      "amountMarker",
      {
        amount,
        type,
        orientation,
      }
    );
  }

  queueMessage(world, entity, {
    line: createText(
      `${amount > 0 ? "+" : amount < 0 ? "-" : ""}${Math.abs(amount)}`,
      amount === 0
        ? colors.white
        : amount > 0
        ? colors.lime
        : type === "magic"
        ? colors.fuchsia
        : colors.red
    ),
    orientation,
    fast: amount <= 0,
    delay: 0,
  });

  // increase total damage counter
  if (entity[PLAYER] && amount < 0) {
    entity[PLAYER].receivedStats[type] -= amount;
  }
};

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
      STATS,
    ])) {
      const entityId = world.getEntityId(entity);
      const entityReference = world.assertByIdAndComponents(
        entity[MOVABLE].reference,
        [RENDERABLE, REFERENCE]
      );
      const entityGeneration = entityReference[RENDERABLE].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityGeneration) continue;

      entityReferences[entityId] = entityGeneration;

      // skip if entity has already interacted
      if (entity[MOVABLE].lastInteraction === entityGeneration) continue;

      // skip if not able to attack
      if (!isControllable(world, entity)) continue;

      const targetOrientation: Orientation | null =
        entity[MOVABLE].orientations[0] || entity[MOVABLE].pendingOrientation;

      if (!targetOrientation) continue;

      const delta = orientationPoints[targetOrientation];
      const targetPosition = add(entity[POSITION], delta);
      const targetEntity = getAttackable(world, targetPosition);

      // skip if entity has no sword or no target
      const swordId = entity[EQUIPPABLE].sword;
      const swordEntity = world.getEntityByIdAndComponents(swordId, [ITEM]);

      if (!swordId || !swordEntity || !targetEntity) continue;

      // skip if not damaging enemy or healing ally
      const healing =
        swordEntity[ITEM].element === "earth" && !swordEntity[ITEM].material;
      const friendly = isFriendlyFire(world, entity, targetEntity);

      if (healing !== friendly) continue;

      // mark as interacted
      entity[MOVABLE].pendingOrientation = undefined;
      entity[MOVABLE].lastInteraction = entityGeneration;

      // do nothing if target is dead and pending decay
      if (isDead(world, targetEntity)) continue;

      // prevent attack if shield is active
      let displayedDamage = 0;
      if (targetEntity[CONDITIONABLE]?.block && !healing) {
        targetEntity[CONDITIONABLE].block.amount -= 1;

        if (targetEntity[CONDITIONABLE].block.amount <= 0) {
          delete targetEntity[CONDITIONABLE].block;
        }
      } else {
        const sword = world.assertByIdAndComponents(entity[EQUIPPABLE].sword, [
          ITEM,
          ORIENTABLE,
        ]);
        const swordStats = getEquipmentStats(sword[ITEM], entity[NPC]?.type);

        if (entity[CONDITIONABLE]?.raise) {
          if (healing) {
            swordStats.heal += 2;
          } else {
            swordStats.melee += 2;
          }
          delete entity[CONDITIONABLE].raise;
        }

        if (healing) {
          const { healing, hp } = calculateHealing(
            targetEntity[STATS],
            swordStats.heal
          );
          targetEntity[STATS].hp = hp;

          displayedDamage = -healing;
        } else {
          const { damage, hp } = calculateDamage(
            world,
            swordStats,
            entity,
            targetEntity
          );

          targetEntity[STATS].hp = hp;

          // trigger on hit effects
          applyProcs(world, entity, swordStats, swordId, targetEntity);

          // play sound
          play("hit", {
            intensity: damage,
            proximity: targetEntity[PLAYER] ? 1 : 0.5,
            variant: targetEntity[PLAYER] ? 1 : 2,
          });

          // set rechargable if applicable
          const secondaryEntity = world.getEntityByIdAndComponents(
            entity[EQUIPPABLE].secondary,
            [ITEM]
          );
          const canRecharge = rechargables.includes(
            secondaryEntity?.[ITEM].secondary as (typeof rechargables)[number]
          );

          if (canRecharge && targetEntity[RECHARGABLE]) {
            targetEntity[RECHARGABLE].hit = true;
          }

          displayedDamage = damage;
        }
      }

      // perform bump
      entity[MELEE].facing = targetOrientation;
      entity[MOVABLE].bumpGeneration = entity[RENDERABLE].generation;

      if (entity[ORIENTABLE]) {
        entity[ORIENTABLE].facing = targetOrientation;
      }

      // close popup on target hits
      const activePopup = getActivePopup(world, targetEntity);
      if (activePopup) {
        closePopup(world, targetEntity, activePopup);
      }

      // animate sword orientation
      createSequence<"melee", MeleeSequence>(
        world,
        entity,
        "melee",
        "swordAttack",
        {
          facing: targetOrientation,
          tick: entityReference[REFERENCE].tick,
          rotate: false,
        }
      );

      // create hit marker
      const fragmentEntity =
        getAttackable(world, targetPosition, true) || targetEntity;

      if (!healing || displayedDamage !== 0) {
        createAmountMarker(
          world,
          fragmentEntity,
          -displayedDamage,
          targetOrientation,
          healing ? "true" : "melee"
        );
      }

      rerenderEntity(world, targetEntity);
      rerenderEntity(world, fragmentEntity);
    }
  };

  return { onUpdate };
}
