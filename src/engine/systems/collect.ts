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
import { Item, ITEM } from "../components/item";
import { getEntityGeneration, rerenderEntity } from "./renderer";
import { removeFromInventory } from "./trigger";
import { COLLECTABLE } from "../components/collectable";
import {
  addBackground,
  createText,
  getMaxCounter,
  times,
} from "../../game/assets/sprites";
import { colors } from "../../game/assets/colors";
import { createSequence, getSequence } from "./sequence";
import { CollectSequence, SEQUENCABLE } from "../components/sequencable";
import { MAX_STAT_VALUE, STATS } from "../components/stats";
import { MELEE } from "../components/melee";
import { entities } from "..";
import { SPRITE } from "../components/sprite";
import { dropEntity } from "./drop";
import { PLAYER } from "../components/player";
import { isControllable } from "./freeze";
import {
  getItemSprite,
  getLootDelay,
  queueMessage,
} from "../../game/assets/utils";
import { pickupOptions, play } from "../../game/sound";
import { IDENTIFIABLE } from "../components/identifiable";
import { setIdentifier } from "../utils";
import { recolorSprite } from "../../game/assets/templates";

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
      inventoryItem[ITEM].consume === item.consume &&
      inventoryItem[ITEM].material === item.material &&
      inventoryItem[ITEM].element === item.element
    );
  });

  return world.getEntityByIdAndComponents(stackId, [ITEM]);
};

export const isEmpty = (world: World, entity: Entity) =>
  INVENTORY in entity &&
  LOOTABLE in entity &&
  entity[INVENTORY].items.length === 0 &&
  !isCollecting(world, entity);

export const collectItem = (
  world: World,
  entity: Entity,
  target: Entity,
  orientation?: Orientation
) => {
  // handle pick up
  for (
    let itemIndex = target[INVENTORY].items.length - 1;
    itemIndex >= 0;
    itemIndex -= 1
  ) {
    const itemId = target[INVENTORY].items[itemIndex];
    const itemEntity = world.assertByIdAndComponents(itemId, [ITEM]);

    // skip bound items and XP
    if (itemEntity[ITEM].bound || itemEntity[ITEM].stat === "xp") continue;

    // reduce counter items
    const stat = itemEntity[ITEM].stat;
    const equipment = itemEntity[ITEM].equipment;
    const consume = itemEntity[ITEM].consume;
    const stackable = itemEntity[ITEM].stackable;
    let collectAmount = isFinite(itemEntity[ITEM].amount)
      ? itemEntity[ITEM].amount
      : 1;

    if (equipment) {
      // transfer inventory on discrete items
      itemEntity[ITEM].carrier = world.getEntityId(entity);
      removeFromInventory(world, target, itemEntity);
    } else if (isFinite(itemEntity[ITEM].amount)) {
      // mark stacks as empty
      itemEntity[ITEM].amount = 0;
      removeFromInventory(world, target, itemEntity);
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
    if (orientation && !itemEntity[ITEM].stat) {
      const sprite = getItemSprite(itemEntity[ITEM]);
      const textColor = equipment ? colors.black : colors.silver;
      const backgroundColor = equipment ? colors.silver : colors.black;

      queueMessage(world, entity, {
        line: [
          ...createText(`${collectAmount}`, textColor, backgroundColor),
          ...addBackground(
            [
              recolorSprite(times, {
                [colors.white]: textColor,
                [colors.black]: backgroundColor,
              }),
            ],
            backgroundColor
          ),
          ...createText(`${sprite.name}`, textColor, backgroundColor),
        ],
        orientation: "up",
        fast: false,
        delay: getLootDelay(world, entity, 1),
      });
    }

    // play sound
    if (!stat) {
      const options = pickupOptions[(stackable || consume)!];
      play("pickup", options);
    }

    // update walkable
    updateWalkable(world, target[POSITION]);

    rerenderEntity(world, target);
    return true;
  }

  return false;
};

export const addToInventory = (
  world: World,
  entity: Entity,
  itemEntity: Entity,
  amount: number
) => {
  const entityId = world.getEntityId(entity);
  let targetEquipment = itemEntity[ITEM].equipment;
  let targetStat = itemEntity[ITEM].stat;
  let targetConsume = itemEntity[ITEM].consume;
  let targetStackable = itemEntity[ITEM].stackable;
  let targetItem = itemEntity;

  // if no sword is equipped, use wood as stick
  if (
    entity[MELEE] &&
    !entity[EQUIPPABLE].sword &&
    targetStackable === "stick"
  ) {
    const itemData = {
      amount: 1,
      equipment: "sword",
      material: "wood",
      carrier: entityId,
      bound: false,
    } as const;
    const woodSword = entities.createSword(world, {
      [ITEM]: itemData,
      [ORIENTABLE]: {},
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: getItemSprite(itemData),
    });

    addToInventory(world, entity, woodSword, 1);
    amount -= 1;
  }

  const targetId = world.getEntityId(targetItem);

  if (amount === 0) {
    // empty block
  } else if (targetEquipment) {
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
  } else if (targetStat) {
    const maxStat = getMaxCounter(targetStat);
    const maximum =
      maxStat !== targetStat && maxStat
        ? entity[STATS][maxStat]
        : MAX_STAT_VALUE;
    const newAmount = entity[STATS][targetStat] + amount;
    const overflow = Math.max(newAmount, maximum) - maximum;
    const displayAmount = Math.ceil(amount - overflow);

    entity[STATS][targetStat] = Math.min(newAmount, maximum);

    if (
      entity[PLAYER] &&
      displayAmount === 0 &&
      (targetStat === "hp" || targetStat === "mp")
    ) {
      queueMessage(world, entity, {
        line: createText("0"),
        orientation: "up",
        fast: false,
        delay: 0,
      });
    } else if (
      entity[PLAYER] &&
      ["hp", "mp", "maxHp", "maxMp"].includes(targetStat)
    ) {
      entity[PLAYER].receivedStats[targetStat] += displayAmount;
    }
  } else if (targetStackable || targetConsume) {
    // add to existing stack if available
    let targetStack = getStackable(world, entity, itemEntity[ITEM]);

    if (targetStack) {
      targetStack[ITEM].amount += amount;
    } else {
      // create new stack
      targetStack = entities.createItem(world, {
        [ITEM]: { ...itemEntity[ITEM], carrier: entityId },
        [SPRITE]: getItemSprite(itemEntity[ITEM]),
        [RENDERABLE]: { generation: 0 },
      });
      const stackId = world.getEntityId(targetStack);
      targetStack[ITEM].amount = amount;
      entity[INVENTORY].items.push(stackId);
    }

    if (itemEntity[IDENTIFIABLE]) {
      setIdentifier(world, targetStack, itemEntity[IDENTIFIABLE].name);
    }
  }

  // delete old stack
  if (
    (targetStat || targetStackable || targetConsume) &&
    itemEntity[ITEM].amount === 0
  ) {
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
        entity[MOVABLE].orientations[0] || entity[MOVABLE].pendingOrientation;

      if (!targetOrientation) continue;

      const delta = orientationPoints[targetOrientation];
      const targetPosition = add(entity[POSITION], delta);
      const targetEntity = getLootable(world, targetPosition);

      if (!targetEntity) continue;

      const collected = collectItem(
        world,
        entity,
        targetEntity,
        targetOrientation
      );

      // perform bump animation
      if (collected && entity[ORIENTABLE]) {
        entity[ORIENTABLE].facing = targetOrientation;
        entity[MOVABLE].bumpGeneration = entity[RENDERABLE].generation;
      }

      // mark as interacted
      entity[MOVABLE].pendingOrientation = undefined;
      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
