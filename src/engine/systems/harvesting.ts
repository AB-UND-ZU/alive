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
import { HARVESTABLE } from "../components/harvestable";
import { getLootable } from "./collect";
import { ITEM, materials } from "../components/item";
import { getSequence } from "./sequence";
import { EQUIPPABLE } from "../components/equippable";
import { CONDITIONABLE } from "../components/conditionable";
import { isWalkable } from "./movement";

export const getHarvestable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (entity) => HARVESTABLE in entity
  ) as Entity | undefined;

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

  if (
    lootable ||
    !harvestable ||
    harvestable[HARVESTABLE].resource !== "tree" ||
    harvestable[HARVESTABLE].amount <= 0 ||
    materials.indexOf(harvestable[HARVESTABLE].material) >
      materials.indexOf(tool[ITEM].material)
  )
    return;

  return harvestable;
};

export const harvestTree = (world: World, entity: Entity, axe: Entity) => {
  const harvestable = getHarvestTarget(world, entity, axe);
  const axeCondition = getSequence(world, entity, "condition");

  if (!harvestable || axeCondition?.name !== "axeCondition") return;

  entity[CONDITIONABLE].axe.duration = axeCondition.elapsed;
  entity[CONDITIONABLE].axe.orientation = entity[ORIENTABLE].facing;
};

export default function setupHarvesting(world: World) {
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
        entity[EQUIPPABLE].secondary,
        [ITEM]
      );
      const axeCondition = entity[CONDITIONABLE].axe;
      if (
        !isControllable(world, entity) ||
        !axeCondition ||
        harvestItem?.[ITEM].secondary !== "axe"
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
        harvestTree(world, entity, harvestItem);
      } else if (walkable || lootable) {
        // prevent all actions except walking and looting
        continue;
      }

      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
