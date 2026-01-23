import { World } from "../ecs";
import { RENDERABLE } from "../components/renderable";
import { MOVABLE } from "../components/movable";
import { Orientation } from "../components/orientable";
import { PLAYER } from "../components/player";
import addPopup, { Deal, Popup, POPUP, Target } from "../components/popup";
import { Entity } from "ecs";
import { TOOLTIP } from "../components/tooltip";
import {
  class_,
  craft,
  forge,
  info,
  mapDiscovery,
  none,
  quest,
  shop,
} from "../../game/assets/sprites";
import { getCell } from "./map";
import { POSITION, Position } from "../components/position";
import { createSequence, getSequence } from "./sequence";
import { DiscoverySequence, PopupSequence } from "../components/sequencable";
import { REFERENCE } from "../components/reference";
import { VIEWABLE } from "../components/viewable";
import { UnitStats, STATS } from "../components/stats";
import { Inventory, INVENTORY } from "../components/inventory";
import { Equipment } from "../components/equippable";
import { Item, ITEM } from "../components/item";
import { rerenderEntity } from "./renderer";
import { entities } from "..";
import { add } from "../../game/math/std";
import { TypedEntity } from "../entities";
import { isDead, isEnemy, isNeutral } from "./damage";
import { frameHeight, popupTime } from "../../game/assets/utils";
import { getItemSellPrice } from "../../game/balancing/trading";
import { getForgeStatus } from "../../game/balancing/forging";
import { getCraftingDeal } from "../../game/balancing/crafting";
import { getIdentifierAndComponents, setHighlight } from "../utils";
import { FOCUSABLE } from "../components/focusable";
import { TRACKABLE } from "../components/trackable";
import { displayedClasses, hairColors } from "../../game/assets/pixels";

export const isInPopup = (world: World, entity: Entity) =>
  entity[PLAYER]?.popup && !isDead(world, entity);

export const isInTab = (
  world: World,
  entity: Entity,
  tab: Popup["tabs"][number]
) => {
  if (!isInPopup(world, entity)) return false;

  const popupEntity = world.getEntityByIdAndComponents(entity[PLAYER]?.popup, [
    POPUP,
  ]);

  if (!popupEntity) return false;

  return getTab(world, popupEntity) === tab;
};

export const isPopupAvailable = (world: World, entity: Entity) =>
  POPUP in entity &&
  !isDead(world, entity) &&
  (!isEnemy(world, entity) || isNeutral(world, entity));

export const getPopup = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) =>
    isPopupAvailable(world, entity)
  ) as Entity | undefined;

export const getTab = (
  world: World,
  popupEntity: Entity
): Popup["tabs"][number] =>
  popupEntity[POPUP].tabs[popupEntity[POPUP].horizontalIndex];

export const getDiscoveryTab = (
  world: World,
  popupEntity: Entity
): Popup["tabs"][number] => popupEntity[POPUP].tabs.slice(-1)[0];

export const getVerticalIndex = (world: World, popupEntity: Entity): number =>
  popupEntity[POPUP].verticalIndezes[popupEntity[POPUP].horizontalIndex];

export const setVerticalIndex = (
  world: World,
  popupEntity: Entity,
  value: number
) => {
  popupEntity[POPUP].verticalIndezes[popupEntity[POPUP].horizontalIndex] =
    value;
  rerenderEntity(world, popupEntity);
};

export const getTabSelections = (world: World, popupEntity: Entity): number[] =>
  popupEntity[POPUP].selections[popupEntity[POPUP].horizontalIndex] || [];

export const pushTabSelection = (
  world: World,
  popupEntity: Entity,
  value?: number
) => {
  const verticalIndex = getVerticalIndex(world, popupEntity);
  popupEntity[POPUP].selections[popupEntity[POPUP].horizontalIndex].push(
    value ?? verticalIndex
  );
  rerenderEntity(world, popupEntity);
};

export const popTabSelection = (world: World, popupEntity: Entity) => {
  const value =
    popupEntity[POPUP].selections[popupEntity[POPUP].horizontalIndex].pop();
  rerenderEntity(world, popupEntity);
  return value;
};

export const getDeal = (
  world: World,
  entity: Entity,
  popupEntity: Entity
): Deal | undefined => {
  const tab = getTab(world, popupEntity);
  const verticalIndex = getVerticalIndex(world, popupEntity);
  const selections = getTabSelections(world, popupEntity);

  if (tab === "buy") {
    return popupEntity[POPUP].deals[getVerticalIndex(world, popupEntity)];
  } else if (tab === "sell") {
    const soldItem = world.getEntityByIdAndComponents(
      entity[INVENTORY].items[verticalIndex],
      [ITEM]
    );

    if (soldItem) {
      return {
        stock: 1,
        prices: [{ ...soldItem[ITEM], amount: 1 }],
        item: getItemSellPrice(soldItem[ITEM])[0],
      };
    }
  } else if (tab === "forge" && selections.length === 2) {
    const { baseItem, addItem, resultItem } = getForgeStatus(
      world,
      entity,
      selections[0],
      selections[1]
    );

    if (baseItem && addItem && resultItem) {
      return {
        stock: 1,
        prices: [baseItem, addItem],
        item: resultItem,
      };
    }
  } else if (tab === "craft" && selections.length === 1) {
    const recipe = popupEntity[POPUP].recipes[selections[0]];
    return getCraftingDeal(recipe, verticalIndex);
  } else if (tab === "quest") {
    return popupEntity[POPUP].deals[0];
  }
};

export const hasDefeated = (world: World, heroEntity: Entity, target: Target) =>
  (heroEntity[PLAYER].defeatedUnits[target.unit] || 0) >= target.amount;

export const canTrade = (
  world: World,
  heroEntity: Entity,
  shopEntity: Entity
) => {
  const deal = getDeal(world, heroEntity, shopEntity);

  if (!deal) return false;

  const tab = getTab(world, shopEntity);
  const selections = getTabSelections(world, shopEntity);

  if (tab === "buy") return canShop(world, heroEntity, deal);
  if (tab === "sell") return canSell(world, deal.prices[0]);
  if (tab === "forge")
    return selections.length === 2 && canShop(world, heroEntity, deal);
  if (tab === "craft")
    return selections.length === 1 && canShop(world, heroEntity, deal);
  if (tab === "quest") return isQuestCompleted(world, heroEntity, shopEntity);

  return false;
};

export const canShop = (world: World, heroEntity: Entity, deal: Deal) =>
  deal && deal.stock > 0 && canRedeem(world, heroEntity, deal);

export const canSell = (world: World, item: Omit<Item, "carrier" | "bound">) =>
  getItemSellPrice(item)[0].amount > 0;

export const matchesItem = (
  world: World,
  first: Omit<Item, "carrier" | "bound" | "amount">,
  second: Omit<Item, "carrier" | "bound" | "amount">
) =>
  first.consume === second.consume &&
  first.equipment === second.equipment &&
  first.material === second.material &&
  first.element === second.element &&
  first.primary === second.primary &&
  first.secondary === second.secondary &&
  first.stackable === second.stackable &&
  first.stat === second.stat;

export const missingFunds = (world: World, heroEntity: Entity, deal: Deal) =>
  deal.prices.filter((priceItem) => {
    if (priceItem.stat) {
      // check if entity has sufficient of stat
      return heroEntity[STATS][priceItem.stat] < priceItem.amount;
    }

    // or if item is contained in inventory
    return !(heroEntity[INVENTORY] as Inventory).items.some((itemId) => {
      const itemEntity = world.assertByIdAndComponents(itemId, [ITEM]);
      const found = matchesItem(world, itemEntity[ITEM], priceItem);
      return found && itemEntity[ITEM].amount >= priceItem.amount;
    });
  });

export const canRedeem = (world: World, heroEntity: Entity, deal: Deal) =>
  missingFunds(world, heroEntity, deal).length === 0;

export const canForge = (
  world: World,
  heroEntity: Entity,
  popupEntity: Entity
) => {
  const [firstIndex, secondIndex] = getTabSelections(world, popupEntity);
  const verticalIndex = getVerticalIndex(world, popupEntity);

  const { forgeable } = getForgeStatus(
    world,
    heroEntity,
    firstIndex,
    secondIndex,
    verticalIndex
  );
  return forgeable;
};

export const isQuestCompleted = (world: World, hero: Entity, entity: Entity) =>
  (entity[POPUP].tabs.includes("quest") &&
    entity[POPUP].deals.length === 0 &&
    entity[POPUP].choices.length === 0) ||
  (entity[POPUP].deals.every((deal: Deal) => canShop(world, hero, deal)) &&
    entity[POPUP].targets.every((target: Target) =>
      hasDefeated(world, hero, target)
    ));

export const popupIdles = {
  craft,
  forge,
  info,
  talk: info,
  quest,
  buy: shop,
  sell: shop,
  inspect: info,
  stats: info,
  warp: mapDiscovery,
  gear: info,
  class: class_,
  style: class_,
  map: mapDiscovery,
};

export const popupActions = {
  craft: "CRAFT",
  forge: "FORGE",
  info: "READ",
  talk: "TALK",
  warp: "WARP",
  quest: "QUEST",
  buy: "SHOP",
  sell: "SHOP",
  inspect: "BAG",
  map: "MAP",
  stats: "STATS",
  gear: "GEAR",
  class: "CLASS",
  style: "STYLE",
};

export const popupTitles = {
  ...popupActions,
  buy: "BUY",
  sell: "SELL",
  info: "TIP",
  talk: "INFO",
  class: "CLASS",
  style: "STYLE",
  warp: "LEVEL",
  map: "MAP",
};

export const visibleStats: (keyof UnitStats)[] = [
  "level",
  "maxHp",
  "maxMp",
  "power",
  "armor",
  "wisdom",
  "resist",
  "haste",
  "vision",
  "damp",
  "thaw",
  "spike",
];

export const gearSlots: Equipment[] = [
  "sword",
  "shield",
  "boots",
  "primary",
  "secondary",
  "map",
  "compass",
  "torch",
  "ring",
  "amulet",
];

export const mapScroll = 4;

export const createPopup = (
  world: World,
  entity: Entity,
  popup: Pick<Popup, "tabs"> & Partial<Popup>
) => {
  createSequence<"discovery", DiscoverySequence>(
    world,
    entity,
    "discovery",
    "discoveryIdle",
    {
      idle: popupIdles[getDiscoveryTab(world, { [POPUP]: popup })],
      hidden: false,
      timestamp: 0,
    }
  );

  const viewpointEntity = entities.createViewpoint(world, {
    [POSITION]: add(entity[POSITION], { x: 0, y: (frameHeight + 1) / -2 }),
    [RENDERABLE]: { generation: 0 },
    [VIEWABLE]: { active: false, priority: 90 },
  });
  const component = {
    active: false,
    verticalIndezes: Array.from({ length: popup.tabs.length }, () => 0),
    horizontalIndex: 0,
    selections: Array.from({ length: popup.tabs.length }, () => []),
    viewpoint: world.getEntityId(viewpointEntity),
    ...popup,
  };

  if (entity[POPUP]) {
    Object.assign(entity[POPUP], component);
  } else {
    addPopup(world, entity, {
      lines: [],
      deals: [],
      recipes: [],
      targets: [],
      objectives: [],
      choices: [],
      ...component,
    });
  }
};

export const removePopup = (world: World, entity: Entity) => {
  world.removeComponentFromEntity(entity as TypedEntity<"POPUP">, POPUP);
  const discovery = getSequence(world, entity, "discovery");
  if (discovery) {
    discovery.args.idle = none;
  }
};

export const openPopup = (
  world: World,
  heroEntity: Entity,
  popupEntity: Entity
) => {
  const popupId = world.getEntityId(popupEntity);
  const transaction = getDiscoveryTab(world, popupEntity);
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

  // mark sign as read
  const discovery = getSequence(world, popupEntity, "discovery");
  if ((transaction === "info" || transaction === "talk") && discovery) {
    discovery.args.idle = none;
  }

  createSequence<"popup", PopupSequence>(
    world,
    popupEntity,
    "popup",
    "displayPopup",
    {
      contentIndex: 0,
      contentHeight: 0,
      verticalIndex: 0,
      horizontalIndex: 0,
      transaction: getTab(world, popupEntity),
    }
  );

  // unmark highlight
  const focusEntity = getIdentifierAndComponents(world, "focus", [
    FOCUSABLE,
    TRACKABLE,
  ]);
  if (focusEntity?.[FOCUSABLE].target === popupId) {
    setHighlight(world);
  }
};

export const getActivePopup = (world: World, entity: Entity) =>
  isInPopup(world, entity)
    ? world.getEntityById(entity[PLAYER]?.popup)
    : undefined;

export const closePopup = (
  world: World,
  heroEntity: Entity,
  shopEntity: Entity
) => {
  heroEntity[PLAYER].popup = undefined;
  shopEntity[POPUP].active = false;
  shopEntity[POPUP].selections = Array.from(
    { length: shopEntity[POPUP].tabs.length },
    () => []
  );
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
    const heroEntity = world.getEntity([
      MOVABLE,
      PLAYER,
      RENDERABLE,
      INVENTORY,
    ]);

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

    // skip if player is not in popup
    if (!popupEntity) return;

    // capture movements while popup is open
    const targetOrientation: Orientation | undefined =
      heroEntity[MOVABLE].pendingOrientation ||
      heroEntity[MOVABLE].orientations[0];

    const transaction = getTab(world, popupEntity);

    // handle vertical movements
    const currentIndex = getVerticalIndex(world, popupEntity);
    const selections = getTabSelections(world, popupEntity);
    const inventoryItems = heroEntity[INVENTORY].items.length || 0;
    const lines =
      transaction === "inspect"
        ? popupEntity?.[INVENTORY]?.items.filter(
            (item) =>
              !world.assertByIdAndComponents(item, [ITEM])[ITEM].equipment
          ).length || 0
        : transaction === "stats"
        ? visibleStats.length
        : transaction === "gear"
        ? gearSlots.length
        : transaction === "map"
        ? mapScroll
        : transaction === "class"
        ? displayedClasses.length
        : transaction === "style"
        ? hairColors.length
        : transaction === "info" ||
          transaction === "warp" ||
          transaction === "talk"
        ? Math.max(
            0,
            popupEntity[POPUP].lines[popupEntity[POPUP].horizontalIndex]
              .length -
              (frameHeight - 2) +
              1
          )
        : transaction === "sell"
        ? inventoryItems
        : transaction === "forge"
        ? selections.length === 2
          ? 1
          : inventoryItems
        : transaction === "buy"
        ? popupEntity[POPUP].deals.length
        : transaction === "craft"
        ? selections.length === 1
          ? popupEntity[POPUP].recipes[selections[0]].options.length
          : popupEntity[POPUP].recipes.length
        : transaction === "quest"
        ? selections.length === 0
          ? Math.max(
              0,
              popupEntity[POPUP].lines[popupEntity[POPUP].horizontalIndex]
                .length +
                1 +
                (!popupEntity[POPUP].targets.length
                  ? 0
                  : popupEntity[POPUP].targets.length + 2) +
                (!popupEntity[POPUP].deals[0]?.prices.length
                  ? 0
                  : popupEntity[POPUP].deals[0].prices.length + 2) +
                (!popupEntity[POPUP].deals.length
                  ? 0
                  : popupEntity[POPUP].deals.length + 2) +
                (!popupEntity[POPUP].choices.length
                  ? 0
                  : popupEntity[POPUP].choices.length + 2) -
                (frameHeight - 2) +
                1
            )
          : selections.length === 1
          ? isQuestCompleted(world, heroEntity, popupEntity)
            ? popupEntity[POPUP].choices.length
            : popupEntity[POPUP].objectives.length
          : 0
        : 0;
    const lastIndex = lines - 1;
    popupEntity[POPUP].verticalIndezes[popupEntity[POPUP].horizontalIndex] =
      Math.max(
        0,
        Math.min(
          lastIndex,
          currentIndex +
            (targetOrientation === "up"
              ? -1
              : targetOrientation === "down"
              ? 1
              : 0)
        )
      );

    // handle horizontal movements
    const previousIndex = popupEntity[POPUP].horizontalIndex;
    popupEntity[POPUP].horizontalIndex = Math.max(
      0,
      Math.min(
        popupEntity[POPUP].tabs.length - 1,
        previousIndex +
          (targetOrientation === "left"
            ? -1
            : targetOrientation === "right"
            ? 1
            : 0)
      )
    );

    const popupSequence = getSequence(world, popupEntity, "popup");
    if (popupEntity[POPUP].horizontalIndex !== previousIndex && popupSequence) {
      popupSequence.elapsed = popupTime;
      popupSequence.args.contentIndex = 0;
      rerenderEntity(world, popupEntity);
    }

    // skip if player has already interacted or not going to
    if (
      heroEntity[MOVABLE].lastInteraction === generation ||
      !targetOrientation
    )
      return;

    // mark as interacted
    heroEntity[MOVABLE].pendingOrientation = undefined;
    heroEntity[MOVABLE].lastInteraction = generation;

    rerenderEntity(world, popupEntity);
  };

  return { onUpdate };
}
