import { World } from "../ecs";
import { RENDERABLE } from "../components/renderable";
import { MOVABLE } from "../components/movable";
import { Orientation } from "../components/orientable";
import { PLAYER } from "../components/player";
import addPopup, {
  Deal,
  Popup,
  POPUP,
  shops,
  Target,
} from "../components/popup";
import { Entity } from "ecs";
import { TOOLTIP } from "../components/tooltip";
import { craft, info, quest, shop } from "../../game/assets/sprites";
import { getCell } from "./map";
import { POSITION, Position } from "../components/position";
import { createSequence } from "./sequence";
import { InfoSequence, PopupSequence } from "../components/sequencable";
import { REFERENCE } from "../components/reference";
import { VIEWABLE } from "../components/viewable";
import { STATS } from "../components/stats";
import { INVENTORY } from "../components/inventory";
import { EQUIPPABLE } from "../components/equippable";
import { Item, ITEM } from "../components/item";
import { rerenderEntity } from "./renderer";
import { entities } from "..";
import { add } from "../../game/math/std";
import { TypedEntity } from "../entities";
import { isDead, isEnemy, isNeutral } from "./damage";
import { frameHeight } from "../../game/assets/utils";

export const isInPopup = (world: World, entity: Entity) =>
  entity[PLAYER]?.popup && !isDead(world, entity);

export const isInShop = (world: World, entity: Entity) =>
  isInPopup(world, entity) &&
  ["buy", "sell", "craft"].includes(
    world.getEntityByIdAndComponents(entity[PLAYER]?.popup, [POPUP])?.[POPUP]
      .transaction || ""
  );

export const isInQuest = (world: World, entity: Entity) =>
  isInPopup(world, entity) &&
  world.getEntityByIdAndComponents(entity[PLAYER]?.popup, [POPUP])?.[POPUP]
    .transaction === "quest";

export const isInInspect = (world: World, entity: Entity) =>
  isInPopup(world, entity) &&
  world.getEntityByIdAndComponents(entity[PLAYER]?.popup, [POPUP])?.[POPUP]
    .transaction === "inspect";

export const isInInfo = (world: World, entity: Entity) =>
  isInPopup(world, entity) &&
  world.getEntityByIdAndComponents(entity[PLAYER]?.popup, [POPUP])?.[POPUP]
    .transaction === "info";

export const isPopupAvailable = (world: World, entity: Entity) =>
  POPUP in entity &&
  !isDead(world, entity) &&
  ((shops.includes(entity[POPUP].transaction) &&
    entity[POPUP].deals.length > 0) ||
    entity[POPUP].lines.length > 0) &&
  (!isEnemy(world, entity) || isNeutral(world, entity));

export const getPopup = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isPopupAvailable(world, entity)
  ) as Entity | undefined;

export const getDeal = (world: World, shopEntity: Entity): Deal =>
  shopEntity[POPUP].deals[shopEntity[POPUP].verticalIndex];

export const hasDefeated = (world: World, heroEntity: Entity, target: Target) =>
  (heroEntity[PLAYER].defeatedUnits[target.unit] || 0) >= target.amount;

export const canShop = (world: World, heroEntity: Entity, deal: Deal) =>
  deal.stock > 0 && canRedeem(world, heroEntity, deal);

export const matchesItem = (
  world: World,
  first: Omit<Item, "carrier" | "bound">,
  second: Omit<Item, "carrier" | "bound">
) =>
  first.consume === second.consume &&
  first.equipment === second.equipment &&
  first.material === second.material &&
  first.passive === second.passive &&
  first.primary === second.primary &&
  first.secondary === second.secondary &&
  first.stackable === second.stackable &&
  first.stat === second.stat;

export const missingFunds = (world: World, heroEntity: Entity, deal: Deal) =>
  deal.price.filter((activationItem) => {
    if (activationItem.stat) {
      // check if entity has sufficient of stat
      return heroEntity[STATS][activationItem.stat] < activationItem.amount;
    } else {
      // or if item is contained in inventory or equipments
      const items = [
        ...heroEntity[INVENTORY].items,
        ...Object.values(heroEntity[EQUIPPABLE]).filter(Boolean),
      ];
      return !items.some((itemId) => {
        const itemEntity = world.assertByIdAndComponents(itemId, [ITEM]);
        return matchesItem(world, itemEntity[ITEM], activationItem);
      });
    }
  });

export const canRedeem = (world: World, heroEntity: Entity, deal: Deal) =>
  missingFunds(world, heroEntity, deal).length === 0;

export const isQuestCompleted = (world: World, hero: Entity, entity: Entity) =>
  entity[POPUP].deals.every((deal: Deal) => canShop(world, hero, deal)) &&
  entity[POPUP].targets.every((target: Target) =>
    hasDefeated(world, hero, target)
  );

export const popupIdles = {
  craft,
  info,
  quest,
  buy: shop,
  sell: shop,
  inspect: info,
  warp: undefined,
};

export const popupActions = {
  craft: "CRAFT",
  info: "READ",
  warp: "WARP",
  quest: "QUEST",
  buy: "SHOP",
  sell: "SHOP",
  inspect: "BAG",
};

export const createPopup = (
  world: World,
  entity: Entity,
  popup: Pick<Popup, "transaction"> & Partial<Popup>
) => {
  entity[TOOLTIP].idle = popupIdles[popup.transaction];
  entity[TOOLTIP].changed = true;

  const viewpointEntity = entities.createViewpoint(world, {
    [POSITION]: add(entity[POSITION], { x: 0, y: (frameHeight + 1) / -2 }),
    [RENDERABLE]: { generation: 0 },
    [VIEWABLE]: { active: false, priority: 90 },
  });
  const component = {
    active: false,
    verticalIndex: 0,
    viewpoint: world.getEntityId(viewpointEntity),
    ...popup,
  };

  if (entity[POPUP]) {
    Object.assign(entity[POPUP], component);
  } else {
    addPopup(world, entity, {
      lines: [],
      deals: [],
      targets: [],
      ...component,
    });
  }
};

export const removePopup = (world: World, entity: Entity) => {
  world.removeComponentFromEntity(entity as TypedEntity<"POPUP">, POPUP);
};

export const openPopup = (
  world: World,
  heroEntity: Entity,
  popupEntity: Entity
) => {
  const popupId = world.getEntityId(popupEntity);
  heroEntity[PLAYER].popup = popupId;
  popupEntity[POPUP].active = true;
  popupEntity[TOOLTIP].override = "hidden";
  popupEntity[TOOLTIP].changed = true;
  const viewpointEntity = world.assertByIdAndComponents(
    popupEntity[POPUP].viewpoint,
    [VIEWABLE]
  );
  viewpointEntity[VIEWABLE].active = true;
  rerenderEntity(world, popupEntity);

  if (shops.includes(popupEntity[POPUP].transaction)) {
    createSequence<"popup", PopupSequence>(
      world,
      popupEntity,
      "popup",
      "displayShop",
      {
        verticalIndex: popupEntity[POPUP].verticalIndex,
        contentIndex: 0,
        transaction: popupEntity[POPUP].transaction,
        title: popupEntity[POPUP].transaction,
      }
    );
  } else if (popupEntity[POPUP].transaction === "quest") {
    createSequence<"popup", InfoSequence>(
      world,
      popupEntity,
      "popup",
      "displayQuest",
      {
        contentIndex: 0,
        title: popupEntity[POPUP].transaction,
      }
    );
  } else if (popupEntity[POPUP].transaction === "inspect") {
    createSequence<"popup", InfoSequence>(
      world,
      popupEntity,
      "popup",
      "displayInspect",
      {
        contentIndex: 0,
        title: "Bag",
      }
    );
  } else {
    createSequence<"popup", InfoSequence>(
      world,
      popupEntity,
      "popup",
      "displayInfo",
      {
        contentIndex: 0,
        title: popupEntity[POPUP].transaction,
      }
    );
  }
};

export const closePopup = (
  world: World,
  heroEntity: Entity,
  shopEntity: Entity
) => {
  heroEntity[PLAYER].popup = undefined;
  shopEntity[POPUP].active = false;
  shopEntity[TOOLTIP].override = undefined;
  shopEntity[TOOLTIP].changed = true;
  const viewpointEntity = world.assertByIdAndComponents(
    shopEntity[POPUP].viewpoint,
    [VIEWABLE]
  );
  viewpointEntity[VIEWABLE].active = false;
  rerenderEntity(world, shopEntity);
};

export default function setupPopup(world: World) {
  let heroGeneration = -1;

  const onUpdate = (delta: number) => {
    const heroEntity = world.getEntity([MOVABLE, PLAYER, RENDERABLE]);

    if (!heroEntity) return;

    const heroReference = world.assertByIdAndComponents(
      heroEntity[MOVABLE].reference,
      [RENDERABLE, REFERENCE]
    );
    const generation = heroReference[RENDERABLE].generation;

    if (heroGeneration === generation) return;

    heroGeneration = generation;

    const popupEntity = world.getEntityByIdAndComponents(
      heroEntity?.[PLAYER].popup,
      [POPUP]
    );

    // skip if player is not shopping or already interacted
    if (heroEntity[MOVABLE].lastInteraction === generation || !popupEntity)
      return;

    // capture movements while shop is open
    const targetOrientation: Orientation | null =
      heroEntity[MOVABLE].pendingOrientation ||
      heroEntity[MOVABLE].orientations[0];

    // mark as interacted
    heroEntity[MOVABLE].pendingOrientation = undefined;
    heroEntity[MOVABLE].lastInteraction = generation;

    // ignore when moving to sides
    if (targetOrientation !== "up" && targetOrientation !== "down") return;

    // move selected index
    const currentIndex = popupEntity[POPUP].verticalIndex;
    const lines =
      popupEntity[POPUP].transaction === "inspect"
        ? popupEntity[INVENTORY]?.items.length || 0
        : popupEntity[POPUP].deals.length;
    const lastIndex = lines - 1;
    popupEntity[POPUP].verticalIndex = Math.min(
      lastIndex,
      Math.max(0, currentIndex + (targetOrientation === "up" ? -1 : 1))
    );
    rerenderEntity(world, popupEntity);
  };

  return { onUpdate };
}
