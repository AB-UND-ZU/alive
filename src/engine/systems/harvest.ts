import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { getCell } from "./map";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";
import { isControllable } from "./freeze";
import { Harvestable, HARVESTABLE } from "../components/harvestable";
import { getLootable } from "./collect";
import { Item, ITEM, Tool } from "../components/item";
import { getSequence } from "./sequence";
import { EQUIPPABLE } from "../components/equippable";
import { CONDITIONABLE } from "../components/conditionable";
import { isWalkable } from "./movement";
import { getBlockable } from "./action";
import { getFragment } from "./enter";
import { FRAGMENT } from "../components/fragment";
import {
  harvestConditions,
  harvestTools,
} from "../../game/balancing/harvesting";
import { getEquipmentStats } from "../../game/balancing/equipment";
import { NPC } from "../components/npc";
import { relativeOrientations, rotateOrientation } from "../../game/math/path";
import { rerenderEntity } from "./renderer";
import { getLimbs } from "./damage";
import { BUMPABLE } from "../components/bumpable";

export const getHarvestable = (world: World, position: Position) => {
  if (getBlockable(world, position)) return;

  for (const target of Object.values(getCell(world, position))) {
    if (HARVESTABLE in target) return target;

    const fragmentEntity = getFragment(world, position);

    if (!fragmentEntity) continue;

    const structurableEntity = world.getEntityById(
      fragmentEntity[FRAGMENT].structure
    );

    if (structurableEntity && HARVESTABLE in structurableEntity)
      return structurableEntity;
  }
};

// check if pointing to something harvestable
export const getHarvestTarget = (
  world: World,
  entity: Entity,
  tool: Entity,
  orientation: Orientation
) => {
  const target = add(entity[POSITION], orientationPoints[orientation]);
  const harvestable = getHarvestable(world, target);
  const lootable = getLootable(world, target);
  const toolName =
    harvestable &&
    harvestTools[(harvestable[HARVESTABLE] as Harvestable).resource];

  if (
    lootable ||
    !harvestable ||
    tool[ITEM].tool !== toolName ||
    harvestable[HARVESTABLE].amount <= 0
  )
    return;

  return harvestable;
};

export const triggerHarvest = (world: World, entity: Entity, tool: Entity) => {
  const orientation = entity[ORIENTABLE].facing || "up";
  const harvestable = getHarvestTarget(world, entity, tool, orientation);
  const toolCondition = getSequence(world, entity, "condition");
  const conditionName =
    tool[ITEM].tool && harvestConditions[(tool[ITEM] as Item).tool!];

  if (!harvestable || toolCondition?.name !== "toolCondition") return;

  entity[CONDITIONABLE][conditionName].modifier = toolCondition.elapsed;
  entity[CONDITIONABLE][conditionName].orientation = orientation;
};

export const performHarvest = (
  world: World,
  entity: Entity,
  tool: Entity,
  targetEntity: Entity,
  orientation: Orientation
) => {
  const toolStats = getEquipmentStats(tool[ITEM], entity[NPC]?.type);
  const targets = [targetEntity];

  // add adjacent cells for larger range
  if (toolStats.range > 1) {
    const leftTarget = getHarvestTarget(
      world,
      entity,
      tool,
      rotateOrientation(orientation, -1)
    );
    const rightTarget = getHarvestTarget(
      world,
      entity,
      tool,
      rotateOrientation(orientation, 1)
    );

    if (leftTarget) targets.push(leftTarget);
    if (rightTarget) targets.push(rightTarget);
  }

  const conditionName =
    tool[ITEM].tool && harvestConditions[tool[ITEM].tool as Tool];

  for (const rangeTarget of targets) {
    rangeTarget[HARVESTABLE].amount = Math.max(
      0,
      rangeTarget[HARVESTABLE].amount -
        entity[CONDITIONABLE][conditionName].amount
    );
    rerenderEntity(world, rangeTarget);
    const bumpOrientation =
      relativeOrientations(world, entity[POSITION], rangeTarget[POSITION])[0] ||
      orientation;

    // bump target resource
    const targetLimbs = getLimbs(world, rangeTarget);
    targetLimbs.forEach((limb) => {
      if (limb[BUMPABLE]) {
        limb[BUMPABLE].generation = limb[RENDERABLE].generation;
        limb[BUMPABLE].orientation = bumpOrientation;
        rerenderEntity(world, limb);
      }
    });
  }

  return targets;
};

export default function setupHarvest(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // handle player harvesting entities
    for (const entity of world.getEntities([
      POSITION,
      MOVABLE,
      EQUIPPABLE,
      CONDITIONABLE,
      ORIENTABLE,
    ])) {
      const entityId = world.getEntityId(entity);
      const entityReference = world.assertByIdAndComponents(
        entity[MOVABLE].reference,
        [RENDERABLE]
      )[RENDERABLE].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      // skip if entity already interacted
      if (entity[MOVABLE].lastInteraction === entityReference) continue;

      // skip if unable to interact or harvest
      const harvestItem = world.getEntityByIdAndComponents(
        entity[EQUIPPABLE].tool,
        [ITEM]
      );
      const conditionName =
        harvestItem?.[ITEM].tool && harvestConditions[harvestItem[ITEM].tool];
      const toolCondition =
        conditionName && entity[CONDITIONABLE][conditionName];
      if (
        !conditionName ||
        !isControllable(world, entity) ||
        !toolCondition ||
        (harvestItem?.[ITEM].tool !== "axe" &&
          harvestItem?.[ITEM].tool !== "pickaxe")
      )
        continue;

      const targetOrientation: Orientation | null =
        entity[MOVABLE].momentum ||
        entity[MOVABLE].orientations[0] ||
        entity[MOVABLE].pendingOrientation;

      if (!targetOrientation) continue;

      entity[ORIENTABLE].facing = targetOrientation;
      const delta = orientationPoints[targetOrientation];
      const targetPosition = add(entity[POSITION], delta);
      const targetEntity = getHarvestTarget(
        world,
        entity,
        harvestItem,
        targetOrientation
      );
      const walkable = isWalkable(world, targetPosition);
      const lootable = getLootable(world, targetPosition);

      if (targetEntity) {
        triggerHarvest(world, entity, harvestItem);
      } else if (walkable || lootable) {
        // prevent all actions except walking and looting
        continue;
      }

      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
