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
import { ITEM } from "../components/item";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";
import { EQUIPPABLE } from "../components/equippable";
import { isGhost } from "./fate";
import { createSequence } from "./sequence";
import { MarkerSequence, MeleeSequence } from "../components/sequencable";
import { BELONGABLE, neutrals, tribes } from "../components/belongable";
import {
  attributes,
  emptyUnitStats,
  UnitStats,
  STATS,
} from "../components/stats";
import { colors } from "../../game/assets/colors";
import { addBackground, createText } from "../../game/assets/sprites";
import { PLAYER } from "../components/player";
import { isControllable } from "./freeze";
import { RECHARGABLE } from "../components/rechargable";
import { Castable, DamageType } from "../components/castable";
import { TypedEntity } from "../entities";
import { createItemName, queueMessage } from "../../game/assets/utils";
import { play } from "../../game/sound";
import { POPUP } from "../components/popup";
import { getEquipmentStats } from "../../game/balancing/equipment";
import { NPC } from "../components/npc";
import { getAbilityStats } from "../../game/balancing/abilities";
import { closePopup, getActivePopup } from "./popup";

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
  const entityFaction = entity[BELONGABLE].faction;
  const targetFaction = target[BELONGABLE].faction;

  return (
    entityFaction === targetFaction ||
    (isTribe(world, entity) && isTribe(world, target)) ||
    (isNeutral(world, entity) && isNeutral(world, target)) ||
    (entityFaction === "wild" && targetFaction === "unit")
  );
};

export const getAttackable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (target) => ATTACKABLE in target && STATS in target
  ) as Entity | undefined;

export const getAttackables = (world: World, position: Position) =>
  Object.values(getCell(world, position)).filter(
    (target) => ATTACKABLE in target && STATS in target
  ) as Entity[];

export const getEntityStats = (world: World, entity: TypedEntity) => {
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

export const createAmountMarker = (
  world: World,
  entity: Entity,
  amount: number,
  orientation: Orientation,
  type: DamageType
) => {
  createSequence<"marker", MarkerSequence>(
    world,
    entity,
    "marker",
    "amountMarker",
    {
      amount,
      type,
    }
  );
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

      if (!targetEntity || isFriendlyFire(world, entity, targetEntity))
        continue;

      // show message if entity has no sword
      if (!entity[EQUIPPABLE].sword) {
        if (!targetEntity[POPUP]) {
          queueMessage(world, entity, {
            line: addBackground(
              [
                ...createText("Need ", colors.silver),
                ...createItemName({ equipment: "sword", material: "wood" }),
                ...createText("!", colors.silver),
              ],
              colors.black
            ),
            orientation: "up",
            fast: false,
            delay: 0,
          });
        }
        continue;
      }

      // mark as interacted
      entity[MOVABLE].pendingOrientation = undefined;
      entity[MOVABLE].lastInteraction = entityGeneration;

      // do nothing if target is dead and pending decay
      if (isDead(world, targetEntity)) continue;

      const sword = world.assertByIdAndComponents(entity[EQUIPPABLE].sword, [
        ITEM,
        ORIENTABLE,
      ]);
      const swordStats = getEquipmentStats(sword[ITEM], entity[NPC]?.type);
      const { damage, hp } = calculateDamage(
        world,
        swordStats,
        entity,
        targetEntity
      );

      targetEntity[STATS].hp = hp;

      // play sound
      play("hit", {
        intensity: damage,
        proximity: targetEntity[PLAYER] ? 1 : 0.5,
        variant: targetEntity[PLAYER] ? 1 : 2,
      });

      // perform bump
      entity[MELEE].facing = targetOrientation;
      entity[MOVABLE].bumpGeneration = entity[RENDERABLE].generation;

      if (entity[ORIENTABLE]) {
        entity[ORIENTABLE].facing = targetOrientation;
      }

      // set rechargable if applicable
      const secondaryEntity = world.getEntityByIdAndComponents(
        entity[EQUIPPABLE].secondary,
        [ITEM]
      );
      const canRecharge =
        secondaryEntity?.[ITEM].secondary &&
        secondaryEntity[ITEM].secondary !== "bow";

      if (canRecharge && targetEntity[RECHARGABLE]) {
        targetEntity[RECHARGABLE].hit = true;
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
      createAmountMarker(
        world,
        targetEntity,
        -damage,
        targetOrientation,
        "melee"
      );

      rerenderEntity(world, targetEntity);
    }
  };

  return { onUpdate };
}
