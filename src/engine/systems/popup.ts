import { World } from "../ecs";
import { RENDERABLE } from "../components/renderable";
import { MOVABLE } from "../components/movable";
import { Orientation } from "../components/orientable";
import { PLAYER } from "../components/player";
import addPopup, { Deal, Popup, POPUP, Target } from "../components/popup";
import { Entity } from "ecs";
import { TOOLTIP } from "../components/tooltip";
import {
  addBackground,
  craft,
  createText,
  forge,
  info,
  mapDiscovery,
  none,
  quest,
  shop,
} from "../../game/assets/sprites";
import { disposeEntity, getCell } from "./map";
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
import { add, normalize } from "../../game/math/std";
import { TypedEntity } from "../entities";
import { isDead, isEnemy, isNeutral } from "./damage";
import {
  createItemName,
  frameHeight,
  popupTime,
  questSequence,
  queueMessage,
} from "../../game/assets/utils";
import { getItemSellPrice } from "../../game/balancing/trading";
import { getForgeStatus } from "../../game/balancing/forging";
import { getCraftingDeal } from "../../game/balancing/crafting";
import { getIdentifierAndComponents, setHighlight, TEST_MODE } from "../utils";
import { FOCUSABLE } from "../components/focusable";
import { TRACKABLE } from "../components/trackable";
import { displayedClasses, hairColors } from "../../game/assets/pixels";
import { ACTIONABLE } from "../components/actionable";
import { canWarp, completeQuest, initiateWarp, performTrade } from "./trigger";
import { colors } from "../../game/assets/colors";
import { consumeItem, getConsumption } from "./consume";
import { clamp } from "three/src/math/MathUtils";
import { getSelectedLevel } from "../../game/levels";
import { LEVEL } from "../components/level";

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
    return popupEntity[POPUP].deals[verticalIndex];
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
    return popupEntity[POPUP].deals[verticalIndex];
  }
};

export const getDefeated = (world: World, heroEntity: Entity, target: Target) =>
  heroEntity[PLAYER].defeatedUnits[target.unit] || 0;

export const hasDefeated = (world: World, heroEntity: Entity, target: Target) =>
  getDefeated(world, heroEntity, target) >= target.amount;

export const canTrade = (
  world: World,
  heroEntity: Entity,
  shopEntity: Entity
) => {
  const tab = getTab(world, shopEntity);

  if (tab === "quest") return isQuestCompleted(world, heroEntity, shopEntity);

  const deal = getDeal(world, heroEntity, shopEntity);

  if (!deal) return false;

  const selections = getTabSelections(world, shopEntity);

  if (tab === "buy") return canShop(world, heroEntity, deal);
  if (tab === "sell") return canSell(world, deal.prices[0]);
  if (tab === "forge")
    return selections.length === 2 && canShop(world, heroEntity, deal);
  if (tab === "craft")
    return selections.length === 1 && canShop(world, heroEntity, deal);

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

export const existingFund = (
  world: World,
  heroEntity: Entity,
  price: Deal["prices"][number]
) =>
  (heroEntity[INVENTORY] as Inventory).items
    .map((itemId) => world.assertByIdAndComponents(itemId, [ITEM]))
    .find((item) => matchesItem(world, item[ITEM], price))?.[ITEM].amount || 0;

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
  entity[POPUP].tabs.includes("quest") &&
  ((entity[POPUP].targets.length === 0 &&
    entity[POPUP].deals.length === 0 &&
    entity[POPUP].choices.length === 0) ||
    (entity[POPUP].deals.every((deal: Deal) => canShop(world, hero, deal)) &&
      entity[POPUP].targets.every((target: Target) =>
        hasDefeated(world, hero, target)
      )));

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
  class: mapDiscovery,
  style: mapDiscovery,
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
      focuses: [],
      choices: [],
      ...component,
    });
  }
};

export const removePopup = (world: World, entity: Entity) => {
  // close active popup
  const entityId = world.getEntityId(entity);
  const heroEntity = getIdentifierAndComponents(world, "hero", [PLAYER]);
  if (heroEntity && heroEntity[PLAYER].popup === entityId) {
    closePopup(world, heroEntity, entity);
  }

  // remove viewpoint
  const viewpointEntity = world.assertByIdAndComponents(
    entity[POPUP].viewpoint,
    [VIEWABLE]
  );
  disposeEntity(world, viewpointEntity);

  // remove popup
  world.removeComponentFromEntity(entity as TypedEntity<"POPUP">, POPUP, false);
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

  // reset pending movements
  heroEntity[MOVABLE].orientations = [];
  heroEntity[MOVABLE].pendingOrientation = undefined;

  if (popupEntity[TOOLTIP]) {
    popupEntity[TOOLTIP].override = "hidden";
    popupEntity[TOOLTIP].changed = true;
  }

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
      contentClickable: false,
      detailsPadding: 0,
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
  popupEntity: Entity
) => {
  const tab = getTab(world, popupEntity);
  const selections = getTabSelections(world, popupEntity);

  heroEntity[PLAYER].popup = undefined;
  popupEntity[POPUP].active = false;
  popupEntity[POPUP].selections = Array.from(
    { length: popupEntity[POPUP].tabs.length },
    () => []
  );

  if (popupEntity[TOOLTIP]) {
    popupEntity[TOOLTIP].override = undefined;
    popupEntity[TOOLTIP].changed = true;
  }

  const viewpointEntity = world.assertByIdAndComponents(
    popupEntity[POPUP].viewpoint,
    [VIEWABLE]
  );
  viewpointEntity[VIEWABLE].active = false;
  rerenderEntity(world, popupEntity);

  // clear quest after closing completed screen
  if (
    tab === "quest" &&
    isQuestCompleted(world, heroEntity, popupEntity) &&
    selections.length === 2
  ) {
    removePopup(world, popupEntity);
  }
};

export default function setupPopup(world: World) {
  let heroGeneration = -1;

  const onUpdate = (delta: number) => {
    const heroEntity = world.getEntity([
      ACTIONABLE,
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
      heroEntity[PLAYER].popup,
      [POPUP]
    );

    // skip if player is not in popup
    if (!popupEntity) return;

    // capture movements while popup is open
    const targetOrientation: Orientation | undefined =
      heroEntity[MOVABLE].pendingOrientation ||
      heroEntity[MOVABLE].orientations[0];

    // skip if player has already interacted or not going to
    if (
      heroEntity[MOVABLE].lastInteraction === generation ||
      (!targetOrientation && !heroEntity[PLAYER].actionTriggered)
    )
      return;

    const inventoryItems = (heroEntity[INVENTORY]?.items || []).map((itemId) =>
      world.assertByIdAndComponents(itemId, [ITEM])
    );
    const inspectItems = inventoryItems.filter((item) => !item[ITEM].equipment);

    const transaction = getTab(world, popupEntity);
    const tradeEntity = world.getEntityByIdAndComponents(
      heroEntity[ACTIONABLE].trade,
      [TOOLTIP, POPUP, POSITION]
    );
    const useEntity = world.getEntityByIdAndComponents(
      heroEntity[ACTIONABLE].use,
      [TOOLTIP, POPUP, POSITION]
    );
    const addEntity = world.getEntityByIdAndComponents(
      heroEntity[ACTIONABLE].add,
      [TOOLTIP, POPUP, POSITION]
    );
    const warpEntity = world.getEntityByIdAndComponents(
      heroEntity[ACTIONABLE].warp,
      [POSITION, TOOLTIP]
    );

    const selections = getTabSelections(world, popupEntity);
    const popupSequence = getSequence(world, popupEntity, "popup");

    // handle vertical movements
    const lines =
      transaction === "inspect"
        ? inspectItems.length
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
        ? inventoryItems.length
        : transaction === "forge"
        ? selections.length === 2
          ? 1
          : inventoryItems.length
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
          : selections.length === 1 &&
            isQuestCompleted(world, heroEntity, popupEntity)
          ? popupEntity[POPUP].choices.length
          : 0
        : 0;

    const previousIndex = getVerticalIndex(world, popupEntity);
    if (
      targetOrientation === "up" ||
      targetOrientation === "down" ||
      heroEntity[PLAYER].actionTriggered === "up" ||
      heroEntity[PLAYER].actionTriggered === "down"
    ) {
      const targetScroll =
        targetOrientation || heroEntity[PLAYER].actionTriggered;
      setVerticalIndex(
        world,
        popupEntity,
        previousIndex +
          (targetScroll === "up" ? -1 : targetScroll === "down" ? 1 : 0)
      );

      if (
        heroEntity[PLAYER].actionTriggered === "up" ||
        heroEntity[PLAYER].actionTriggered === "down"
      ) {
        heroEntity[PLAYER].actionTriggered = undefined;
      }
    } else if (heroEntity[PLAYER].actionTriggered === "content") {
      const contentIndex = heroEntity[PLAYER].contentTriggered;

      heroEntity[PLAYER].actionTriggered = undefined;
      heroEntity[PLAYER].contentTriggered = undefined;

      const scrollIndex = popupSequence?.args.scrollIndex;
      const detailsPadding = popupSequence?.args.detailsPadding || 0;
      const contentClickable = popupSequence?.args.contentClickable;

      if (
        contentClickable &&
        contentIndex !== undefined &&
        scrollIndex !== undefined &&
        contentIndex < frameHeight - 2 - detailsPadding
      ) {
        // treat clicking active row like confirming
        const newIndex = contentIndex + scrollIndex;
        if (newIndex === previousIndex) {
          heroEntity[PLAYER].actionTriggered = "right";
        } else {
          setVerticalIndex(world, popupEntity, newIndex);
        }
      }
    }

    // ensure index is in bounds
    const currentIndex = getVerticalIndex(world, popupEntity);
    const boundIndex = clamp(currentIndex, 0, lines > 0 ? lines - 1 : 0);

    if (currentIndex !== boundIndex) {
      setVerticalIndex(world, popupEntity, boundIndex);
    }

    // handle actions
    if (heroEntity[PLAYER].actionTriggered === "close") {
      // close popup
      heroEntity[PLAYER].actionTriggered = undefined;
      if (popupSequence) {
        closePopup(world, heroEntity, popupEntity);
      }
    } else if (
      heroEntity[PLAYER].actionTriggered === "tab" ||
      heroEntity[PLAYER].actionTriggered === "backtab"
    ) {
      // handle tab changes
      const previousIndex = popupEntity[POPUP].horizontalIndex;
      popupEntity[POPUP].horizontalIndex = normalize(
        heroEntity[PLAYER].tabTriggered ??
          previousIndex +
            (heroEntity[PLAYER].actionTriggered === "tab" ? 1 : -1),
        popupEntity[POPUP].tabs.length
      );
      heroEntity[PLAYER].actionTriggered = undefined;
      heroEntity[PLAYER].tabTriggered = undefined;

      // rerender on tab changes
      if (
        popupEntity[POPUP].horizontalIndex !== previousIndex &&
        popupSequence
      ) {
        popupSequence.elapsed = popupTime;
        popupSequence.args.contentIndex = 0;
        rerenderEntity(world, popupEntity);
      }
    } else if (heroEntity[PLAYER].actionTriggered === "right") {
      heroEntity[PLAYER].actionTriggered = undefined;

      const verticalIndex = getVerticalIndex(world, popupEntity);
      const tab = getTab(world, popupEntity);

      if (tab === "quest") {
        if (tradeEntity && isQuestCompleted(world, heroEntity, tradeEntity)) {
          pushTabSelection(world, tradeEntity);
          completeQuest(world, heroEntity, tradeEntity);

          // advance to completed screen
          if (selections.length === 1) pushTabSelection(world, tradeEntity);
        } else if (addEntity) {
          const focus =
            addEntity[POPUP].focuses[addEntity[POPUP].horizontalIndex];
          if (
            !isQuestCompleted(world, heroEntity, addEntity) &&
            focus &&
            selections.length === 0
          ) {
            // set focus
            questSequence(world, heroEntity, "waypointQuest", {
              ...focus,
              distance: 2,
            });

            closePopup(world, heroEntity, addEntity);
          } else {
            // proceed to choices screen
            pushTabSelection(world, addEntity);
            setVerticalIndex(world, addEntity, 0);
          }
        } else if (!isQuestCompleted(world, heroEntity, popupEntity)) {
          queueMessage(world, heroEntity, {
            line: createText("Not completed!", colors.silver, colors.black),
            orientation: "up",
            fast: false,
            delay: 0,
          });
        }
      } else if (tab === "buy") {
        const deal = tradeEntity && getDeal(world, heroEntity, tradeEntity);
        if (deal) {
          const missingItem = missingFunds(world, heroEntity, deal)[0];

          if (canShop(world, heroEntity, deal)) {
            performTrade(world, heroEntity, tradeEntity);
          } else if (deal.stock === 0) {
            queueMessage(world, heroEntity, {
              line: createText("Sold out!", colors.silver, colors.black),
              orientation: "up",
              fast: false,
              delay: 0,
            });
          } else if (missingItem) {
            queueMessage(world, heroEntity, {
              line: addBackground(
                [
                  ...createText("Need ", colors.silver),
                  ...createItemName(missingItem),
                  ...createText("!", colors.silver),
                ],
                colors.black
              ),
              orientation: "up",
              fast: false,
              delay: 0,
            });
          }
        }
      } else if (tab === "sell") {
        const deal = tradeEntity && getDeal(world, heroEntity, tradeEntity);
        if (deal) {
          if (canSell(world, deal.prices[0])) {
            performTrade(world, heroEntity, tradeEntity);
          } else {
            queueMessage(world, heroEntity, {
              line: addBackground(
                [
                  ...createText("Can't sell ", colors.silver),
                  ...createItemName(deal.prices[0]),
                  ...createText("!", colors.silver),
                ],
                colors.black
              ),
              orientation: "up",
              fast: false,
              delay: 0,
            });
          }
        }
      } else if (tab === "forge") {
        const deal = tradeEntity && getDeal(world, heroEntity, tradeEntity);
        if (deal) {
          const resultItem = deal.item;
          performTrade(world, heroEntity, tradeEntity);
          popTabSelection(world, tradeEntity);
          popTabSelection(world, tradeEntity);

          const resultIndex = (heroEntity[INVENTORY]?.items || []).findIndex(
            (itemId) =>
              matchesItem(
                world,
                resultItem,
                world.assertByIdAndComponents(itemId, [ITEM])[ITEM]
              )
          );

          if (resultIndex !== -1) {
            setVerticalIndex(world, tradeEntity, resultIndex);
          }
        } else if (addEntity) {
          const [firstIndex, secondIndex] = selections;
          const { forgeable, addItem, baseItem } = getForgeStatus(
            world,
            heroEntity,
            firstIndex,
            secondIndex,
            verticalIndex
          );
          const nextItem = addItem || baseItem;

          if (forgeable) {
            pushTabSelection(world, addEntity);

            // scroll up on final screen
            if (addItem) {
              setVerticalIndex(world, addEntity, 0);
            }
          } else {
            queueMessage(world, heroEntity, {
              line: nextItem
                ? addBackground(
                    [
                      ...createText("Can't add ", colors.silver),
                      ...createItemName(nextItem),
                      ...createText("!", colors.silver),
                    ],
                    colors.black
                  )
                : createText("Nothing to add!", colors.silver, colors.black),
              orientation: "up",
              fast: false,
              delay: 0,
            });
          }
        }
      } else if (tab === "craft") {
        const deal = tradeEntity && getDeal(world, heroEntity, tradeEntity);
        if (deal) {
          const missingItem = missingFunds(world, heroEntity, deal)[0];
          if (canShop(world, heroEntity, deal)) {
            performTrade(world, heroEntity, tradeEntity);
          } else if (missingItem) {
            queueMessage(world, heroEntity, {
              line: addBackground(
                [
                  ...createText("Need ", colors.silver),
                  ...createItemName(missingItem),
                  ...createText("!", colors.silver),
                ],
                colors.black
              ),
              orientation: "up",
              fast: false,
              delay: 0,
            });
          }
        } else if (addEntity) {
          pushTabSelection(world, addEntity);
          setVerticalIndex(world, addEntity, 0);
        }
      } else if (tab === "inspect") {
        if (useEntity && getConsumption(world, heroEntity, useEntity)) {
          const consumed = consumeItem(world, heroEntity, useEntity);
          if (consumed) {
            setVerticalIndex(world, popupEntity, Math.max(0, boundIndex - 1));
          }
        } else if (useEntity) {
          const useItem =
            inspectItems[getVerticalIndex(world, heroEntity)]?.[ITEM];
          queueMessage(world, heroEntity, {
            line: useItem?.equipment
              ? addBackground(
                  [
                    ...createItemName(useItem),
                    ...createText(" already worn!", colors.silver),
                  ],
                  colors.black
                )
              : useItem
              ? [
                  ...createText("Can't use ", colors.silver),
                  ...createItemName(useItem),
                  ...createText("!", colors.silver),
                ]
              : createText("Nothing to use!", colors.silver),
            orientation: "up",
            fast: false,
            delay: 0,
          });
        }
      } else if (tab === "class" || tab === "style") {
        if (!addEntity) {
          // ignore
        } else if (verticalIndex === 0 || TEST_MODE || tab === "style") {
          popTabSelection(world, addEntity);
          pushTabSelection(world, addEntity);
          // proceed to next tab
          addEntity[POPUP].horizontalIndex += 1;
          rerenderEntity(world, addEntity);
        } else {
          queueMessage(world, heroEntity, {
            line: createText("Not unlocked!", colors.silver, colors.black),
            orientation: "up",
            fast: false,
            delay: 0,
          });
        }
      } else if (tab === "warp") {
        const selectedLevel = warpEntity && getSelectedLevel(world, warpEntity);
        if (!warpEntity) {
          // ignore
        } else if (canWarp(world, heroEntity, warpEntity)) {
          initiateWarp(world, warpEntity, heroEntity);
        } else if (selectedLevel) {
          queueMessage(world, heroEntity, {
            line: createText(
              getSelectedLevel(world, warpEntity) ===
                world.metadata.gameEntity[LEVEL].name
                ? "Already here!"
                : "Not unlocked!",
              colors.silver,
              colors.black
            ),
            orientation: "up",
            fast: false,
            delay: 0,
          });
        }
      }
    } else if (heroEntity[PLAYER].actionTriggered === "left") {
      heroEntity[PLAYER].actionTriggered = undefined;
      const tab = getTab(world, popupEntity);

      // don't allow going back from completed screen
      if (
        selections.length > 0 &&
        !(
          isQuestCompleted(world, heroEntity, popupEntity) &&
          selections.length === 2
        ) &&
        tab !== "class" &&
        tab !== "style"
      ) {
        const verticalIndex = popTabSelection(world, popupEntity);
        setVerticalIndex(world, popupEntity, verticalIndex || 0);
      }
    }

    // mark as interacted
    heroEntity[MOVABLE].pendingOrientation = undefined;
    heroEntity[MOVABLE].lastInteraction = generation;

    rerenderEntity(world, popupEntity);
  };

  return { onUpdate };
}
