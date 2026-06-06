import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add, clamp } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { disposeEntity, getCell, updateWalkable } from "./map";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";
import { LOOTABLE } from "../components/lootable";
import { equipments, EQUIPPABLE, Gear, slots } from "../components/equippable";
import { INVENTORY } from "../components/inventory";
import { Item, ITEM } from "../components/item";
import { getEntityGeneration, rerenderEntity } from "./renderer";
import { resetConditionables, removeFromInventory } from "./trigger";
import { COLLECTABLE } from "../components/collectable";
import { times } from "../../game/assets/sprites";
import { colors } from "../../game/assets/colors";
import { createSequence, getSequence } from "./sequence";
import { CollectSequence, SEQUENCABLE } from "../components/sequencable";
import { MAX_STAT_VALUE, STATS } from "../components/stats";
import { MELEE } from "../components/melee";
import { entities } from "..";
import { SPRITE } from "../components/sprite";
import { PLAYER } from "../components/player";
import { isControllable } from "./freeze";
import {
  createItemName,
  getItemSprite,
  getLootDelay,
  queueMessage,
} from "../../game/assets/utils";
import { pickupOptions, play } from "../../game/sound";
import { IDENTIFIABLE } from "../components/identifiable";
import { setIdentifier } from "../utils";
import {
  addBackground,
  createSpriteButton,
  createText,
  getMaxCounter,
  recolorSprite,
  underline,
} from "../../game/assets/ui";
import { BUMPABLE } from "../components/bumpable";
import { ACTIONABLE } from "../components/actionable";
import { isNpc } from "./damage";
import { assignQuickItem } from "./popup";

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
      inventoryItem[ITEM].stat === item.stat &&
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
    if (
      itemEntity[ITEM].bound ||
      (itemEntity[ITEM].stat === "xp" && !itemEntity[ITEM].material)
    )
      continue;

    // reduce counter items
    const stat = itemEntity[ITEM].stat;
    const material = itemEntity[ITEM].material;
    const consume = itemEntity[ITEM].consume;
    const stackable = itemEntity[ITEM].stackable;
    const isEquipment = slots.some((slot) => itemEntity[ITEM][slot]);
    let collectAmount = isFinite(itemEntity[ITEM].amount)
      ? itemEntity[ITEM].amount
      : 1;

    if (isEquipment) {
      // transfer inventory on discrete items
      removeFromInventory(world, target, itemEntity);
      itemEntity[ITEM].carrier = world.getEntityId(entity);
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
    if (orientation && !(stat && !material)) {
      const sprite = getItemSprite(itemEntity[ITEM]);
      const textColor = isEquipment ? colors.black : colors.silver;
      const backgroundColor = isEquipment ? colors.silver : colors.black;

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
    if (!(stat && !material)) {
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

export const attemptEquipItem = (
  world: World,
  entity: Entity,
  itemEntity: Entity,
  delay = 0
) => {
  if (!entity[EQUIPPABLE]) return;

  for (const equipment of equipments) {
    if (
      itemEntity[ITEM].accessory !== equipment &&
      !itemEntity[ITEM][equipment as Gear]
    )
      continue;

    const checkedSlots = ["skill", "tool"].includes(equipment)
      ? ["skill", "tool"]
      : [equipment];
    const hasExisting = checkedSlots.some((slot) => entity[EQUIPPABLE][slot]);

    if (hasExisting) {
      if (!isNpc(world, entity)) {
        queueMessage(world, entity, {
          line: addBackground(
            [
              ...createText("Swap with ", colors.silver),
              ...createSpriteButton(
                [
                  ...createText("E", colors.black),
                  ...underline(createText("Q", colors.black), colors.black),
                  ...createText("UIP", colors.black),
                ],
                7,
                false,
                false,
                false,
                "yellow"
              ),
            ],
            colors.black
          ),
          orientation: "up",
          fast: false,
          delay,
        });
      }

      if (entity[PLAYER]) {
        assignQuickItem(world, entity, itemEntity[ITEM]);
      }

      return;
    }
  }

  return equipItem(world, entity, itemEntity, delay);
};

export const equipItem = (
  world: World,
  entity: Entity,
  itemEntity: Entity,
  delay = 0
) => {
  if (!entity[EQUIPPABLE]) return;
  const itemId = world.getEntityId(itemEntity);

  let unequippedId: number | undefined;
  for (const equipment of equipments) {
    if (
      itemEntity[ITEM].accessory !== equipment &&
      !itemEntity[ITEM][equipment as Gear]
    )
      continue;

    const existingId = entity[EQUIPPABLE][equipment];

    // add existing render count if item is replaced
    if (existingId) {
      if (!unequippedId) {
        unequippedId = existingId;
      }

      if (existingId !== itemId) {
        const existingItem = world.assertByIdAndComponents(existingId, [ITEM]);
        itemEntity[RENDERABLE].generation += getEntityGeneration(
          world,
          existingItem
        );

        unequipItem(world, entity, existingItem);
      }
    }

    entity[EQUIPPABLE][equipment] = itemId;

    // swap tool if needed
    if (equipment === "tool" && !entity[ACTIONABLE].toolEquipped) {
      entity[ACTIONABLE].toolEquipped = true;
    } else if (equipment === "skill" && entity[ACTIONABLE].toolEquipped) {
      entity[ACTIONABLE].toolEquipped = false;
    }
  }

  if (!isNpc(world, entity)) {
    if (unequippedId === itemId) {
      queueMessage(world, entity, {
        line: addBackground(
          [
            ...createItemName(itemEntity[ITEM]),
            ...createText(" already worn!", colors.silver),
          ],
          colors.black
        ),
        orientation: "up",
        fast: false,
        delay: 0,
      });
      return;
    } else {
      queueMessage(world, entity, {
        line: addBackground(
          [
            ...createText("Equipped ", colors.silver),
            ...createItemName(itemEntity[ITEM]),
          ],
          colors.black
        ),
        orientation: "up",
        fast: false,
        delay,
      });
    }
  }

  return world.getEntityByIdAndComponents(unequippedId, [ITEM]);
};

export const unequipItem = (
  world: World,
  entity: Entity,
  itemEntity: Entity
) => {
  if (!entity[EQUIPPABLE]) return;

  resetConditionables(world, entity, true);

  for (const slot of slots) {
    if (itemEntity[ITEM][slot]) {
      entity[EQUIPPABLE][
        slot === "accessory" ? itemEntity[ITEM].accessory! : slot
      ] = undefined;
    }
  }
};

export const addToInventory = (
  world: World,
  entity: Entity,
  itemEntity: Entity,
  amount: number
) => {
  const entityId = world.getEntityId(entity);
  let isEquipment = slots.some((slot) => itemEntity[ITEM][slot]);
  let targetStat = itemEntity[ITEM].stat;
  let targetMaterial = itemEntity[ITEM].material;
  let targetConsume = itemEntity[ITEM].consume;
  let targetStackable = itemEntity[ITEM].stackable;
  let targetItem = itemEntity;

  // if no sword is equipped, use wood as stick
  if (
    entity[MELEE] &&
    !entity[EQUIPPABLE].weapon &&
    targetStackable === "stick"
  ) {
    const itemData = {
      amount: 1,
      weapon: "sword",
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
  } else if (isEquipment) {
    attemptEquipItem(world, entity, itemEntity, 400);
    entity[INVENTORY].items.push(targetId);
  } else if (targetStat && !targetMaterial) {
    const maxStat = getMaxCounter(targetStat);
    const maximum =
      maxStat !== targetStat && maxStat
        ? entity[STATS][maxStat]
        : MAX_STAT_VALUE;
    const newAmount = entity[STATS][targetStat] + amount;
    const overflow = Math.max(newAmount, maximum) - maximum;
    const displayAmount = Math.ceil(amount - overflow);

    entity[STATS][targetStat] = clamp(newAmount, 0, maximum);

    if (
      entity[PLAYER] &&
      displayAmount <= 0 &&
      (targetStat === "hp" || targetStat === "mp") &&
      !targetMaterial
    ) {
      queueMessage(world, entity, {
        line: createText(
          displayAmount.toString(),
          displayAmount === 0
            ? colors.white
            : targetStat === "hp"
            ? colors.red
            : colors.blue
        ),
        orientation: "up",
        fast: false,
        delay: 0,
      });
    } else if (
      entity[PLAYER] &&
      ["hp", "mp", "maxHp", "maxMp"].includes(targetStat) &&
      !targetMaterial
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
      }
      if (collected && entity[BUMPABLE]) {
        entity[BUMPABLE].generation = entity[RENDERABLE].generation;
        entity[BUMPABLE].orientation = targetOrientation;
      }

      // mark as interacted
      entity[MOVABLE].pendingOrientation = undefined;
      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
