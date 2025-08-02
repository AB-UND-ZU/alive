import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { disposeEntity, getCell, updateWalkable } from "./map";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";
import { LOOTABLE } from "../components/lootable";
import { EQUIPPABLE } from "../components/equippable";
import { INVENTORY } from "../components/inventory";
import { Item, ITEM, STACK_SIZE } from "../components/item";
import { getEntityGeneration, rerenderEntity } from "./renderer";
import { removeFromInventory } from "./trigger";
import { COLLECTABLE } from "../components/collectable";
import {
  createText,
  getMaxCounter,
  getStatSprite,
  woodStick,
} from "../../game/assets/sprites";
import * as colors from "../../game/assets/colors";
import { createSequence, getSequence } from "./sequence";
import { CollectSequence, SEQUENCABLE } from "../components/sequencable";
import { STATS } from "../components/stats";
import { MELEE } from "../components/melee";
import { entities } from "..";
import { SPRITE } from "../components/sprite";
import { getGearStat } from "../../game/balancing/equipment";
import { dropEntity } from "./drop";
import { PLAYER } from "../components/player";
import { getItemSprite } from "../../components/Entity/utils";
import { isControllable } from "./freeze";
import { getLootDelay, queueMessage } from "../../game/assets/utils";
import { invertOrientation } from "../../game/math/path";

export const isLootable = (world: World, entity: Entity) =>
  LOOTABLE in entity &&
  INVENTORY in entity &&
  entity[INVENTORY].items.length > 0;

export const getLootable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isLootable(world, entity)
  ) as Entity | undefined;

export const isCollecting = (world: World, entity: Entity) =>
  LOOTABLE in entity &&
  INVENTORY in entity &&
  getSequence(world, entity, "collect");

export const getCollecting = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isCollecting(world, entity)
  ) as Entity | undefined;

export const getStackable = (world: World, entity: Entity, item: Item) => {
  const stackId = entity[INVENTORY].items.find((itemId: number) => {
    const inventoryItem = world.assertByIdAndComponents(itemId, [ITEM]);
    return (
      inventoryItem[ITEM].stackable === item.stackable &&
      inventoryItem[ITEM].material === item.material &&
      inventoryItem[ITEM].amount < STACK_SIZE
    );
  });

  return world.getEntityByIdAndComponents(stackId, [ITEM]);
};

export const isEmpty = (world: World, entity: Entity) =>
  INVENTORY in entity &&
  LOOTABLE in entity &&
  entity[INVENTORY].items.length === 0 &&
  !isCollecting(world, entity);

export const isFull = (world: World, entity: Entity) =>
  INVENTORY in entity &&
  entity[INVENTORY].items.length >= entity[INVENTORY].size;

export const getCollectAmount = (world: World, item: Entity) => {
  if (item[ITEM].amount >= 5) return 3;
  if (item[ITEM].amount >= 4) return 2;
  return 1;
};

export const collectItem = (
  world: World,
  entity: Entity,
  target: Entity,
  orientation?: Orientation,
  fullStack = false
) => {
  // handle pick up
  for (
    let itemIndex = target[INVENTORY].items.length - 1;
    itemIndex >= 0;
    itemIndex -= 1
  ) {
    const itemId = target[INVENTORY].items[itemIndex];
    const itemEntity = world.assertByIdAndComponents(itemId, [ITEM]);

    // skip bound items
    if (itemEntity[ITEM].bound) continue;

    // reduce counter items
    const stat = itemEntity[ITEM].stat;
    const equipment = itemEntity[ITEM].equipment;
    const consume = itemEntity[ITEM].consume;
    const stackable = itemEntity[ITEM].stackable;
    let collectAmount = 1;

    if (stat) {
      // skip if counter exceeded or cap itself
      const maxCounter = getMaxCounter(stat);
      if (
        entity[STATS][stat] >= 99 ||
        (maxCounter !== stat &&
          entity[STATS][stat] >= entity[STATS][maxCounter]) ||
        ["maxHpCap", "maxMpCap"].includes(stat)
      )
        continue;

      collectAmount = getCollectAmount(world, itemEntity);
      itemEntity[ITEM].amount -= collectAmount;
    } else if (
      (equipment || (stackable && fullStack)) &&
      isFull(world, entity)
    ) {
      // skip if inventory full
      continue;
    } else if (stackable && !fullStack) {
      // skip if no more space to stack
      if (
        isFull(world, entity) &&
        !getStackable(world, entity, itemEntity[ITEM])
      ) {
        continue;
      } else {
        itemEntity[ITEM].amount -= 1;
      }
    }

    // remove from target inventory
    if (
      equipment ||
      consume ||
      ((stat || stackable) && itemEntity[ITEM].amount === 0) ||
      (stackable && fullStack)
    ) {
      removeFromInventory(world, target, itemEntity);
    }

    // assign new carrier on discrete items
    if (!stat && (!stackable || fullStack)) {
      itemEntity[ITEM].carrier = world.getEntityId(entity);
    }

    // initiate collecting animation on player
    createSequence<"collect", CollectSequence>(
      world,
      entity,
      "collect",
      "itemCollect",
      { origin: target[POSITION], itemId, drop: false, amount: collectAmount }
    );

    // initiate collecting animation on player
    if (orientation && itemEntity[ITEM].stat !== "hp") {
      const sprite = getItemSprite(itemEntity[ITEM]);
      queueMessage(world, entity, {
        line: createText(`+${collectAmount} ${sprite.name}`, colors.silver),
        orientation: invertOrientation(orientation),
        fast: false,
        delay: getLootDelay(world, entity, 1),
      });
    }

    // update walkable
    updateWalkable(world, target[POSITION]);

    rerenderEntity(world, target);
    break;
  }
};

export const addToInventory = (
  world: World,
  entity: Entity,
  itemEntity: Entity,
  fullStack = false,
  amount = 1
) => {
  const entityId = world.getEntityId(entity);
  let targetEquipment = itemEntity[ITEM].equipment;
  let targetStat = itemEntity[ITEM].stat;
  let targetConsume = itemEntity[ITEM].consume;
  let targetStackable = itemEntity[ITEM].stackable;
  let targetItem = itemEntity;

  // if no sword is equipped, use wood as stick
  if (entity[MELEE] && !entity[EQUIPPABLE].sword && targetStat === "stick") {
    const woodSword = entities.createSword(world, {
      [ITEM]: {
        amount: getGearStat("sword", "wood"),
        equipment: "sword",
        material: "wood",
        carrier: entityId,
        bound: false,
      },
      [ORIENTABLE]: {},
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: woodStick,
    });

    addToInventory(world, entity, woodSword);
    amount -= 1;
  }

  const targetId = world.getEntityId(targetItem);

  if (targetEquipment) {
    const existingId = entity[EQUIPPABLE][targetEquipment];

    // add existing render count if item is replaced
    if (existingId) {
      const existingItem = world.assertById(existingId);
      targetItem[RENDERABLE].generation += getEntityGeneration(
        world,
        existingItem
      );

      removeFromInventory(world, entity, existingItem);
      dropEntity(
        world,
        { [INVENTORY]: { items: [existingId] } },
        entity[POSITION]
      );
    }

    entity[EQUIPPABLE][targetEquipment] = targetId;
    entity[INVENTORY].items.push(targetId);
  } else if (
    targetConsume ||
    (targetStackable && itemEntity[ITEM].amount === STACK_SIZE)
  ) {
    entity[INVENTORY].items.push(targetId);
  } else if (targetStat && amount > 0) {
    const maxStat = getMaxCounter(targetStat);
    const maximum = maxStat !== targetStat ? entity[STATS][maxStat] : 99;
    const collectAmount = fullStack ? itemEntity[ITEM].amount : amount;
    const newAmount = entity[STATS][targetStat] + collectAmount;
    const overflow = Math.max(newAmount, maximum) - maximum;

    entity[STATS][targetStat] = Math.min(newAmount, maximum);

    // drop stats aside if overflowing
    if (overflow > 0) {
      const statEntity = entities.createItem(world, {
        [ITEM]: {
          stat: targetStat,
          amount: overflow,
          carrier: -1,
          bound: false,
        },
        [SPRITE]: getStatSprite(targetStat, "drop"),
        [RENDERABLE]: { generation: 0 },
      });
      dropEntity(
        world,
        { [INVENTORY]: { items: [world.getEntityId(statEntity)] } },
        entity[POSITION]
      );
    }

    if (entity[PLAYER] && targetStat === "hp") {
      entity[PLAYER].healingReceived += collectAmount;
    }
  } else if (targetStackable) {
    // add to existing stack if available
    const existingStack = getStackable(world, entity, itemEntity[ITEM]);

    if (existingStack) {
      existingStack[ITEM].amount += 1;
    } else {
      // create new stack
      const stackEntity = entities.createItem(world, {
        [ITEM]: { ...itemEntity[ITEM], carrier: entityId },
        [SPRITE]: getItemSprite(itemEntity[ITEM]),
        [RENDERABLE]: { generation: 0 },
      });
      const stackId = world.getEntityId(stackEntity);
      stackEntity[ITEM].amount = 1;
      entity[INVENTORY].items.push(stackId);
    }
  }

  // delete old stack
  if ((targetStat || targetStackable) && itemEntity[ITEM].amount === 0) {
    disposeEntity(world, itemEntity);
  }
};

export default function setupCollect(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // handle player collecting item
    for (const entity of world.getEntities([
      POSITION,
      COLLECTABLE,
      MOVABLE,
      EQUIPPABLE,
      INVENTORY,
      STATS,
      RENDERABLE,
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

      // skip if unable to collect or still collecting
      if (
        !isControllable(world, entity) ||
        getSequence(world, entity, "collect")
      )
        continue;

      const targetOrientation: Orientation | null =
        entity[MOVABLE].pendingOrientation || entity[MOVABLE].orientations[0];

      if (!targetOrientation) continue;

      const delta = orientationPoints[targetOrientation];
      const targetPosition = add(entity[POSITION], delta);
      const targetEntity = getLootable(world, targetPosition);

      if (!targetEntity) continue;

      collectItem(world, entity, targetEntity, targetOrientation);

      // mark as interacted
      entity[MOVABLE].pendingOrientation = undefined;
      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
