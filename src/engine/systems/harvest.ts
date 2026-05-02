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
import { Item, ITEM } from "../components/item";
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

export const getHarvestTarget = (
  world: World,
  entity: Entity,
  tool: Entity
) => {
  // check if pointing to something harvestable
  const orientation = entity[ORIENTABLE]?.facing as Orientation;

  if (!orientation || !entity[POSITION]) return;

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

export const harvestResource = (world: World, entity: Entity, tool: Entity) => {
  const harvestable = getHarvestTarget(world, entity, tool);
  const toolCondition = getSequence(world, entity, "condition");
  const conditionName =
    tool[ITEM].tool && harvestConditions[(tool[ITEM] as Item).tool!];

  if (!harvestable || toolCondition?.name !== "toolCondition") return;

  entity[CONDITIONABLE][conditionName].duration = toolCondition.elapsed;
  entity[CONDITIONABLE][conditionName].orientation = entity[ORIENTABLE].facing;
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
      const targetEntity = getHarvestTarget(world, entity, harvestItem);
      const walkable = isWalkable(world, targetPosition);
      const lootable = getLootable(world, targetPosition);

      if (targetEntity) {
        harvestResource(world, entity, harvestItem);
      } else if (walkable || lootable) {
        // prevent all actions except walking and looting
        continue;
      }

      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
