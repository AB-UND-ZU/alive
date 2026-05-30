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
  berry,
  brew,
  craft,
  createText,
  dialogEnd,
  dialogStart,
  farming,
  flower,
  forge,
  grain,
  info,
  mapDiscovery,
  none,
  parseSprite,
  quest,
  shop,
  shoutEnd,
  shoutStart,
} from "../../game/assets/sprites";
import { disposeEntity, disposeSequence, getCell, moveEntity } from "./map";
import { POSITION, Position } from "../components/position";
import { createSequence, getSequence } from "./sequence";
import {
  DiscoverySequence,
  PopupSequence,
  SEQUENCABLE,
} from "../components/sequencable";
import { VIEWABLE } from "../components/viewable";
import { UnitStats, STATS } from "../components/stats";
import { Inventory, INVENTORY } from "../components/inventory";
import { Equipment, EQUIPPABLE, slots } from "../components/equippable";
import { Item, ITEM } from "../components/item";
import { rerenderEntity } from "./renderer";
import { entities } from "..";
import { add, combine, getDistance, normalize } from "../../game/math/std";
import { TypedEntity } from "../entities";
import { isDead, isEnemy, isNeutral } from "./damage";
import {
  createItemName,
  frameHeight,
  popupDelay,
  questSequence,
  queueMessage,
} from "../../game/assets/utils";
import { getItemSellPrice } from "../../game/balancing/trading";
import {
  forgeTicks,
  getForgeStatus,
  getForgingSteps,
  hittingWidth,
} from "../../game/balancing/forging";
import { getCraftingDeal } from "../../game/balancing/crafting";
import { getIdentifierAndComponents, setHighlight, TEST_MODE } from "../utils";
import { FOCUSABLE } from "../components/focusable";
import { TRACKABLE } from "../components/trackable";
import { displayedClasses, hairColors } from "../../game/assets/pixels";
import { ACTIONABLE } from "../components/actionable";
import {
  canWarp,
  completeQuest,
  resetConditionables,
  initiateWarp,
  performTrade,
} from "./trigger";
import { colors } from "../../game/assets/colors";
import { consumeItem, getConsumption, getItemConsumption } from "./consume";
import { clamp } from "three/src/math/MathUtils";
import { getSelectedLevel } from "../../game/levels";
import { LEVEL } from "../components/level";
import { REFERENCE } from "../components/reference";
import {
  getKeyFromIndex,
  keyboardColumns,
  keyboardSize,
} from "../../components/Keyboard";
import { executeCommand, parseCommand } from "../../game/assets/commands";
import { recolorSprite } from "../../game/assets/templates";
import { invertOrientation } from "../../game/math/path";
import { plantConfigs } from "../../game/balancing/harvesting";
import { isPlantable, plantSeed, queueBrew } from "./harvest";
import { getBrewingDeal } from "../../game/balancing/brewing";
import { FORGABLE } from "../components/forgable";
import { equipItem } from "./collect";

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
  } else if (tab === "forge" && selections.length >= 2) {
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
  } else if (tab === "craft") {
    const ingredients = popupEntity[POPUP].ingredients[verticalIndex];
    return getCraftingDeal(ingredients);
  } else if (tab === "brew" && selections.length === 2) {
    const recipe = popupEntity[POPUP].recipes[selections[1]];
    return getBrewingDeal(recipe, verticalIndex);
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
    return selections.length === 4 && canShop(world, heroEntity, deal);
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
  first.material === second.material &&
  first.element === second.element &&
  first.consume === second.consume &&
  first.stackable === second.stackable &&
  first.stat === second.stat &&
  slots.every((slot) => first[slot] === second[slot]);

export const missingFunds = (world: World, heroEntity: Entity, deal: Deal) =>
  deal.prices.filter((priceItem) => {
    if (priceItem.stat && !priceItem.material) {
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

export const existingItem = (
  world: World,
  heroEntity: Entity,
  item: Omit<Item, "carrier" | "bound" | "amount">
) =>
  (heroEntity[INVENTORY] as Inventory).items
    .map((itemId) => world.assertByIdAndComponents(itemId, [ITEM]))
    .find((inventoryItem) => matchesItem(world, inventoryItem[ITEM], item));

export const existingFund = (
  world: World,
  heroEntity: Entity,
  item: Omit<Item, "carrier" | "bound" | "amount">
) => existingItem(world, heroEntity, item)?.[ITEM].amount || 0;

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
  brew,
  info,
  talk: info,
  plant: farming,
  quest,
  buy: shop,
  sell: shop,
  inspect: info,
  stats: info,
  warp: mapDiscovery,
  gear: info,
  class: mapDiscovery,
  style: mapDiscovery,
  map: undefined,
  use: undefined,
  equip: undefined,
  chat: undefined,
};

export const popupActions = {
  craft: "CRAFT",
  forge: "FORGE",
  brew: "BREW",
  info: "READ",
  talk: "TALK",
  plant: "SEEDS",
  warp: "WARP",
  quest: "QUEST",
  buy: "SHOP",
  sell: "SHOP",
  inspect: "BAG",
  use: "USE",
  equip: "EQUIP",
  map: "MAP",
  stats: "STATS",
  gear: "GEAR",
  class: "CLASS",
  style: "STYLE",
  chat: "CHAT",
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
  use: "USE",
};

export const visibleStats: (keyof UnitStats)[] = [
  "level",
  "maxHp",
  "maxMp",
  "power",
  "armor",
  "wisdom",
  "resist",
  "vision",
  "haste",
  "damp",
  "thaw",
  "spike",
];

export const gearSlots: Equipment[] = [
  "weapon",
  "skill",
  "spell",
  "offhand",
  "tool",
  "ring",
  "amulet",
  "boots",
  "compass",
  "map",
  "torch",
];
export const gearTitles: Record<Equipment, string> = {
  weapon: "Weapon",
  offhand: "Offhand",
  boots: "Boots",
  spell: "Spell",
  skill: "Skill",
  tool: "Tool",
  ring: "Ring",
  amulet: "Amulet",
  compass: "Compass",
  torch: "Torch",
  map: "Map",
};

export const mapScroll = 4;

export const createPopup = (
  world: World,
  entity: Entity,
  popup: Pick<Popup, "tabs"> & Partial<Popup>
) => {
  const idle = popupIdles[getDiscoveryTab(world, { [POPUP]: popup })];

  if (idle) {
    createSequence<"discovery", DiscoverySequence>(
      world,
      entity,
      "discovery",
      "discoveryIdle",
      {
        idle,
        hidden: false,
        timestamp: 0,
      }
    );
  }

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
      ingredients: [],
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

  // abort popup sequence
  if (entity[SEQUENCABLE].states.popup) {
    disposeSequence(world, entity, "popup");
  }
};

export const openPopup = (
  world: World,
  heroEntity: Entity,
  popupEntity: Entity,
  instant = false
) => {
  const popupId = world.getEntityId(popupEntity);
  const transaction = getDiscoveryTab(world, popupEntity);
  heroEntity[PLAYER].popup = popupId;
  popupEntity[POPUP].active = true;
  rerenderEntity(world, heroEntity);

  // reset pending movements
  heroEntity[MOVABLE].orientations = [];
  heroEntity[MOVABLE].pendingOrientation = undefined;
  resetConditionables(world, heroEntity);

  if (popupEntity[TOOLTIP]) {
    popupEntity[TOOLTIP].override = "hidden";
    popupEntity[TOOLTIP].changed = true;
  }

  const viewpointEntity = world.assertByIdAndComponents(
    popupEntity[POPUP].viewpoint,
    [VIEWABLE, POSITION]
  );
  viewpointEntity[VIEWABLE].active = true;
  rerenderEntity(world, popupEntity);

  // ensure viewpoint is placed correctly if entity moved
  const size = world.metadata.gameEntity[LEVEL].size;
  const targetViewpoint = combine(size, popupEntity[POSITION], {
    x: 0,
    y: (frameHeight + 1) / -2,
  });
  if (
    !instant &&
    getDistance(viewpointEntity[POSITION], targetViewpoint, size) !== 0
  ) {
    moveEntity(world, viewpointEntity, targetViewpoint);
  }

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
      windowHeight: 0,
      contentIndex: 0,
      contentHeight: 0,
      contentClickable: false,
      detailsPadding: 0,
      verticalIndex: 0,
      horizontalIndex: 0,
      transaction: getTab(world, popupEntity),
      instant,
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

export const assignQuickItem = (
  world: World,
  entity: Entity,
  item: Partial<Item>,
  hotKey?: number
) => {
  let assignedSlot = hotKey;
  let existingSlot: number | undefined;

  for (let slotIndex = 1; slotIndex <= 10; slotIndex += 1) {
    const slotNumber = slotIndex % 10;
    const slotItem = entity[PLAYER].quickItems[slotNumber];
    if (!slotItem) {
      if (assignedSlot === undefined) {
        assignedSlot = slotNumber;
      }
      continue;
    }
    if (matchesItem(world, slotItem, item)) {
      existingSlot = slotNumber;
      break;
    }
  }

  if (assignedSlot === undefined) return;

  const { amount, carrier, bound, ...quickItem } = item;
  entity[PLAYER].quickItems[assignedSlot] = quickItem;

  // clear existing slot to prevent duplicates
  if (existingSlot !== undefined) {
    entity[PLAYER].quickItems[existingSlot] = undefined;
  }
};

export default function setupPopup(world: World) {
  let heroGeneration = -1;

  const onUpdate = (delta: number) => {
    const heroEntity = world.getEntity([
      ACTIONABLE,
      EQUIPPABLE,
      MOVABLE,
      PLAYER,
      RENDERABLE,
      INVENTORY,
      TOOLTIP,
    ]);

    if (!heroEntity) return;

    const heroReference = world.assertByIdAndComponents(
      heroEntity[MOVABLE].reference,
      [RENDERABLE, REFERENCE]
    );
    const referenceGeneration = heroReference[RENDERABLE].generation;
    const generation = referenceGeneration + heroEntity[RENDERABLE].generation;

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

    const inventoryItems = (heroEntity[INVENTORY]?.items || []).map((itemId) =>
      world.assertByIdAndComponents(itemId, [ITEM])
    );
    const inspectItems = inventoryItems.filter(
      (item) => !slots.some((slot) => item[ITEM][slot])
    );
    const quickItems = inventoryItems.filter(
      (item) =>
        getItemConsumption(item) || slots.some((slot) => item[ITEM][slot])
    );
    const plantItems = inventoryItems.filter(
      (item) => plantConfigs[item[ITEM].stackable!]
    );
    const equipItems = inventoryItems.filter((item) =>
      slots.some((slot) => item[ITEM][slot])
    );

    const transaction = getTab(world, popupEntity);
    const tradeEntity = world.getEntityByIdAndComponents(
      heroEntity[ACTIONABLE].trade,
      [POPUP, POSITION]
    );
    const useEntity = world.getEntityByIdAndComponents(
      heroEntity[ACTIONABLE].use,
      [POPUP, POSITION]
    );
    const addEntity = world.getEntityByIdAndComponents(
      heroEntity[ACTIONABLE].add,
      [POPUP, POSITION]
    );
    const warpEntity = world.getEntityByIdAndComponents(
      heroEntity[ACTIONABLE].warp,
      [POSITION]
    );

    const selections = getTabSelections(world, popupEntity);
    const popupSequence = getSequence(world, popupEntity, "popup");

    // handle vertical movements
    const lines =
      transaction === "inspect"
        ? inspectItems.length
        : transaction === "use" && selections.length === 2
        ? quickItems.length
        : transaction === "stats"
        ? visibleStats.length + 1
        : transaction === "gear"
        ? gearSlots.length
        : transaction === "equip"
        ? equipItems.length
        : transaction === "map"
        ? mapScroll
        : transaction === "plant"
        ? plantItems.length
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
        ? selections.length >= 2
          ? 0
          : inventoryItems.length
        : transaction === "buy"
        ? popupEntity[POPUP].deals.length
        : transaction === "craft"
        ? popupEntity[POPUP].ingredients.length
        : transaction === "brew"
        ? selections.length === 1
          ? popupEntity[POPUP].recipes.length
          : selections.length === 2
          ? popupEntity[POPUP].recipes[selections[1]].options.length
          : 0
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
        : transaction === "chat"
        ? heroEntity[PLAYER].chatHistory.length + 1
        : 0;

    const previousIndex = getVerticalIndex(world, popupEntity);
    if (
      targetOrientation === "up" ||
      targetOrientation === "down" ||
      heroEntity[PLAYER].actionTriggered === "up" ||
      heroEntity[PLAYER].actionTriggered === "down"
    ) {
      const history = isInTab(world, heroEntity, "chat") && lines > 1;
      const orientation =
        targetOrientation || heroEntity[PLAYER].actionTriggered;
      const targetScroll = history
        ? invertOrientation(orientation)
        : orientation;
      const newIndex =
        previousIndex +
        (targetScroll === "up" ? -1 : targetScroll === "down" ? 1 : 0);
      setVerticalIndex(world, popupEntity, newIndex);

      if (
        heroEntity[PLAYER].actionTriggered === "up" ||
        heroEntity[PLAYER].actionTriggered === "down"
      ) {
        heroEntity[PLAYER].actionTriggered = undefined;
      }

      // scroll through history
      if (history) {
        const historyIndex = clamp(newIndex, 0, lines - 1) - 1;
        popupEntity[POPUP].selections[popupEntity[POPUP].horizontalIndex] =
          historyIndex < 0
            ? []
            : [...heroEntity[PLAYER].chatHistory[historyIndex]];
        rerenderEntity(world, popupEntity);
      }
    } else if (heroEntity[PLAYER].actionTriggered === "content") {
      const contentIndex = heroEntity[PLAYER].contentTriggered;

      heroEntity[PLAYER].actionTriggered = undefined;
      heroEntity[PLAYER].contentTriggered = undefined;
      heroEntity[PLAYER].offsetTriggered = undefined;

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

    // skip if player has already interacted or not going to
    if (
      heroEntity[MOVABLE].lastInteraction === generation ||
      (!targetOrientation && !heroEntity[PLAYER].actionTriggered)
    )
      return;

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
        popupSequence.elapsed = popupSequence.args.windowHeight * popupDelay;
        popupSequence.args.contentIndex = 0;
        rerenderEntity(world, popupEntity);
      }
    } else if (heroEntity[PLAYER].actionTriggered === "type") {
      if (
        heroEntity[PLAYER].tabTriggered !== undefined &&
        heroEntity[PLAYER].contentTriggered !== undefined &&
        heroEntity[PLAYER].offsetTriggered !== undefined
      ) {
        // type new key
        const keyIndex =
          heroEntity[PLAYER].tabTriggered * keyboardSize +
          heroEntity[PLAYER].offsetTriggered * keyboardColumns +
          heroEntity[PLAYER].contentTriggered;
        pushTabSelection(world, popupEntity, keyIndex);
      } else {
        // delete last char
        popTabSelection(world, popupEntity);
      }

      heroEntity[PLAYER].actionTriggered = undefined;
      heroEntity[PLAYER].tabTriggered = undefined;
      heroEntity[PLAYER].contentTriggered = undefined;
      heroEntity[PLAYER].offsetTriggered = undefined;
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
            rerenderEntity(world, heroEntity);
            rerenderEntity(world, popupEntity);
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
        const [firstIndex, secondIndex] = selections;
        const forgeStatus = getForgeStatus(
          world,
          heroEntity,
          firstIndex,
          secondIndex,
          verticalIndex
        );
        if (deal && tradeEntity[FORGABLE]) {
          tradeEntity[FORGABLE].steps = [];
          tradeEntity[FORGABLE].progress = 0;
          tradeEntity[FORGABLE].completed = deal.item;
          tradeEntity[FORGABLE].lastElapsed = 0;
          tradeEntity[FORGABLE].lastAction = undefined;
          tradeEntity[FORGABLE].hitIndex = undefined;
          performTrade(world, heroEntity, tradeEntity);
          pushTabSelection(world, tradeEntity);
        } else if (addEntity) {
          const popupSequence = getSequence(world, addEntity, "popup");
          const { forgeable, addItem, baseItem, resultItem } = forgeStatus;
          const nextItem = addItem || baseItem;

          if (forgeable && selections.length < 2) {
            pushTabSelection(world, addEntity);

            // scroll up for preview
            if (selections.length === 2) {
              setVerticalIndex(world, addEntity, 0);
            }
          } else if (
            selections.length === 2 &&
            addEntity[FORGABLE] &&
            baseItem &&
            addItem &&
            resultItem &&
            popupSequence
          ) {
            addEntity[FORGABLE].steps = getForgingSteps(forgeStatus);
            addEntity[FORGABLE].progress = 0;
            addEntity[FORGABLE].completed = undefined;
            addEntity[FORGABLE].lastElapsed = popupSequence.elapsed;
            addEntity[FORGABLE].lastAction = "swing";
            pushTabSelection(world, addEntity);
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
        } else if (useEntity && useEntity[FORGABLE]) {
          const popupSequence = getSequence(world, useEntity, "popup");
          if (useEntity[FORGABLE].lastAction === "swing" && popupSequence) {
            // calculate hammer position from animation offset
            const tick = world.metadata.gameEntity[REFERENCE].tick;
            const delta =
              popupSequence.elapsed - useEntity[FORGABLE].lastElapsed;
            useEntity[FORGABLE].lastElapsed = popupSequence.elapsed;
            useEntity[FORGABLE].lastAction = "trigger";
            const offset = delta % (tick * forgeTicks);
            const distance =
              Math.floor(delta / tick) % (forgeTicks * 2) < forgeTicks
                ? tick * forgeTicks - offset
                : offset;
            useEntity[FORGABLE].hitIndex = Math.floor(
              (distance / (tick * forgeTicks)) * hittingWidth
            );
            rerenderEntity(world, useEntity);
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
        }
      } else if (tab === "brew") {
        const deal = tradeEntity && getDeal(world, heroEntity, tradeEntity);
        if (deal) {
          const missingItem = missingFunds(world, heroEntity, deal)[0];
          if (canShop(world, heroEntity, deal)) {
            const recipeIndex = selections[1];
            const recipe = popupEntity[POPUP].recipes[recipeIndex];
            queueBrew(world, heroEntity, tradeEntity, recipe, verticalIndex);
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
      } else if (tab === "plant") {
        const plantedItem = plantItems[verticalIndex];

        if (addEntity && plantedItem) {
          if (isPlantable(world, plantedItem[ITEM])) {
            closePopup(world, heroEntity, popupEntity);
            plantSeed(world, heroEntity, plantedItem);
          } else {
            queueMessage(world, heroEntity, {
              line: addBackground(
                [
                  ...createText("Need ", colors.silver),
                  berry,
                  flower,
                  grain,
                  ...createText("Seeds", colors.grey),
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
      } else if (tab === "inspect") {
        const consumption =
          useEntity && getConsumption(world, heroEntity, useEntity);
        if (useEntity && consumption) {
          assignQuickItem(world, heroEntity, consumption.item[ITEM]);

          const consumed = consumeItem(world, heroEntity, consumption);
          if (consumed) {
            setVerticalIndex(world, popupEntity, Math.max(0, boundIndex - 1));
          }
        } else if (useEntity) {
          const useItem =
            inspectItems[getVerticalIndex(world, useEntity)]?.[ITEM];
          queueMessage(world, heroEntity, {
            line: useItem
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
      } else if (tab === "equip") {
        const targetItem = useEntity && equipItems[verticalIndex];

        if (useEntity && targetItem) {
          // check if tool should be swapped with skill
          if (
            heroEntity[ACTIONABLE].toolEquipped &&
            heroEntity[EQUIPPABLE].skill &&
            targetItem[ITEM].skill
          ) {
            heroEntity[ACTIONABLE].toolEquipped = false;
          } else if (
            !heroEntity[ACTIONABLE].toolEquipped &&
            heroEntity[EQUIPPABLE].tool &&
            targetItem[ITEM].tool
          ) {
            heroEntity[ACTIONABLE].toolEquipped = true;
          }

          equipItem(world, heroEntity, targetItem);
          closePopup(world, heroEntity, useEntity);
          rerenderEntity(world, heroEntity);
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
      } else if (tab === "chat") {
        if (TEST_MODE) {
          if (selections.length > 0) {
            const prompt = selections
              .map((keyIndex) => getKeyFromIndex(keyIndex))
              .join("");
            const command = parseCommand(prompt);

            heroEntity[PLAYER].chatHistory.unshift(selections);
            setVerticalIndex(world, popupEntity, 0);

            let dialog = [];
            let shout = false;
            if (command) {
              const error = executeCommand(world, heroEntity, command);
              shout = true;
              dialog = error
                ? Array.isArray(error)
                  ? addBackground(
                      error.map((char) =>
                        recolorSprite(char, {
                          [colors.white]: colors.black,
                          [colors.black]: colors.red,
                        })
                      ),
                      colors.red
                    )
                  : createText(error, colors.black, colors.red)
                : [];
            } else {
              dialog = selections
                .map((keyIndex) => getKeyFromIndex(keyIndex))
                .map((char) =>
                  recolorSprite(
                    parseSprite(`\x0f█\x00${char}`),
                    shout ? colors.red : colors.white
                  )
                );
            }

            if (dialog.length > 0) {
              heroEntity[TOOLTIP].enemy = shout;
              heroEntity[TOOLTIP].dialogs = [
                [
                  shout ? shoutStart : dialogStart,
                  ...dialog,
                  shout ? shoutEnd : dialogEnd,
                ],
              ];
              heroEntity[TOOLTIP].changed = true;
              heroEntity[TOOLTIP].override = "visible";
            }
          }
          closePopup(world, heroEntity, popupEntity);
        }
      } else if (tab === "use") {
        if (addEntity && selections.length === 0) {
          pushTabSelection(world, addEntity);
        } else if (
          addEntity &&
          selections.length === 2 &&
          quickItems.length > 0
        ) {
          const { amount, carrier, bound, ...hotItem } =
            quickItems[verticalIndex][ITEM];
          const hotKey = selections[1];
          assignQuickItem(world, heroEntity, hotItem, hotKey);
          popTabSelection(world, addEntity);
          popTabSelection(world, addEntity);
          setVerticalIndex(world, addEntity, 0);
        }
      }
    } else if (heroEntity[PLAYER].actionTriggered === "left") {
      heroEntity[PLAYER].actionTriggered = undefined;
      const tab = getTab(world, popupEntity);
      const questCompleted =
        isQuestCompleted(world, heroEntity, popupEntity) &&
        selections.length === 2;
      const forgeCompleted = tab === "forge" && selections.length === 4;

      if (tab === "chat") {
        // clear chat
        popupEntity[POPUP].selections[popupEntity[POPUP].horizontalIndex] = [];
      } else if (
        selections.length > 0 &&
        !questCompleted &&
        !forgeCompleted &&
        tab !== "class" &&
        tab !== "style"
      ) {
        // don't allow going back from completed screen or customizations
        const verticalIndex = popTabSelection(world, popupEntity);
        const previousIndex =
          verticalIndex === undefined || tab === "use" ? 0 : verticalIndex;
        setVerticalIndex(world, popupEntity, previousIndex);
      } else if (questCompleted || forgeCompleted) {
        // close final screens on escape
        closePopup(world, heroEntity, popupEntity);
      }
    }

    // mark as interacted
    heroEntity[MOVABLE].pendingOrientation = undefined;
    heroEntity[MOVABLE].lastInteraction = referenceGeneration;

    rerenderEntity(world, popupEntity);
  };

  return { onUpdate };
}
