import { resolveSprite, spriteRef } from "../../game/assets/spriteIds";
import { bumpEntity } from "../motion";
import { requireComponent, hasComponent, TypedEntity } from "../entities";
import { LIQUID } from "../components/liquid";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add, combine, copy, random } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { disposeEntity, getCellEntities, registerEntity } from "./map";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
  orientations,
} from "../components/orientable";
import { isControllable, isSnowy } from "./freeze";
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
  fillItem,
  harvestConditions,
  harvestDurationFactor,
  harvestTools,
  pavingResources,
  plantConfigs,
  soilWaterDistance,
  trenchResources,
} from "../../game/balancing/harvesting";
import { getEquipmentStats } from "../../game/balancing/equipment";
import { NPC } from "../components/npc";
import { relativeOrientations, rotateOrientation } from "../../game/math/path";
import { rerenderEntity } from "./renderer";
import { getLimbs, isNeutral } from "./damage";
import { BUMPABLE } from "../components/bumpable";
import { getSpikable } from "./spike";
import { entities } from "..";
import { FARMABLE } from "../components/farmable";
import { SPRITE } from "../components/sprite";
import {
  brewItem,
  sapling1,
  sapling2,
  sapling3,
  sapling4,
  sapling5,
  soil,
  soilWet,
} from "../../game/assets/sprites";
import { INVENTORY } from "../components/inventory";
import { existingFund, isInPopup, matchesItem, missingFunds } from "./popup";
import {
  createItemText,
  getItemSprite,
  queueMessage,
} from "../../game/assets/utils";
import { removeFromInventory, spendItem } from "./trigger";
import { SEQUENCABLE } from "../components/sequencable";
import { BURNABLE } from "../components/burnable";
import { DROPPABLE } from "../components/droppable";
import { FOG } from "../components/fog";
import { createItemAsDrop } from "./drop";
import { PLAYER } from "../components/player";
import { FREEZABLE } from "../components/freezable";
import { IMMERSIBLE } from "../components/immersible";
import { REFILLABLE } from "../components/refillable";
import { createCell } from "../../bindings/creation";
import { getImmersible, isImmersible } from "./immersion";
import { LEVEL } from "../components/level";
import { iterateMatrixFromCenter } from "../../game/math/matrix";
import { updateShoreline } from "./water";
import { Recipe } from "../components/popup";
import { Brewable, BREWABLE } from "../components/brewable";
import {
  brewingDurationFactor,
  getBrewingDeal,
} from "../../game/balancing/brewing";
import { createText } from "../../game/assets/ui";
import { BUILDABLE } from "../components/buildable";
import { STATS } from "../components/stats";

export const isPlantable = (
  world: World,
  item: Omit<Item, "bound" | "carrier" | "amount">
) => !!plantConfigs[item.stackable!];

export const getHarvestables = (world: World, position: Position) => {
  const harvestables: TypedEntity<"HARVESTABLE">[] = [];

  if (getBlockable(world, position)) return harvestables;

  getCellEntities(world, position).forEach((target) => {
    if (hasComponent(target, HARVESTABLE)) {
      harvestables.push(target);
      return;
    }

    const fragmentEntity = getFragment(world, position);

    if (!fragmentEntity) return;

    const structurableEntity = world.getEntityById(
      fragmentEntity[FRAGMENT].structure
    );

    if (structurableEntity && hasComponent(structurableEntity, HARVESTABLE)) {
      harvestables.push(structurableEntity);
      return;
    }
  });

  return harvestables;
};

export const getHarvestable = (world: World, position: Position) => {
  // prioritize objects over sand
  const harvestables = getHarvestables(world, position);
  const grounds = harvestables.filter((cell) =>
    [...trenchResources, ...pavingResources].includes(
      cell[HARVESTABLE].resource
    )
  );
  return (
    harvestables.find(
      (cell) =>
        ![...trenchResources, ...pavingResources].includes(
          cell[HARVESTABLE].resource
        )
    ) || grounds[0]
  );
};

// check if pointing to something harvestable
export const getHarvestTarget = (
  world: World,
  entity: TypedEntity<"POSITION">,
  tool: TypedEntity<"ITEM">,
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

export const getBuildables = (world: World, position: Position) => {
  const buildables: TypedEntity[] = [];

  if (getBlockable(world, position)) return buildables;

  getCellEntities(world, position).forEach((target) => {
    if (hasComponent(target, BUILDABLE)) {
      buildables.push(target);
      return;
    }

    const fragmentEntity = getFragment(world, position);

    if (!fragmentEntity) return;

    const structurableEntity = world.getEntityById(
      fragmentEntity[FRAGMENT].structure
    );

    if (structurableEntity && hasComponent(structurableEntity, BUILDABLE)) {
      buildables.push(structurableEntity);
      return;
    }
  });

  return buildables;
};

export const getBuildable = (world: World, position: Position) =>
  getBuildables(world, position)[0];

export const getBuildTarget = (
  world: World,
  entity: TypedEntity<"POSITION">,
  tool: TypedEntity,
  orienation: Orientation
) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const delta = orientationPoints[orienation];
  const target = combine(size, entity[POSITION], delta);
  const buildable = getBuildable(world, target);
  if (buildable) return buildable;

  for (const cell of getCellEntities(world, target)) {
    if (
      hasComponent(cell, STATS) &&
      isNeutral(world, cell) &&
      cell[STATS].hp < cell[STATS].maxHp
    ) {
      return cell;
    }
  }
};

export const triggerTool = (world: World, entity: TypedEntity<"CONDITIONABLE" | "ORIENTABLE" | "POSITION">, tool: TypedEntity<"ITEM">) => {
  const orientation = entity[ORIENTABLE].facing || "up";
  const harvestable =
    tool[ITEM].tool === "hammer"
      ? getBuildTarget(world, entity, tool, orientation)
      : getHarvestTarget(world, entity, tool, orientation);
  const toolCondition = getSequence(world, entity, "condition");
  const conditionName =
    tool[ITEM].tool && harvestConditions[(tool[ITEM] as Item).tool!];

  const condition = conditionName && entity[CONDITIONABLE][conditionName];
  if (!harvestable || toolCondition?.name !== "toolCondition" || !condition) return;

  condition.modifier = toolCondition.elapsed;
  condition.orientation = orientation;
};

export const performDig = (
  world: World,
  entity: TypedEntity<"CONDITIONABLE" | "POSITION">,
  toolEntity: TypedEntity<"ITEM">
) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const immersible = getImmersible(world, entity[POSITION]);
  const harvestable = getHarvestTarget(world, entity, toolEntity);
  const adjacentWater = orientations
    .map((orientation) => orientationPoints[orientation])
    .some((delta) =>
      getImmersible(world, combine(size, entity[POSITION], delta))
    );
  if (immersible) {
    performFill(world, entity, entity[POSITION]);
  } else if (
    harvestable &&
    (!adjacentWater ||
      !trenchResources.includes(harvestable[HARVESTABLE].resource))
  ) {
    performHarvest(world, entity, toolEntity, harvestable, "down");
  } else if (harvestable && adjacentWater) {
    performTrench(world, entity, toolEntity, entity[POSITION]);
  } else {
    plantSoil(world, entity[POSITION]);
  }
};

export const harvestResource = (
  world: World,
  target: TypedEntity,
  amount: number
) => {
  const harvestable = requireComponent(target, HARVESTABLE);
  harvestable.amount = Math.max(0, harvestable.amount - amount);
  rerenderEntity(world, target);

  const farmable = getFarmable(world, requireComponent(target, POSITION));
  if (farmable) {
    farmable[FARMABLE].planted = undefined;
    farmable[FARMABLE].progress = undefined;
    farmable[FARMABLE].sapling = undefined;
    farmable[FARMABLE].nextGeneration = undefined;
  }
};

export const performHarvest = (
  world: World,
  entity: TypedEntity<"CONDITIONABLE" | "POSITION">,
  tool: TypedEntity<"ITEM">,
  targetEntity: TypedEntity,
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
  const condition = conditionName && entity[CONDITIONABLE][conditionName];
  if (!condition) return [];
  const harvestAmount = condition.amount;

  for (let targetIndex = 0; targetIndex < targets.length; targetIndex += 1) {
    const rangeTarget = targets[targetIndex];
    harvestResource(world, rangeTarget, harvestAmount);
    const entityOrientation = relativeOrientations(
      world,
      entity[POSITION],
      requireComponent(rangeTarget, POSITION)
    )[0];
    const bumpOrientation =
      targetIndex === 0
        ? orientation || entityOrientation
        : entityOrientation || orientation;

    // bump target resource
    const targetLimbs = getLimbs(world, rangeTarget);
    targetLimbs.forEach((limb) => {
      if (limb[BUMPABLE]) {
        bumpEntity(world, limb, bumpOrientation);
        rerenderEntity(world, limb);
      }
    });
  }

  return targets;
};

export const getFarmable = (world: World, position: Position) =>
  getCellEntities(world, position).find((entity) => hasComponent(entity, FARMABLE)) as
    | TypedEntity<"POSITION" | "FARMABLE">
    | undefined;

const getRefillElement = (world: World, position: Position) => {
  for (const cell of getCellEntities(world, position)) {
    if (cell[IMMERSIBLE]) return cell[IMMERSIBLE].type;
    if (cell[REFILLABLE] && !cell[FREEZABLE]?.frozen)
      return cell[REFILLABLE].element;
  }
};

export const canPlant = (world: World, entity: TypedEntity<"POSITION">) => {
  const farmable = getFarmable(world, entity[POSITION]);
  const toolEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE]?.tool,
    [ITEM]
  );
  return (
    toolEntity?.[ITEM].tool === "shovel" &&
    !!farmable &&
    !farmable[FARMABLE].planted &&
    !isInPopup(world, entity)
  );
};

export const isCell = (world: World, entity: TypedEntity) =>
  entity[SPRITE] && resolveSprite(entity[SPRITE]).layers.length > 0;

export const canPlow = (world: World, entity: TypedEntity, position: Position) =>
  !getCellEntities(world, position).some(
    (cell) => isCell(world, cell) && !cell[LIQUID] && cell !== entity
  );

export const canTrench = (world: World, entity: TypedEntity, position: Position) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  const harvestable = getHarvestable(world, position);
  const resource = harvestable?.[HARVESTABLE].resource as Resource | undefined;
  const immersible = getImmersible(world, position);
  const toolEntity = world.getEntityByIdAndComponents(requireComponent(entity, EQUIPPABLE).tool, [
    ITEM,
    SPRITE,
  ]);

  if (
    !toolEntity ||
    !toolEntity[ITEM].material ||
    toolEntity[ITEM].tool !== "shovel"
  )
    return false;

  const adjacentSand = orientations
    .map((orientation) => orientationPoints[orientation])
    .some((delta) =>
      getCellEntities(world, combine(size, position, delta)).some((cell) =>
        cell[HARVESTABLE] && trenchResources.includes(cell[HARVESTABLE].resource)
      )
    );
  if (
    immersible &&
    toolEntity[ITEM].material === "gold" &&
    adjacentSand &&
    missingFunds(world, entity, {
      item: { amount: 0 },
      prices: [fillItem],
      stock: 1,
    }).length === 0
  )
    return true;

  if (!resource || harvestTools[resource] !== "shovel") return false;

  if (resource === "sand" && toolEntity[ITEM].material !== "wood") return true;

  const adjacentWater = orientations
    .map((orientation) => orientationPoints[orientation])
    .some((delta) => getImmersible(world, combine(size, position, delta)));
  if (
    resource === "beach" &&
    toolEntity[ITEM].material === "gold" &&
    adjacentWater
  )
    return true;

  return false;
};

export const canHarvest = (
  world: World,
  entity: TypedEntity,
  position: Position
) => {
  const harvestable = getHarvestable(world, position);
  const resource = harvestable?.[HARVESTABLE].resource as Resource | undefined;
  const toolEntity = world.getEntityByIdAndComponents(requireComponent(entity, EQUIPPABLE).tool, [
    ITEM,
    SPRITE,
  ]);
  return (
    toolEntity &&
    resource &&
    !trenchResources.includes(resource) &&
    (getEquipmentStats(toolEntity[ITEM]).farming >= 2 ||
      resource === "grass" || resource === "bush" || resource in plantConfigs) &&
    harvestTools[resource] === "shovel"
  );
};

export const canDig = (world: World, entity: TypedEntity, position: Position) => {
  if (canPlow(world, entity, position)) return true;
  if (canTrench(world, entity, position)) return true;
  if (canHarvest(world, entity, position)) return true;
  if (getFarmable(world, position)) return true;
  return false;
};

export const performFill = (
  world: World,
  entity: TypedEntity<"POSITION">,
  position: Position
) => {
  const immersible = getImmersible(world, entity[POSITION]);
  if (!immersible) return;

  // fill cell
  spendItem(world, entity, fillItem);
  disposeEntity(world, immersible);

  // place cell
  world.metadata.gameEntity[LEVEL].cells[position.x][position.y] = "beach";
  const fillEntity = createCell(
    world,
    copy(position),
    "beach",
    "hidden",
    false
  ).cell;
  registerEntity(world, fillEntity);

  // update surrounding beaches and water
  updateShoreline(world, position);
};

export const performTrench = (
  world: World,
  entity: TypedEntity<"POSITION">,
  toolEntity: TypedEntity,
  position: Position
) => {
  const sandEntity = getHarvestable(world, entity[POSITION]);
  if (
    !sandEntity ||
    !trenchResources.includes(sandEntity[HARVESTABLE]?.resource)
  )
    return;

  // remove sand
  disposeEntity(world, sandEntity);

  // place water
  world.metadata.gameEntity[LEVEL].cells[position.x][position.y] =
    "water_shallow";
  const waterEntity = createCell(
    world,
    copy(position),
    "water_shallow",
    "hidden",
    false
  ).cell;
  registerEntity(world, waterEntity);

  // update surrounding beaches and water
  updateShoreline(world, position);
};

export const plantSoil = (world: World, position: Position) => {
  const farmable = getFarmable(world, position);
  if (farmable) {
    disposeEntity(world, farmable);
    return;
  }

  let nearbyWater = false;
  iterateMatrixFromCenter(
    world.metadata.gameEntity[LEVEL].cells,
    position,
    (x, y) => {
      if (isImmersible(world, { x, y })) {
        nearbyWater = true;
        return true;
      }
    },
    soilWaterDistance
  );

  createCell(
    world,
    copy(position),
    nearbyWater ? "soil_wet" : "soil",
    "hidden"
  );
};

export const plantSeed = (world: World, entity: TypedEntity, item: TypedEntity<"ITEM">) => {
  const position = requireComponent(entity, POSITION);
  const farmable = getFarmable(world, position);
  const stackable = item[ITEM].stackable as Stackable;
  const plantConfig = plantConfigs[stackable];

  if (!farmable || !stackable || !plantConfig) return;

  // remove seed
  spendItem(world, entity, { ...item[ITEM], amount: 1 });

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
    [POSITION]: copy(position),
    [SPRITE]: sapling1,
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
  });

  // mark as planted
  farmable[SPRITE] = spriteRef(soil);
  farmable[FARMABLE].watered = false;
  farmable[FARMABLE].planted = stackable;
  farmable[FARMABLE].sapling = world.getEntityId(saplingEntity);
  farmable[FARMABLE].progress = 0;
  rerenderEntity(world, farmable);
};

export const canRefill = (world: World, entity: TypedEntity) =>
  existingFund(world, entity, { consume: "bucket", material: "iron" }) > 0;

export const refillWater = (world: World, entity: TypedEntity<"INVENTORY" | "PLAYER">, element: Element) => {
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
          amount: bucketItem[ITEM].amount,
          material: bucketItem[ITEM].material,
          element: "water",
        },
      },
      bucketItem[ITEM].amount
    );
    removeFromInventory(world, entity, bucketItem);
  }
};

export const queueBrew = (
  world: World,
  entity: TypedEntity,
  brewing: TypedEntity,
  recipe: Recipe,
  optionIndex: number
) => {
  const deal = getBrewingDeal(recipe, optionIndex);
  for (const priceItem of deal.prices) {
    spendItem(world, entity, priceItem);
  }

  (brewing[BREWABLE] as Brewable).queue.push({
    item: deal.item,
    duration: recipe.duration,
  });

  queueMessage(world, entity, {
    delay: 0,
    fast: false,
    orientation: "up",
    line: [...createText("Added "), ...createItemText(deal.item)],
  });
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
      const element = getRefillElement(world, entity[POSITION]);
      if (element && canRefill(world, entity)) {
        refillWater(world, entity, element);
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

        // prevent growth if covered by snow
        if (!isSnowy(world, entity[POSITION])) {
          entity[FARMABLE].progress += 1;
        }

        if (entity[FARMABLE].progress >= saplings.length) {
          if (plantConfig.crop) {
            // replace sapling with crop
            createItemAsDrop(world, entity[POSITION], entities.createItem, {
              [ITEM]: { ...plantConfig.crop, bound: false },
              [SPRITE]: getItemSprite(plantConfig.crop),
            });
          } else if (plantConfig.cell) {
            // replace soil with cell
            createCell(world, entity[POSITION], plantConfig.cell, "fog");
            disposeEntity(world, entity);
          }
          entity[FARMABLE].planted = undefined;
          entity[FARMABLE].progress = undefined;
          entity[FARMABLE].sapling = undefined;
          entity[FARMABLE].nextGeneration = undefined;
          disposeEntity(world, saplingEntity);
          continue;
        } else {
          // grow sapling
          saplingEntity[SPRITE] = spriteRef(
            saplings[entity[FARMABLE].progress]
          );
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

    // handle kettle brewing
    for (const entity of world.getEntities([
      BREWABLE,
      BURNABLE,
      INVENTORY,
      POSITION,
      RENDERABLE,
      SPRITE,
    ])) {
      const queuedItem = entity[BREWABLE].queue[0];

      // ensure kettle is simmering when active
      const shouldSimmer = !!queuedItem;
      if (entity[BURNABLE].simmer !== shouldSimmer) {
        entity[BURNABLE].burning = shouldSimmer;
        entity[BURNABLE].eternal = shouldSimmer;
        entity[BURNABLE].simmer = shouldSimmer;
        rerenderEntity(world, entity);
      }

      if (!queuedItem) continue;

      // start brewing
      const worldGeneration = world.metadata.gameEntity[RENDERABLE].generation;
      if (!queuedItem.generation) {
        queuedItem.generation = worldGeneration;
        continue;
      }

      // transform finished items
      if (
        worldGeneration <
        queuedItem.generation + queuedItem.duration * brewingDurationFactor
      )
        continue;

      entity[BREWABLE].queue.shift();
      addToInventory(
        world,
        entity,
        { [ITEM]: queuedItem.item },
        queuedItem.item.amount
      );

      // shrink items
      entity[INVENTORY].items.forEach((itemId) => {
        const itemEntity = world.assertByIdAndComponents(itemId, [
          ITEM,
          RENDERABLE,
          SPRITE,
        ]);
        itemEntity[SPRITE] = spriteRef(brewItem);
        rerenderEntity(world, itemEntity);
      });

      rerenderEntity(world, entity);
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
          soil[SPRITE] = spriteRef(soilWet);
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
                amount: waterBucket[ITEM].amount,
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
      if (isSnowy(world, targetPosition)) continue;
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
        triggerTool(world, entity, harvestItem);
      } else if (walkable || lootable || spikable) {
        // prevent all actions except walking and looting
        continue;
      }

      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
