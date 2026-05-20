import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add, copy, random } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { disposeEntity, getCell } from "./map";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";
import { isControllable } from "./freeze";
import { Harvestable, HARVESTABLE, Resource } from "../components/harvestable";
import { addToInventory, getLootable } from "./collect";
import { Element, Item, ITEM, Stackable, Tool } from "../components/item";
import { getSequence } from "./sequence";
import { EQUIPPABLE } from "../components/equippable";
import { CONDITIONABLE } from "../components/conditionable";
import { isWalkable } from "./movement";
import { getBlockable } from "./action";
import { getFragment } from "./enter";
import { FRAGMENT } from "../components/fragment";
import {
  harvestConditions,
  harvestDurationFactor,
  harvestTools,
  plantConfigs,
} from "../../game/balancing/harvesting";
import { getEquipmentStats } from "../../game/balancing/equipment";
import { NPC } from "../components/npc";
import { relativeOrientations, rotateOrientation } from "../../game/math/path";
import { rerenderEntity } from "./renderer";
import { getLimbs } from "./damage";
import { BUMPABLE } from "../components/bumpable";
import { getSpikable } from "./spike";
import { entities } from "..";
import { FARMABLE } from "../components/farmable";
import { SPRITE } from "../components/sprite";
import {
  createText,
  sapling1,
  sapling2,
  sapling3,
  sapling4,
  sapling5,
  soil,
  soilWet,
} from "../../game/assets/sprites";
import { INVENTORY } from "../components/inventory";
import { existingFund, matchesItem } from "./popup";
import {
  createItemText,
  getItemSprite,
  queueMessage,
} from "../../game/assets/utils";
import { consumeCharge, removeFromInventory } from "./trigger";
import { SEQUENCABLE } from "../components/sequencable";
import { BURNABLE } from "../components/burnable";
import { DROPPABLE } from "../components/droppable";
import { FOG } from "../components/fog";
import { createItemAsDrop } from "./drop";
import { PLAYER } from "../components/player";
import { REFILLABLE } from "../components/refillable";

export const isPlantable = (
  world: World,
  item: Omit<Item, "bound" | "carrier" | "amount">
) => !!plantConfigs[item.stackable!];

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
  orientation?: Orientation
) => {
  const target = orientation
    ? add(entity[POSITION], orientationPoints[orientation])
    : entity[POSITION];
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
  const harvestAmount = entity[CONDITIONABLE][conditionName].amount;

  for (const rangeTarget of targets) {
    rangeTarget[HARVESTABLE].amount = Math.max(
      0,
      rangeTarget[HARVESTABLE].amount - harvestAmount
    );
    rerenderEntity(world, rangeTarget);
    const bumpOrientation =
      relativeOrientations(world, entity[POSITION], rangeTarget[POSITION])[0] ||
      orientation;

    // reset soil
    const farmable = getFarmable(world, rangeTarget[POSITION]);
    if (farmable) {
      farmable[FARMABLE].planted = undefined;
      farmable[FARMABLE].progress = undefined;
      farmable[FARMABLE].sapling = undefined;
      farmable[FARMABLE].nextGeneration = undefined;
    }

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

export const getFarmable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (entity) => FARMABLE in entity
  ) as Entity | undefined;

export const getRefillable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (entity) => REFILLABLE in entity
  ) as Entity | undefined;

export const canPlow = (world: World, entity: Entity, position: Position) => {
  const sprites = Object.values(getCell(world, position)).filter(
    (cell) => cell[SPRITE] && cell[SPRITE].layers.length > 0 && cell !== entity
  );
  return sprites.length === 0;
};

export const canDig = (world: World, entity: Entity, position: Position) => {
  if (canPlow(world, entity, position)) return true;
  if (getFarmable(world, position)) return true;
  const harvestable = getHarvestable(world, position);
  if (
    harvestable &&
    harvestTools[harvestable[HARVESTABLE].resource as Resource] === "shovel"
  )
    return true;
  return false;
};

export const plantSoil = (world: World, position: Position) => {
  const farmable = getFarmable(world, position);
  if (farmable) {
    disposeEntity(world, farmable);
    return;
  }

  entities.createSoil(world, {
    [FARMABLE]: { watered: false },
    [POSITION]: copy(position),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: soil,
  });
};

export const plantSeed = (world: World, entity: Entity, item: Entity) => {
  const farmable = getFarmable(world, entity[POSITION]);
  const stackable = item[ITEM].stackable as Stackable;
  const plantConfig = plantConfigs[stackable];

  if (!farmable || !stackable || !plantConfig) return;

  // remove seed
  consumeCharge(world, entity, item[ITEM]);

  // place crop
  const saplingEntity = entities.createWeeds(world, {
    [BURNABLE]: {
      burning: false,
      eternal: false,
      simmer: false,
      combusted: false,
      decayed: false,
    },
    [DROPPABLE]: { decayed: false },
    [FOG]: { visibility: "hidden", type: "object" },
    [HARVESTABLE]: { amount: 1, maximum: 1, resource: plantConfig.harvest },
    [POSITION]: copy(entity[POSITION]),
    [SPRITE]: sapling1,
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
  });

  // mark as planted
  farmable[SPRITE] = soil;
  farmable[FARMABLE].watered = false;
  farmable[FARMABLE].planted = stackable;
  farmable[FARMABLE].sapling = world.getEntityId(saplingEntity);
  farmable[FARMABLE].progress = 0;
  rerenderEntity(world, farmable);
};

export const canRefill = (world: World, entity: Entity) =>
  existingFund(world, entity, { consume: "bucket", material: "iron" }) > 0;

export const refillWater = (world: World, entity: Entity, element: Element) => {
  const bucketItem = ((entity[INVENTORY]?.items || []) as number[])
    .map((itemId) => world.assertByIdAndComponents(itemId, [ITEM, SPRITE]))
    .find((itemEntity) =>
      matchesItem(world, itemEntity[ITEM], {
        consume: "bucket",
        material: "iron",
      })
    );

  if (bucketItem) {
    queueMessage(world, entity, {
      delay: 0,
      fast: false,
      orientation: "up",
      line: [...createText("Filled "), ...createItemText(bucketItem[ITEM])],
    });

    addToInventory(
      world,
      entity,
      {
        [ITEM]: {
          consume: "bucket",
          material: bucketItem[ITEM].material,
          element: "water",
        },
      },
      bucketItem[ITEM].amount
    );
    removeFromInventory(world, entity, bucketItem);
  }
};

const saplings = [sapling1, sapling2, sapling3, sapling4, sapling5];

export default function setupHarvest(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const worldGeneration = world.metadata.gameEntity[RENDERABLE].generation;
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // handle player refilling water
    for (const entity of world.getEntities([
      INVENTORY,
      PLAYER,
      POSITION,
      RENDERABLE,
      SEQUENCABLE,
      SPRITE,
    ])) {
      const refillable = getRefillable(world, entity[POSITION]);
      if (refillable && canRefill(world, entity)) {
        refillWater(world, entity, refillable[REFILLABLE].element);
      }
    }

    // handle crop growing
    for (const entity of world.getEntities([
      FARMABLE,
      POSITION,
      RENDERABLE,
      SPRITE,
    ])) {
      const saplingEntity = world.getEntityByIdAndComponents(
        entity[FARMABLE].sapling,
        [HARVESTABLE]
      );

      if (!entity[FARMABLE].planted || !saplingEntity) continue;

      const plantConfig = plantConfigs[entity[FARMABLE].planted];

      if (!plantConfig) continue;

      if (
        entity[FARMABLE].nextGeneration !== undefined &&
        entity[FARMABLE].progress !== undefined
      ) {
        if (entity[FARMABLE].nextGeneration > worldGeneration) continue;

        entity[FARMABLE].progress += 1;

        if (entity[FARMABLE].progress >= saplings.length) {
          // replace sapling with crop
          createItemAsDrop(world, entity[POSITION], entities.createItem, {
            [ITEM]: { ...plantConfig.crop, bound: false },
            [SPRITE]: getItemSprite(plantConfig.crop),
          });
          entity[FARMABLE].planted = undefined;
          entity[FARMABLE].progress = undefined;
          entity[FARMABLE].sapling = undefined;
          entity[FARMABLE].nextGeneration = undefined;
          disposeEntity(world, saplingEntity);
          continue;
        } else {
          // grow sapling
          saplingEntity[SPRITE] = saplings[entity[FARMABLE].progress];
          rerenderEntity(world, saplingEntity);
        }
      }

      entity[FARMABLE].nextGeneration =
        worldGeneration +
        Math.floor(
          (((plantConfig.duration * harvestDurationFactor) / saplings.length) *
            random(7, 13)) /
            10
        );
    }

    // handle player harvesting entities or refilling land
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

      const soil = getFarmable(world, entity[POSITION]);
      if (soil && !soil[FARMABLE].watered && !soil[FARMABLE].planted) {
        const waterBucket = ((entity[INVENTORY]?.items || []) as number[])
          .map((itemId) =>
            world.assertByIdAndComponents(itemId, [ITEM, SPRITE])
          )
          .find((itemEntity) =>
            matchesItem(world, itemEntity[ITEM], {
              consume: "bucket",
              material: "iron",
              element: "water",
            })
          );

        if (waterBucket) {
          soil[SPRITE] = soilWet;
          soil[FARMABLE].watered = true;
          rerenderEntity(world, soil);
          queueMessage(world, entity, {
            delay: 0,
            fast: false,
            orientation: "up",
            line: [
              ...createText("Used "),
              ...createItemText({ ...waterBucket[ITEM], amount: 1 }),
            ],
          });
          waterBucket[ITEM].amount -= 1;
          if (waterBucket[ITEM].amount === 0) {
            removeFromInventory(world, entity, waterBucket);
          }
          addToInventory(
            world,
            entity,
            {
              [ITEM]: {
                consume: "bucket",
                material: waterBucket[ITEM].material,
              },
            },
            1
          );
        }
      }

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
      const spikable = getSpikable(world, targetPosition);

      if (targetEntity) {
        triggerHarvest(world, entity, harvestItem);
      } else if (walkable || lootable || spikable) {
        // prevent all actions except walking and looting
        continue;
      }

      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
