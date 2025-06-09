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
import {
  MarkerSequence,
  MeleeSequence,
  MessageSequence,
} from "../components/sequencable";
import { BELONGABLE, neutrals, tribes } from "../components/belongable";
import { Stats, STATS } from "../components/stats";
import * as colors from "../../game/assets/colors";
import { createText } from "../../game/assets/sprites";
import { PLAYER } from "../components/player";

export const isDead = (world: World, entity: Entity) =>
  (STATS in entity && entity[STATS].hp <= 0) || isGhost(world, entity);

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

export type DamageType = "physical" | "magic" | "true";

// calculate damage, with 1 / (x + 2) probability for 1 dmg if below 1
export const calculateDamage = (
  medium: DamageType,
  attack: number,
  resistance: number,
  attackerStats: Partial<Stats>,
  defenderStats: Stats
) => {
  const offensive =
    medium === "physical"
      ? attack + (attackerStats.power || 0)
      : attack + (attackerStats.magic || 0);
  const defensive =
    medium === "physical"
      ? resistance + defenderStats.armor
      : medium === "magic"
      ? defenderStats.armor
      : 0;
  const damage =
    offensive > defensive
      ? offensive - defensive
      : 1 / (defensive - offensive + 2);
  const hp = Math.max(0, defenderStats.hp - damage);
  const visibleDamage =
    damage >= 1 ? damage : Math.ceil(defenderStats.hp) > Math.ceil(hp) ? 1 : 0;
  return { damage: visibleDamage, hp };
};

export const createAmountMarker = (
  world: World,
  entity: Entity,
  amount: number,
  orientation: Orientation
) => {
  createSequence<"marker", MarkerSequence>(
    world,
    entity,
    "marker",
    "amountMarker",
    {
      amount,
    }
  );
  createSequence<"message", MessageSequence>(
    world,
    entity,
    "message",
    "transientMessage",
    {
      message: createText(
        Math.abs(amount).toString(),
        amount === 0 ? colors.white : amount > 0 ? colors.lime : colors.red
      ),
      orientation,
      fast: amount <= 0,
    }
  );

  // increase total damage counter
  if (entity[PLAYER] && amount < 0) {
    entity[PLAYER].damageReceived -= amount;
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

      // skip if entity has no sword equipped or already interacted
      if (
        !entity[EQUIPPABLE].sword ||
        entity[MOVABLE].lastInteraction === entityGeneration
      )
        continue;

      // skip if dead
      if (isDead(world, entity)) continue;

      const targetOrientation: Orientation | null =
        entity[MOVABLE].pendingOrientation || entity[MOVABLE].orientations[0];

      if (!targetOrientation) continue;

      const delta = orientationPoints[targetOrientation];
      const targetPosition = add(entity[POSITION], delta);
      const targetEntity = getAttackable(world, targetPosition);

      if (!targetEntity || isFriendlyFire(world, entity, targetEntity))
        continue;

      // mark as interacted
      entity[MOVABLE].pendingOrientation = undefined;
      entity[MOVABLE].lastInteraction = entityGeneration;

      // do nothing if target is dead and pending decay
      if (isDead(world, targetEntity)) continue;

      const sword = world.assertByIdAndComponents(entity[EQUIPPABLE].sword, [
        ITEM,
        ORIENTABLE,
      ]);
      const attack = sword[ITEM].amount;

      const shield = world.getEntityByIdAndComponents(
        targetEntity[EQUIPPABLE]?.shield,
        [ITEM]
      );
      const resistance = shield ? shield[ITEM].amount : 0;
      const { damage, hp } = calculateDamage(
        "physical",
        attack,
        resistance,
        entity[STATS],
        targetEntity[STATS]
      );

      targetEntity[STATS].hp = hp;

      // perform bump
      entity[MELEE].facing = targetOrientation;
      entity[MELEE].bumpGeneration = entity[RENDERABLE].generation;

      // animate sword orientation
      createSequence<"melee", MeleeSequence>(
        world,
        entity,
        "melee",
        "swordAttack",
        { facing: targetOrientation, tick: entityReference[REFERENCE].tick }
      );

      // create hit marker
      createAmountMarker(world, targetEntity, -damage, targetOrientation);

      rerenderEntity(world, targetEntity);
    }
  };

  return { onUpdate };
}
