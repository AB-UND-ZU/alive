import { World } from "../ecs";
import { RENDERABLE } from "../components/renderable";
import { MOVABLE } from "../components/movable";
import { Orientation } from "../components/orientable";
import { PLAYER } from "../components/player";
import addPopup, { Deal, Popup, POPUP } from "../components/popup";
import { Entity } from "ecs";
import { TOOLTIP } from "../components/tooltip";
import { craft, shop } from "../../game/assets/sprites";
import { getCell } from "./map";
import { POSITION, Position } from "../components/position";
import { createSequence } from "./sequence";
import { PopupSequence } from "../components/sequencable";
import { REFERENCE } from "../components/reference";
import { VIEWABLE } from "../components/viewable";
import { STATS } from "../components/stats";
import { INVENTORY } from "../components/inventory";
import { EQUIPPABLE } from "../components/equippable";
import { ITEM } from "../components/item";
import { rerenderEntity } from "./renderer";
import { entities } from "..";
import { add } from "../../game/math/std";
import { TypedEntity } from "../entities";
import { isEnemy } from "./damage";
import { frameHeight } from "../../game/assets/utils";

export const isShopping = (world: World, entity: Entity) =>
  entity[PLAYER]?.shopping;

export const isShoppable = (world: World, entity: Entity) =>
  POPUP in entity && entity[POPUP].deals.length > 0 && !isEnemy(world, entity);

export const getShoppable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isShoppable(world, entity)
  ) as Entity | undefined;

export const getDeal = (world: World, shopEntity: Entity): Deal =>
  shopEntity[POPUP].deals[shopEntity[POPUP].verticalIndex];

export const canShop = (world: World, heroEntity: Entity, deal: Deal) =>
  deal.stock > 0 &&
  deal.price.every((activationItem) => {
    if (activationItem.stat) {
      // check if entity has sufficient of stat
      return heroEntity[STATS][activationItem.stat] >= activationItem.amount;
    } else {
      // or if item is contained in inventory or equipments
      const items = [
        ...heroEntity[INVENTORY].items,
        ...Object.values(heroEntity[EQUIPPABLE]).filter(Boolean),
      ];
      return items.some((itemId) => {
        const itemEntity = world.assertByIdAndComponents(itemId, [ITEM]);
        const matchesEquipment =
          activationItem.equipment &&
          itemEntity[ITEM].equipment === activationItem.equipment &&
          itemEntity[ITEM].material === activationItem.material &&
          itemEntity[ITEM].primary === activationItem.primary &&
          itemEntity[ITEM].secondary === activationItem.secondary;
        const matchesConsume =
          activationItem.consume &&
          itemEntity[ITEM].consume === activationItem.consume &&
          itemEntity[ITEM].material === activationItem.material;
        const matchesStackable =
          activationItem.stackable &&
          itemEntity[ITEM].stackable === activationItem.stackable &&
          itemEntity[ITEM].material === activationItem.material &&
          itemEntity[ITEM].amount >= activationItem.amount;
        return matchesEquipment || matchesConsume || matchesStackable;
      });
    }
  });

export const sellItems = (
  world: World,
  entity: Entity,
  deals: Popup["deals"],
  transaction: Popup["transaction"]
) => {
  entity[TOOLTIP].idle = transaction === "craft" ? craft : shop;
  entity[TOOLTIP].changed = true;

  const viewpointEntity = entities.createViewpoint(world, {
    [POSITION]: add(entity[POSITION], { x: 0, y: (frameHeight + 1) / -2 }),
    [RENDERABLE]: { generation: 0 },
    [VIEWABLE]: { active: false, priority: 90 },
  });

  addPopup(world, entity, {
    active: false,
    verticalIndex: 0,
    deals,
    viewpoint: world.getEntityId(viewpointEntity),
    transaction,
  });
};

export const removeShop = (world: World, entity: Entity) => {
  world.removeComponentFromEntity(entity as TypedEntity<"POPUP">, POPUP);
};

export const openShop = (
  world: World,
  heroEntity: Entity,
  shopEntity: Entity
) => {
  const shopId = world.getEntityId(shopEntity);
  heroEntity[PLAYER].shopping = shopId;
  shopEntity[POPUP].active = true;
  shopEntity[TOOLTIP].override = "hidden";
  shopEntity[TOOLTIP].changed = true;
  const viewpointEntity = world.assertByIdAndComponents(
    shopEntity[POPUP].viewpoint,
    [VIEWABLE]
  );
  viewpointEntity[VIEWABLE].active = true;
  rerenderEntity(world, shopEntity);

  createSequence<"popup", PopupSequence>(
    world,
    shopEntity,
    "popup",
    "displayShop",
    {
      verticalIndex: shopEntity[POPUP].verticalIndex,
      contentIndex: 0,
      transaction: shopEntity[POPUP].transaction,
    }
  );
};

export const closeShop = (
  world: World,
  heroEntity: Entity,
  shopEntity: Entity
) => {
  heroEntity[PLAYER].shopping = undefined;
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

export default function setupShop(world: World) {
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

    const shoppingEntity = world.getEntityByIdAndComponents(
      heroEntity?.[PLAYER].shopping,
      [POPUP]
    );

    // skip if player is not shopping or already interacted
    if (heroEntity[MOVABLE].lastInteraction === generation || !shoppingEntity)
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
    const currentIndex = shoppingEntity[POPUP].verticalIndex;
    const lastIndex = shoppingEntity[POPUP].deals.length - 1;
    shoppingEntity[POPUP].verticalIndex = Math.min(
      lastIndex,
      Math.max(0, currentIndex + (targetOrientation === "up" ? -1 : 1))
    );
  };

  return { onUpdate };
}
