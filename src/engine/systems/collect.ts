import { bumpEntity } from "../motion";
import { requireComponent, hasComponent, TypedEntity } from "../entities";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add, clamp } from "../../game/math/std";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { disposeEntity, getCellEntities, updateWalkable } from "./map";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";
import { LOOTABLE } from "../components/lootable";
import { equipments, EQUIPPABLE, Gear, slots } from "../components/equippable";
import { checkUnlocks } from "../../game/unlocks";
import { INVENTORY } from "../components/inventory";
import { Item, ITEM } from "../components/item";
import { getEntityGeneration, rerenderEntity } from "./renderer";
import { resetConditionables, removeFromInventory, spendItem } from "./trigger";
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

export const isLootable = (world: World, entity: TypedEntity) =>
  hasComponent(entity, LOOTABLE) &&
  hasComponent(entity, INVENTORY) &&
  entity[INVENTORY].items.length > 0;

export const getLootable = (world: World, position: Position) =>
  getCellEntities(world, position).find((entity) =>
    isLootable(world, entity)
  ) as TypedEntity<"POSITION" | "INVENTORY" | "LOOTABLE"> | undefined;

export const isCollecting = (world: World, entity: TypedEntity) =>
  hasComponent(entity, LOOTABLE) &&
  hasComponent(entity, INVENTORY) &&
  getSequence(world, entity, "collect");

export const getCollecting = (world: World, position: Position) =>
  getCellEntities(world, position).find((entity) =>
    isCollecting(world, entity)
  ) as TypedEntity<"POSITION" | "INVENTORY" | "LOOTABLE"> | undefined;

export const getStackable = (world: World, entity: TypedEntity, item: Item) => {
  const stackId = requireComponent(entity, INVENTORY).items.find((itemId: number) => {
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

export const chickenFeed = (world: World, bird: TypedEntity) =>
  (bird[INVENTORY]?.items ?? [])
    .map((id) => world.assertByIdAndComponents(id, [ITEM]))
    .filter(({ ITEM }) => ITEM.stackable === "grain" || ITEM.stackable === "worm");

export const consumeChickenFeed = (world: World, bird: TypedEntity) => {
  const feed = chickenFeed(world, bird);
  for (const item of feed) spendItem(world, bird, item[ITEM], item);
  return feed.length > 0;
};

export const isEmpty = (world: World, entity: TypedEntity) =>
  hasComponent(entity, INVENTORY) &&
  hasComponent(entity, LOOTABLE) &&
  entity[INVENTORY].items.length === 0 &&
  !isCollecting(world, entity);

export const collectItem = (
  world: World,
  entity: TypedEntity,
  target: TypedEntity,
  orientation?: Orientation
) => {
  // handle pick up
  for (
    let itemIndex = requireComponent(target, INVENTORY).items.length - 1;
    itemIndex >= 0;
    itemIndex -= 1
  ) {
    const itemId = requireComponent(target, INVENTORY).items[itemIndex];
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
    const position = requireComponent(target, POSITION);
    createSequence<"collect", CollectSequence>(
      world,
      entity,
      "collect",
      "itemCollect",
      { origin: position, itemId, drop: false, amount: collectAmount }
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
      play(world, entity, "pickup", { ...options });
    }

    // update walkable
    updateWalkable(world, position);

    rerenderEntity(world, target);
    return true;
  }

  return false;
};

export const attemptEquipItem = (
  world: World,
  entity: TypedEntity,
  itemEntity: TypedEntity<"ITEM">,
  delay = 0
) => {
  if (!entity[EQUIPPABLE]) return;

  for (const equipment of equipments) {
    if (
      itemEntity[ITEM].accessory !== equipment &&
      !itemEntity[ITEM][equipment as Gear]
    )
      continue;

    const checkedSlots: typeof equipments = ["skill", "tool"].includes(equipment)
      ? ["skill", "tool"]
      : [equipment];
    const hasExisting = checkedSlots.some((slot) => requireComponent(entity, EQUIPPABLE)[slot]);

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
  entity: TypedEntity,
  itemEntity: TypedEntity<"ITEM">,
  delay = 0
) => {
  if (!entity[EQUIPPABLE]) return;
  const itemId = world.getEntityId(itemEntity);

  let unequippedId: number | undefined;
  let inactiveId: number | undefined;
  let changed = false;
  for (const equipment of equipments) {
    if (
      itemEntity[ITEM].accessory !== equipment &&
      !itemEntity[ITEM][equipment as Gear]
    )
      continue;

    const existingId = entity[EQUIPPABLE][equipment];

    if (existingId !== itemId) {
      changed = true;
      if (existingId) {
        unequippedId ??= existingId;
        const existingItem = world.assertByIdAndComponents(existingId, [ITEM]);
        requireComponent(itemEntity, RENDERABLE).generation += getEntityGeneration(
          world,
          existingItem
        );
        unequipItem(world, entity, existingItem);
      }
      entity[EQUIPPABLE][equipment] = itemId;
    }

    // swap tool if needed
    if (equipment === "tool" && !requireComponent(entity, ACTIONABLE).toolEquipped) {
      requireComponent(entity, ACTIONABLE).toolEquipped = true;
      inactiveId = entity[EQUIPPABLE].skill;
      changed = true;
    } else if (equipment === "skill" && requireComponent(entity, ACTIONABLE).toolEquipped) {
      requireComponent(entity, ACTIONABLE).toolEquipped = false;
      inactiveId = entity[EQUIPPABLE].tool;
      changed = true;
    }
  }

  if (!isNpc(world, entity)) {
    if (!changed) {
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
      play(world, undefined, "equip", { notes: 4, spacing: 45, delay });
      queueMessage(world, entity, {
        line: [
          ...createText("Equipped:", colors.black, colors.yellow),
          ...addBackground(
            [...createText(" "), ...createItemName(itemEntity[ITEM])],
            colors.black
          ),
        ],
        orientation: "up",
        fast: false,
        delay,
      });
    }
  }

  const inactive = world.getEntityByIdAndComponents(inactiveId, [ITEM]);
  if (inactive && entity[PLAYER]) assignQuickItem(world, entity, inactive[ITEM]);
  return inactive ?? world.getEntityByIdAndComponents(unequippedId, [ITEM]);
};

export const unequipItem = (
  world: World,
  entity: TypedEntity,
  itemEntity: TypedEntity<"ITEM">
) => {
  if (!entity[EQUIPPABLE]) return;

  const itemId = world.getEntityId(itemEntity);
  if (!Object.values(entity[EQUIPPABLE]).includes(itemId)) return;
  if (entity[PLAYER]) assignQuickItem(world, entity, itemEntity[ITEM]);
  resetConditionables(world, entity, true);

  for (const slot of equipments) {
    if (entity[EQUIPPABLE][slot] === itemId) entity[EQUIPPABLE][slot] = undefined;
  }
};

export const addToInventory = (
  world: World,
  entity: TypedEntity,
  itemEntity: TypedEntity<"ITEM">,
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
    !requireComponent(entity, EQUIPPABLE).weapon &&
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
    requireComponent(entity, INVENTORY).items.push(targetId);
  } else if (targetStat && !targetMaterial) {
    const maxStat = getMaxCounter(targetStat);
    const maximum =
      maxStat !== targetStat && maxStat
        ? requireComponent(entity, STATS)[maxStat]
        : MAX_STAT_VALUE;
    const stats = requireComponent(entity, STATS);
    const newAmount = stats[targetStat] + amount;
    const overflow = Math.max(newAmount, maximum) - maximum;
    const displayAmount = Math.ceil(amount - overflow);

    stats[targetStat] = clamp(newAmount, 0, maximum);

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
      (targetStat === "hp" || targetStat === "mp" || targetStat === "maxHp" || targetStat === "maxMp") &&
      !targetMaterial
    ) {
      entity[PLAYER].receivedStats[targetStat] += displayAmount;
    }
  } else if (
    (targetStackable === "grain" || targetStackable === "worm") &&
    (entity.NPC?.type === "hen" || entity.NPC?.type === "rooster") &&
    entity[STATS] && (entity[STATS].hp < entity[STATS].maxHp || entity.BELONGABLE?.faction === "hostile")
  ) {
    consumeChickenFeed(world, entity);
    entity[STATS].hp = entity[STATS].maxHp;
    if (entity.BELONGABLE) entity.BELONGABLE.faction = "animal";
    rerenderEntity(world, entity);
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
      requireComponent(entity, INVENTORY).items.push(stackId);
    }

    if (itemEntity[IDENTIFIABLE]) {
      setIdentifier(world, targetStack, itemEntity[IDENTIFIABLE].name);
    }
    if (targetStackable === "gem" && entity[PLAYER]) checkUnlocks(world);
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

    // handle units collecting items
    for (const entity of world.getEntities([
      POSITION,
      COLLECTABLE,
      MOVABLE,
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
        bumpEntity(world, entity, targetOrientation);
      }

      // mark as interacted
      entity[MOVABLE].pendingOrientation = undefined;
      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
