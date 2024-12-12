import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add, random } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { MELEE } from "../components/melee";
import { getCell } from "./map";
import { ATTACKABLE } from "../components/attackable";
import { rerenderEntity } from "./renderer";
import { ITEM } from "../components/item";
import { Orientation, orientationPoints } from "../components/orientable";
import { EQUIPPABLE } from "../components/equippable";
import { isGhost } from "./fate";
import { createSequence } from "./sequence";
import { MeleeSequence } from "../components/sequencable";
import { BELONGABLE, neutrals, tribes } from "../components/belongable";
import { Stats, STATS } from "../components/stats";

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

// calculate damage, with 1 / (x + 2) probability for 1 dmg if below 1
export const calculateDamage = (
  medium: "physical" | "magic",
  attack: number,
  armor: number,
  offensiveStats: Partial<Stats>,
  defensiveStats: Stats
) => {
  const offensive =
    medium === "physical"
      ? attack + (offensiveStats.attack || 0)
      : attack + (offensiveStats.intellect || 0);
  const defensive =
    medium === "physical"
      ? armor + defensiveStats.defense
      : defensiveStats.defense;
  const damage =
    offensive > defensive
      ? offensive - defensive
      : random(0, defensive - offensive + 1) === 0
      ? 1
      : 0;
  return { damage, hp: Math.max(0, defensiveStats.hp - damage) };
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
        [RENDERABLE]
      )[RENDERABLE].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      // skip if entity has no sword equipped or already interacted
      if (
        !entity[EQUIPPABLE].melee ||
        entity[MOVABLE].lastInteraction === entityReference
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
      entity[MOVABLE].lastInteraction = entityReference;

      // do nothing if target is dead and pending decay
      if (isDead(world, targetEntity)) continue;

      const sword = world.assertByIdAndComponents(entity[EQUIPPABLE].melee, [
        ITEM,
      ]);
      const attack = sword[ITEM].amount;

      const armor = world.getEntityByIdAndComponents(
        targetEntity[EQUIPPABLE]?.armor,
        [ITEM]
      );
      const defense = armor ? armor[ITEM].amount : 0;
      const { damage, hp } = calculateDamage(
        "physical",
        attack,
        defense,
        entity[STATS],
        targetEntity[STATS]
      );

      targetEntity[STATS].hp = hp;

      // handle attacking
      createSequence<"melee", MeleeSequence>(
        world,
        entity,
        "melee",
        "swordAttack",
        { facing: targetOrientation, damage }
      );

      rerenderEntity(world, targetEntity);
    }
  };

  return { onUpdate };
}
