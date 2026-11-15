import { serverUrl } from "../network/url";
import { SEQUENCABLE } from "../components/sequencable";
import { SPRITE } from "../components/sprite";
import { BREWABLE } from "../components/brewable";
import { WARPABLE } from "../components/warpable";
import { isTestMode } from "../mode";
import { soundSource } from "../../game/sound/events";
import { getPopupPlayer } from "../players";
import addRestorable, { RESTORABLE } from "../components/restorable";
import { updateSpriteBuilder } from "../../game/assets/spriteBuilder";
import { World } from "../ecs";
import { RENDERABLE } from "../components/renderable";
import { MOVABLE } from "../components/movable";
import { Orientation } from "../components/orientable";
import { PLAYER } from "../components/player";
import addPopup, { Deal, Popup, POPUP, Target } from "../components/popup";
import { Entity } from "ecs";
import { TOOLTIP } from "../components/tooltip";
import {
  berry,
  dialogEnd,
  dialogStart,
  farming,
  flower,
  grain,
  mapDiscovery,
  none,
  shoutEnd,
  shoutStart,
} from "../../game/assets/sprites";
import {
  disposeEntity,
  disposeSequence,
  getCellEntities,
  moveEntity,
  registerEntity,
} from "./map";
import { POSITION, Position } from "../components/position";
import { replaceSequence, getSequence } from "./sequence";
import { DiscoverySequence, PopupSequence } from "../components/sequencable";
import { VIEWABLE } from "../components/viewable";
import { UnitStats, STATS } from "../components/stats";
import { Inventory, INVENTORY } from "../components/inventory";
import { Equipment, EQUIPPABLE, slots } from "../components/equippable";
import { Item, ITEM } from "../components/item";
import { rerenderEntity } from "./renderer";
import { entities } from "..";
import {
  add,
  clamp,
  combine,
  getDistance,
  normalize,
} from "../../game/math/std";
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
import {
  getIdentifierAndComponents,
  setHighlight,
  getPlayerFocus,
} from "../utils";
import { FOCUSABLE } from "../components/focusable";
import { displayedClasses, hairColors } from "../../game/assets/pixels";
import { credits } from "../../game/assets/credits";
import {
  getSaveSummaries,
  isLoadable,
  removeSaveSummary,
} from "../../game/saves";
import { ACTIONABLE } from "../components/actionable";
import {
  canWarp,
  completeQuest,
  resetConditionables,
  initiateLoad,
  initiateWarp,
  performTrade,
  castConditionable,
} from "./trigger";
import { colors } from "../../game/assets/colors";
import { consumeItem, getConsumption, getItemConsumption } from "./consume";
import { getSelectedLevel } from "../../game/levels";
import { LEVEL } from "../components/level";
import { REFERENCE } from "../components/reference";
import {
  getKeyFromIndex,
  getIndexFromKey,
  keyboardColumns,
  keyboardSize,
} from "../../game/assets/keyboard";
import {
  completeCommand,
  executeCommand,
  parseCommand,
} from "../../game/assets/commands";
import {
  addBackground,
  brew,
  craft,
  createText,
  forge,
  info,
  parseSprite,
  quest,
  recolorSprite,
  shop,
} from "../../game/assets/ui";
import { updateMovementInterval } from "./movement";
import { loadChatHistory, saveChatHistory } from "../../game/chatHistory";
import { isPlantable, plantSeed, queueBrew } from "./harvest";
import { getBrewingDeal } from "../../game/balancing/brewing";
import { FORGABLE } from "../components/forgable";
import { equipItem } from "./collect";
import { buildConstructions } from "../../game/balancing/building";
import { canBuild, canConstruct, getBuildingDeal } from "./build";
import { FOG } from "../components/fog";
import { play } from "../../game/sound";

export const isInPopup = (world: World, entity: Entity) =>
  entity[PLAYER]?.popup && !isDead(world, entity);

export const isShowingPopup = (world: World, entity: Entity) =>
  entity[POPUP]?.active;

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
  !entity[POPUP].source &&
  !isDead(world, entity) &&
  (!isEnemy(world, entity) || isNeutral(world, entity));

export const getPopup = (world: World, position: Position) =>
  getCellEntities(world, position).find((entity) =>
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

export const isChatInput = (world: World, popup: Entity) =>
  getTab(world, popup) === "chat" ||
  (getTab(world, popup) === "server" &&
    !world.metadata.network &&
    !!popup[POPUP].server?.adding);

export const hasPopupBackButton = (world: World, popup: Entity) => {
  const naming = getPopupPlayer(world, popup, [PLAYER])?.[PLAYER].naming;
  if (
    (getTab(world, popup) === "server" && isChatInput(world, popup)) ||
    naming
  )
    return getTabSelections(world, popup).length === 0;
  return !!getSequence(world, popup, "popup")?.args.backButton;
};

export const typeChat = (
  world: World,
  heroEntity: Entity,
  keyIndex?: number | number[]
) => {
  const popup = world.getEntityByIdAndComponents(heroEntity[PLAYER]?.popup, [
    POPUP,
  ]);
  if (!popup || !isChatInput(world, popup)) return;

  if (world.metadata.network) {
    world.metadata.network.action(
      Array.isArray(keyIndex)
        ? { kind: "text", indices: keyIndex.slice(0, 128) }
        : { kind: "text", index: keyIndex }
    );
    return;
  }
  if (
    world.metadata.warpPlayer &&
    keyIndex !== undefined &&
    getTabSelections(world, popup).length >=
      (heroEntity[PLAYER].naming ? 16 : 128)
  )
    return;

  popup[POPUP].chatSuggestion = 0;
  setVerticalIndex(world, popup, 0);

  const reference = world.assertByIdAndComponents(
    heroEntity[MOVABLE].reference,
    [REFERENCE]
  )[REFERENCE];
  reference.suspensionCounter =
    reference.suspensionCounter === -1 ? -1 : reference.suspensionCounter + 1;
  reference.suspended = false;

  if (keyIndex !== undefined) {
    const indices = Array.isArray(keyIndex) ? keyIndex : [keyIndex];
    getTabSelections(world, popup).push(
      ...indices.slice(
        0,
        world.metadata.warpPlayer
          ? (heroEntity[PLAYER].naming ? 16 : 128) -
              getTabSelections(world, popup).length
          : undefined
      )
    );
    rerenderEntity(world, popup);
    play(
      "type",
      { notes: 2, spacing: 16 },
      soundSource(world, heroEntity, true)
    );
  } else {
    popTabSelection(world, popup);
    play(
      "type",
      { notes: 2, spacing: 20, intensity: 2 },
      soundSource(world, heroEntity, true)
    );
  }
};

export const navigateChat = (
  world: World,
  heroEntity: Entity,
  direction: -1 | 1
) => {
  const popup = world.getEntityByIdAndComponents(heroEntity[PLAYER]?.popup, [
    POPUP,
  ]);
  if (!popup || getTab(world, popup) !== "chat") return;
  if (world.metadata.network) {
    world.metadata.network.action({
      kind: "history",
      index: direction === -1 ? 0 : 1,
    });
    return;
  }
  const input = getTabSelections(world, popup).map(getKeyFromIndex).join("");
  const historyIndex = getVerticalIndex(world, popup);
  if (input.trim() && historyIndex === 0) {
    if (isTestMode(world, heroEntity) && completeCommand(world, input)) {
      popup[POPUP].chatSuggestion =
        (popup[POPUP].chatSuggestion || 0) + direction;
      rerenderEntity(world, popup);
      play(
        "select",
        { variant: direction === -1 ? 2 : 1 },
        soundSource(world, heroEntity, true)
      );
    }
    return;
  }
  const history = world.metadata.warpPlayer
    ? heroEntity[PLAYER].chatHistory
    : loadChatHistory(heroEntity[PLAYER].chatHistory);
  heroEntity[PLAYER].chatHistory = history;
  const next = clamp(historyIndex - direction, 0, history.length);
  setVerticalIndex(world, popup, next);
  popup[POPUP].selections[popup[POPUP].horizontalIndex] = next
    ? [...history[next - 1]]
    : [];
  popup[POPUP].chatSuggestion = 0;
  if (next !== historyIndex)
    play(
      "select",
      { variant: direction === -1 ? 2 : 1 },
      soundSource(world, heroEntity, true)
    );
};

export const completeChat = (world: World, heroEntity: Entity) => {
  if (!isTestMode(world, heroEntity)) return;
  if (world.metadata.network) {
    world.metadata.network.action({ kind: "complete" });
    return;
  }
  const popup = world.getEntityByIdAndComponents(heroEntity[PLAYER]?.popup, [
    POPUP,
  ]);
  if (!popup || getTab(world, popup) !== "chat") return;
  const input = getTabSelections(world, popup).map(getKeyFromIndex).join("");
  const completion = completeCommand(world, input, popup[POPUP].chatSuggestion);
  if (!completion) return;
  const indices = [...completion].flatMap((key) => {
    const index = getIndexFromKey(key);
    return index
      ? [
          index.tab * keyboardSize +
            index.offset * keyboardColumns +
            index.content,
        ]
      : [];
  });
  if (indices.length !== [...completion].length) return;
  typeChat(world, heroEntity, indices);
};

export const submitChat = (
  world: World,
  heroEntity: Entity,
  line: string | string[] = ""
) => {
  const serverPopup = world.getEntityByIdAndComponents(
    heroEntity[PLAYER]?.popup,
    [POPUP]
  );
  if (serverPopup && getTab(world, serverPopup) === "server") {
    if (world.metadata.warpPlayer || world.metadata.network) return;
    const input = [...line].join("").trim();
    const config = (serverPopup[POPUP].server ||= {});
    world.metadata.serverError = "";
    if (!config.adding) {
      const address =
        world.metadata.listServers()[getVerticalIndex(world, serverPopup)];
      if (address) world.metadata.connectServer?.(address);
      else {
        config.adding = true;
        setVerticalIndex(world, serverPopup, 0);
      }
      rerenderEntity(world, serverPopup);
      return;
    }
    try {
      if (!config.address) {
        const address = serverUrl(input);
        if (world.metadata.hasServerPlayer(address))
          world.metadata.connectServer?.(address);
        else {
          config.address = address;
          serverPopup[POPUP].selections[serverPopup[POPUP].horizontalIndex] =
            [];
        }
      } else if (input) world.metadata.connectServer?.(config.address, input);
      else world.metadata.serverError = "Enter a username!";
    } catch {
      world.metadata.serverError = "Invalid server URL!";
    }
    rerenderEntity(world, serverPopup);
    return;
  }
  if (heroEntity[PLAYER]?.naming) {
    const error = world.metadata.chooseUsername?.(
      heroEntity[PLAYER].accountId!,
      [...line].join("").trim()
    );
    heroEntity[PLAYER].nameError = error;
    rerenderEntity(world, heroEntity);
    return error;
  }
  const keys = [...line];
  while (keys.length && !keys[0].trim()) keys.shift();
  while (keys.length && !keys[keys.length - 1].trim()) keys.pop();
  const popup = world.getEntityByIdAndComponents(heroEntity[PLAYER]?.popup, [
    POPUP,
  ]);
  if (popup && getTab(world, popup) === "chat") {
    setVerticalIndex(world, popup, 0);
    closePopup(world, heroEntity, popup);
  }
  if (!keys.length) {
    heroEntity[TOOLTIP].dialogs = [];
    heroEntity[TOOLTIP].changed = true;
    heroEntity[TOOLTIP].override = undefined;
    heroEntity[TOOLTIP].enemy = false;
    return;
  }

  const selections = keys.flatMap((key) => {
    const index = getIndexFromKey(key);
    return index
      ? [
          index.tab * keyboardSize +
            index.offset * keyboardColumns +
            index.content,
        ]
      : [];
  });
  if (!world.metadata.warpPlayer)
    heroEntity[PLAYER].chatHistory = loadChatHistory(
      heroEntity[PLAYER].chatHistory
    );
  heroEntity[PLAYER].chatHistory.unshift(selections);
  if (world.metadata.warpPlayer)
    heroEntity[PLAYER].chatHistory.length = Math.min(
      32,
      heroEntity[PLAYER].chatHistory.length
    );
  if (!world.metadata.warpPlayer)
    saveChatHistory(heroEntity[PLAYER].chatHistory);
  play("confirm", {}, soundSource(world, heroEntity, true));

  const command = isTestMode(world, heroEntity)
    ? parseCommand(keys.join(""))
    : undefined;
  const error = command
    ? executeCommand(world, heroEntity, command)
    : undefined;
  const dialog = command
    ? error
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
      : []
    : (world.metadata.warpPlayer && heroEntity[PLAYER].username
        ? [...heroEntity[PLAYER].username, ":", " ", ...keys]
        : keys
      ).map((char) =>
        recolorSprite(parseSprite(`\x0f█\x00${char}`), colors.white)
      );

  if (getSequence(world, heroEntity, "dialog"))
    disposeSequence(world, heroEntity, "dialog");
  heroEntity[TOOLTIP].enemy = !!command;
  heroEntity[TOOLTIP].dialogs = dialog.length
    ? [
        [
          command ? shoutStart : dialogStart,
          ...dialog,
          command ? shoutEnd : dialogEnd,
        ],
      ]
    : [];
  heroEntity[TOOLTIP].changed = true;
  heroEntity[TOOLTIP].override = dialog.length ? "visible" : undefined;
  return error;
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
    const { forgeable, baseItem, addItem, resultItem } = getForgeStatus(
      world,
      entity,
      selections[0],
      selections[1]
    );

    if (forgeable && baseItem && addItem && resultItem) {
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
  heroEntity[PLAYER].defeatedUnits[target.unit!] || 0;

export const hasCompletedTargets = (
  world: World,
  heroEntity: Entity,
  target: Target
) => {
  if (target.identifier) {
    const targetEntity = getIdentifierAndComponents(world, target.identifier, [
      FOG,
    ]);

    return !targetEntity || targetEntity[FOG].visibility !== "hidden";
  }

  if (getDefeated(world, heroEntity, target) >= target.amount) return true;
};

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
        hasCompletedTargets(world, hero, target)
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
  server: mapDiscovery,
  build: undefined,
  credits: info,
  load: mapDiscovery,
  pack: undefined,
  sprite: undefined,
  layer: undefined,
};

export const popupActions = {
  server: "LIST",
  craft: "CRAFT",
  forge: "FORGE",
  brew: "BREW",
  info: "READ",
  talk: "TALK",
  plant: "SEEDS",
  build: "BUILD",
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
  credits: "READ",
  load: "LOAD",
  pack: "LIST",
  sprite: "VIEW",
  layer: "LAYER",
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
  credits: "TY <3",
  load: "SAVES",
};

export const getPopupAction = (world: World, entity: Entity) =>
  getDiscoveryTab(world, entity) === "server" &&
  (world.metadata.network || world.metadata.warpPlayer)
    ? "INFO"
    : popupActions[getDiscoveryTab(world, entity)];

export const getPopupTitle = (
  world: World,
  entity: Entity,
  tab = getTab(world, entity)
) => {
  if (tab === "server")
    return world.metadata.network || world.metadata.warpPlayer
      ? "INFO"
      : !entity[POPUP].server?.adding
      ? "LIST"
      : entity[POPUP].server?.address
      ? "NAME"
      : "URL";
  if (
    tab === "chat" &&
    getPopupPlayer(world, entity, [PLAYER])?.[PLAYER].naming
  )
    return "NAME";
  return popupTitles[tab];
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

const popupRevisions = new WeakMap<Entity, number>();

export const createPopup = (
  world: World,
  entity: Entity,
  popup: Pick<Popup, "tabs"> & Partial<Popup>
) => {
  const revision =
    Math.max(popupRevisions.get(entity) || 0, entity[POPUP]?.revision || 0) + 1;
  popupRevisions.set(entity, revision);
  if (popup.tabs.includes("load")) addRestorable(world, entity, {});
  const idle = popupIdles[getDiscoveryTab(world, { [POPUP]: popup })];

  if (idle) {
    replaceSequence<"discovery", DiscoverySequence>(
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

  if (!idle && getSequence(world, entity, "discovery"))
    disposeSequence(world, entity, "discovery");
  if (entity[POPUP]) {
    const previousViewpoint = world.assertById(entity[POPUP].viewpoint);
    disposeEntity(world, previousViewpoint);
  }

  const viewpointEntity = entities.createViewpoint(world, {
    [POSITION]: add(entity[POSITION], { x: 0, y: (frameHeight + 1) / -2 }),
    [RENDERABLE]: { generation: 0 },
    [VIEWABLE]: { active: false, priority: 90 },
  });
  registerEntity(world, viewpointEntity);
  const component = {
    active: false,
    revision,
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
  if (!entity[POPUP]) return;
  // close active popup
  const entityId = world.getEntityId(entity);
  const heroEntity = getPopupPlayer(world, entity, [PLAYER]);
  if (heroEntity && heroEntity[PLAYER].popup === entityId) {
    closePopup(world, heroEntity, entity);
    // Closing a completed quest may already remove its popup.
    if (!entity[POPUP]) return;
  }

  // remove viewpoint
  const viewpointEntity = world.assertByIdAndComponents(
    entity[POPUP].viewpoint,
    [VIEWABLE]
  );
  disposeEntity(world, viewpointEntity);

  // remove popup
  popupRevisions.set(entity, entity[POPUP].revision || 0);
  world.removeComponentFromEntity(entity as TypedEntity<"POPUP">, POPUP, false);
  if (getSequence(world, entity, "discovery")) {
    disposeSequence(world, entity, "discovery");
  }

  // abort popup sequence
  if (getSequence(world, entity, "popup")) {
    disposeSequence(world, entity, "popup");
  }
};

const sharedPopupFields = [
  "deals",
  "ingredients",
  "recipes",
  "lines",
  "targets",
  "focuses",
  "choices",
  "tabs",
] as const;

const bindPopupView = (world: World, view: Entity, source: Entity) => {
  const original = source[POPUP];
  for (const key of sharedPopupFields)
    Object.defineProperty(view[POPUP], key, {
      configurable: true,
      enumerable: true,
      get: () => (source[POPUP] || original)[key],
      set: (value) => {
        (source[POPUP] || original)[key] = value;
      },
    });
  view[POPUP].sourceRevision = original.revision;
};

const getPopupView = (world: World, player: Entity, source: Entity) => {
  const owner = world.getEntityId(player),
    sourceId = world.getEntityId(source);
  const viewers = (source[POPUP].viewers ||= {});
  let view = world.getEntityByIdAndComponents(viewers[owner], [POPUP]);
  if (!view) {
    view = entities.createViewpoint(world, {
      POSITION: { ...source[POSITION] },
      RENDERABLE: { generation: 0 },
      VIEWABLE: { active: false, priority: 90, owner },
    }) as TypedEntity<"POPUP">;
    world.addComponentToEntity(view, SEQUENCABLE, { states: {} });
    world.addComponentToEntity(view, SPRITE, none);
    world.addComponentToEntity(view, FOG, {
      visibility: "visible",
      type: "float",
      fixed: true,
    });
    createPopup(world, view, {
      tabs: source[POPUP].tabs,
      source: sourceId,
      owner,
    });
    for (const key of [INVENTORY, BREWABLE, WARPABLE] as const)
      if (source[key])
        world.addComponentToEntity(view, key, source[key] as never);
    if (source[FORGABLE])
      world.addComponentToEntity(view, FORGABLE, {
        ...source[FORGABLE],
        steps: [...source[FORGABLE].steps],
      });
    if (source[RESTORABLE]) world.addComponentToEntity(view, RESTORABLE, {});
    registerEntity(world, view);
    viewers[owner] = world.getEntityId(view);
  }
  bindPopupView(world, view, source);
  return view;
};

export const openPopup = (
  world: World,
  heroEntity: Entity,
  popupEntity: Entity,
  instant = false
): false | undefined => {
  if (
    world.metadata.warpPlayer &&
    !popupEntity[POPUP].source &&
    (popupEntity[POPUP].owner === undefined || popupEntity[POPUP].viewers)
  ) {
    const source = popupEntity;
    const view = getPopupView(world, heroEntity, source);
    source[POPUP].active = true;
    source[POPUP].owner ??= world.getEntityId(heroEntity);
    return openPopup(world, heroEntity, view, instant);
  }
  if (
    popupEntity[POPUP].active &&
    popupEntity[POPUP].owner !== undefined &&
    popupEntity[POPUP].owner !== world.getEntityId(heroEntity)
  )
    return false;
  const owner = world.getEntityId(heroEntity);
  if (
    popupEntity[POPUP].owner !== undefined &&
    popupEntity[POPUP].owner !== owner
  ) {
    const popup = popupEntity[POPUP] as Popup;
    popup.selections = popup.tabs.map(() => []);
    popup.verticalIndezes = popup.tabs.map((tab, index) =>
      tab === "warp" ? popup.verticalIndezes[index] : 0
    );
    popup.horizontalIndex = 0;
  }
  popupEntity[POPUP].owner = owner;
  if (popupEntity[POPUP].tabs.includes("load") && !popupEntity[RESTORABLE]) {
    addRestorable(world, popupEntity, {});
  }
  const popupId = world.getEntityId(popupEntity);
  const transaction = getDiscoveryTab(world, popupEntity);
  if (
    transaction === "server" &&
    !world.metadata.warpPlayer &&
    !world.metadata.network
  ) {
    popupEntity[POPUP].server = {};
    popupEntity[POPUP].selections[popupEntity[POPUP].tabs.indexOf("server")] =
      [];
    setVerticalIndex(world, popupEntity, 0);
    world.metadata.serverError = "";
  }
  heroEntity[PLAYER].popup = popupId;
  updateMovementInterval(world, heroEntity);
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
  viewpointEntity[VIEWABLE].owner = world.getEntityId(heroEntity);
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

  // hum while window unrolls, short if shown instantly
  play(
    "open",
    {
      intensity: instant ? 120 : (frameHeight - 1) * popupDelay,
    },
    soundSource(world, heroEntity, true)
  );

  replaceSequence<"popup", PopupSequence>(
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
  const focusEntity = getPlayerFocus(world, heroEntity);
  if (focusEntity?.[FOCUSABLE].target === popupId) {
    setHighlight(world, undefined, undefined, undefined, heroEntity);
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
  if (
    popupEntity[POPUP].owner !== undefined &&
    popupEntity[POPUP].owner !== world.getEntityId(heroEntity)
  )
    return;
  const tab = getTab(world, popupEntity);
  const selections = getTabSelections(world, popupEntity);
  if (popupEntity[RESTORABLE]) popupEntity[RESTORABLE].saveId = undefined;

  heroEntity[PLAYER].popup = undefined;
  updateMovementInterval(world, heroEntity);
  popupEntity[POPUP].active = false;
  const source = world.getEntityByIdAndComponents(popupEntity[POPUP].source, [
    POPUP,
  ]);
  if (source) {
    const active = Object.values(source[POPUP].viewers || {})
      .map((id) => world.getEntityByIdAndComponents(id, [POPUP]))
      .find((view) => view?.[POPUP].active);
    source[POPUP].active = !!active;
    source[POPUP].owner = active?.[POPUP].owner;
  }
  popupEntity[POPUP].chatSuggestion = 0;
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
    removePopup(world, source || popupEntity);
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
  if (existingSlot !== undefined && existingSlot !== assignedSlot) {
    entity[PLAYER].quickItems[existingSlot] = undefined;
  }
  rerenderEntity(world, entity);
};

export const updateInventorySelections = (
  world: World,
  hero: Entity,
  removedIndex: number
) => {
  if (!hero[PLAYER]) return;
  for (const entity of world.getEntities([POPUP])) {
    if (
      entity[POPUP].owner !== undefined &&
      entity[POPUP].owner !== world.getEntityId(hero)
    )
      continue;
    entity[POPUP].tabs.forEach((tab, tabIndex) => {
      if (tab !== "forge") return;
      const selections = entity[POPUP].selections[tabIndex];
      if (!selections.length || selections.length === 4) return;
      if (!selections.slice(0, 2).some((index) => index >= removedIndex))
        return;
      const removedSelection = selections.slice(0, 2).indexOf(removedIndex);
      if (removedSelection !== -1) selections.splice(removedSelection);
      for (let index = 0; index < Math.min(2, selections.length); index += 1) {
        if (selections[index] > removedIndex) selections[index] -= 1;
      }
      rerenderEntity(world, entity);
    });
  }
};

const getPopupLength = (world: World, hero: Entity, entity: Entity) => {
  const popup = entity[POPUP] as Popup;
  const tab = getTab(world, entity);
  const selections = getTabSelections(world, entity);
  const inventory = hero[INVENTORY] as Inventory;
  switch (tab) {
    case "inspect":
    case "equip":
    case "plant":
    case "use":
      if (tab === "use" && selections.length !== 2) return 0;
      return inventory.items.filter((id) => {
        const item = world.assertByIdAndComponents(id, [ITEM]);
        const equipment = slots.some((slot) => item[ITEM][slot]);
        return tab === "inspect"
          ? !equipment
          : tab === "equip"
          ? equipment
          : tab === "plant"
          ? isPlantable(world, item[ITEM])
          : equipment || !!getItemConsumption(item);
      }).length;
    case "sell":
      return inventory.items.length;
    case "forge":
      return selections.length < 2 ? inventory.items.length : 0;
    case "buy":
      return popup.deals.length;
    case "craft":
      return popup.ingredients.length;
    case "brew":
      return selections.length === 1
        ? popup.recipes.length
        : selections.length === 2
        ? popup.recipes[selections[1]]?.options.length || 0
        : 0;
    case "stats":
      return visibleStats.length + 1;
    case "gear":
      return gearSlots.length;
    case "map":
      return mapScroll;
    case "build":
      return buildConstructions.length + 1;
    case "class":
      return displayedClasses.length;
    case "style":
      return hairColors.length;
    case "credits":
      return credits.length;
    case "load":
      return selections.length === 0 ? getSaveSummaries().length : 0;
    case "server":
      return entity[POPUP].server?.adding ||
        world.metadata.warpPlayer ||
        world.metadata.network
        ? 1
        : world.metadata.listServers().length + 1;
    case "chat":
      return hero[PLAYER].chatHistory.length + 1;
    case "info":
    case "warp":
    case "talk":
      return Math.max(
        0,
        (popup.lines[popup.horizontalIndex] || []).length -
          (frameHeight - 2) +
          1
      );
    case "quest":
      if (selections.length)
        return selections.length === 1 && isQuestCompleted(world, hero, entity)
          ? popup.choices.length
          : 0;
      return Math.max(
        0,
        (popup.lines[popup.horizontalIndex] || []).length +
          1 +
          (popup.targets.length ? popup.targets.length + 2 : 0) +
          (popup.deals[0]?.prices.length
            ? popup.deals[0].prices.length + 2
            : 0) +
          (popup.deals.length ? popup.deals.length + 2 : 0) +
          (popup.choices.length ? popup.choices.length + 2 : 0) -
          (frameHeight - 2) +
          1
      );
    default:
      return 0;
  }
};

export const updatePopupSelection = (
  world: World,
  hero: Entity,
  entity: Entity
) => {
  const selections = getTabSelections(world, entity);
  const tab = getTab(world, entity);
  if (
    tab === "quest" &&
    selections.length === 1 &&
    !isQuestCompleted(world, hero, entity)
  ) {
    selections.length = 0;
    setVerticalIndex(world, entity, 0);
  }
  if (
    tab === "forge" &&
    selections.length >= 2 &&
    selections.length < 4 &&
    !getForgeStatus(world, hero, selections[0], selections[1]).forgeable
  ) {
    selections.splice(1);
    rerenderEntity(world, entity);
  }
  const index = getVerticalIndex(world, entity);
  const boundIndex = clamp(
    index,
    0,
    Math.max(0, getPopupLength(world, hero, entity) - 1)
  );
  if (index !== boundIndex) setVerticalIndex(world, entity, boundIndex);
  return boundIndex;
};

export default function setupPopup(world: World) {
  const generations = new WeakMap<Entity, number>();
  const updatePlayer = (
    heroEntity: TypedEntity<
      | "ACTIONABLE"
      | "EQUIPPABLE"
      | "MOVABLE"
      | "PLAYER"
      | "RENDERABLE"
      | "INVENTORY"
      | "TOOLTIP"
    >
  ) => {
    const heroReference = world.assertByIdAndComponents(
      heroEntity[MOVABLE].reference,
      [RENDERABLE, REFERENCE]
    );
    const referenceGeneration = heroReference[RENDERABLE].generation;
    const generation = referenceGeneration + heroEntity[RENDERABLE].generation;

    if (generations.get(heroEntity) === generation) return;
    generations.set(heroEntity, generation);

    const popupEntity = world.getEntityByIdAndComponents(
      heroEntity[PLAYER].popup,
      [POPUP]
    );

    // skip if player is not in popup
    if (!popupEntity) return;

    const owner = world.getEntityId(heroEntity);
    if (
      popupEntity[POPUP].owner !== undefined &&
      popupEntity[POPUP].owner !== owner
    ) {
      heroEntity[PLAYER].popup = undefined;
      updateMovementInterval(world, heroEntity);
      rerenderEntity(world, heroEntity);
      return;
    }
    popupEntity[POPUP].owner = owner;
    const viewpoint = world.getEntityByIdAndComponents(
      popupEntity[POPUP].viewpoint,
      [VIEWABLE]
    );
    if (viewpoint) viewpoint[VIEWABLE].owner = owner;

    if (heroEntity[MOVABLE].lastInteraction === referenceGeneration) return;

    // capture movements while popup is open
    const targetOrientation: Orientation | undefined =
      heroEntity[MOVABLE].pendingOrientation ||
      heroEntity[MOVABLE].orientations[0];

    if (heroEntity[PLAYER].actionTriggered === "scroll") {
      const maximum = getSequence(world, popupEntity, "popup")?.args.scrollMax;
      if (maximum !== undefined) {
        const index = Math.round(
          clamp(heroEntity[PLAYER].contentTriggered ?? 0, 0, 1) * maximum
        );
        if (index !== getVerticalIndex(world, popupEntity))
          play("select", {}, soundSource(world, heroEntity, true));
        setVerticalIndex(world, popupEntity, index);
        if (popupEntity[POPUP].sprite && getTab(world, popupEntity) === "pack")
          popupEntity[POPUP].sprite!.selected = index;
        rerenderEntity(world, popupEntity);
      }
      heroEntity[PLAYER].actionTriggered = undefined;
      heroEntity[PLAYER].contentTriggered = undefined;
      heroEntity[MOVABLE].pendingOrientation = undefined;
      heroEntity[MOVABLE].lastInteraction = referenceGeneration;
      return;
    }

    if (
      popupEntity[POPUP].sprite &&
      !["close", "tab", "backtab"].includes(
        heroEntity[PLAYER].actionTriggered || ""
      )
    ) {
      if (targetOrientation || heroEntity[PLAYER].actionTriggered) {
        updateSpriteBuilder(world, heroEntity, popupEntity, targetOrientation);
        heroEntity[MOVABLE].pendingOrientation = undefined;
        heroEntity[MOVABLE].lastInteraction = referenceGeneration;
        rerenderEntity(world, popupEntity);
      }
      return;
    }

    if (!targetOrientation && !heroEntity[PLAYER].actionTriggered) return;

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
    const plantItems = inventoryItems.filter((item) =>
      isPlantable(world, item[ITEM])
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
    const lines = getPopupLength(world, heroEntity, popupEntity);

    const previousIndex = getVerticalIndex(world, popupEntity);
    if (
      targetOrientation === "up" ||
      targetOrientation === "down" ||
      heroEntity[PLAYER].actionTriggered === "up" ||
      heroEntity[PLAYER].actionTriggered === "down"
    ) {
      const orientation =
        targetOrientation || heroEntity[PLAYER].actionTriggered;
      if (transaction === "chat") {
        navigateChat(world, heroEntity, orientation === "up" ? -1 : 1);
        heroEntity[PLAYER].actionTriggered = undefined;
        heroEntity[MOVABLE].lastInteraction = referenceGeneration;
        return;
      }
      const targetScroll = orientation;
      const newIndex =
        previousIndex +
        (targetScroll === "up" ? -1 : targetScroll === "down" ? 1 : 0);
      setVerticalIndex(world, popupEntity, newIndex);

      if (clamp(newIndex, 0, lines > 0 ? lines - 1 : 0) !== previousIndex) {
        play(
          "select",
          { variant: targetScroll === "up" ? 2 : 1 },
          soundSource(world, heroEntity, true)
        );
      }

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

          if (clamp(newIndex, 0, lines > 0 ? lines - 1 : 0) !== previousIndex) {
            play("select", {}, soundSource(world, heroEntity, true));
          }
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
        play("close", {}, soundSource(world, heroEntity, true));
      }
    } else if (
      heroEntity[PLAYER].actionTriggered === "tab" ||
      heroEntity[PLAYER].actionTriggered === "backtab"
    ) {
      // handle tab changes
      const previousIndex = popupEntity[POPUP].horizontalIndex;
      const backtab = heroEntity[PLAYER].actionTriggered === "backtab";
      popupEntity[POPUP].horizontalIndex = normalize(
        heroEntity[PLAYER].tabTriggered ?? previousIndex + (backtab ? -1 : 1),
        popupEntity[POPUP].tabs.length
      );
      heroEntity[PLAYER].actionTriggered = undefined;
      heroEntity[PLAYER].tabTriggered = undefined;
      updateMovementInterval(world, heroEntity);

      // rerender on tab changes
      if (
        popupEntity[POPUP].horizontalIndex !== previousIndex &&
        popupSequence
      ) {
        popupSequence.elapsed = popupSequence.args.windowHeight * popupDelay;
        popupSequence.args.contentIndex = 0;
        rerenderEntity(world, popupEntity);
        play(
          "tab",
          { variant: backtab ? 2 : 1 },
          soundSource(world, heroEntity, true)
        );
      }
    } else if (heroEntity[PLAYER].actionTriggered === "type") {
      const { tabTriggered, offsetTriggered, contentTriggered } =
        heroEntity[PLAYER];
      typeChat(
        world,
        heroEntity,
        tabTriggered !== undefined &&
          offsetTriggered !== undefined &&
          contentTriggered !== undefined
          ? tabTriggered * keyboardSize +
              offsetTriggered * keyboardColumns +
              contentTriggered
          : undefined
      );

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
          play("confirm", {}, soundSource(world, heroEntity, true));

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
            play("confirm", {}, soundSource(world, heroEntity, true));
          } else {
            // proceed to choices screen
            pushTabSelection(world, addEntity);
            setVerticalIndex(world, addEntity, 0);
            play("confirm", {}, soundSource(world, heroEntity, true));
          }
        } else if (!isQuestCompleted(world, heroEntity, popupEntity)) {
          play("deny", {}, soundSource(world, heroEntity, true));
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
            play("deny", {}, soundSource(world, heroEntity, true));
            queueMessage(world, heroEntity, {
              line: createText("Sold out!", colors.silver, colors.black),
              orientation: "up",
              fast: false,
              delay: 0,
            });
          } else if (missingItem) {
            play("deny", {}, soundSource(world, heroEntity, true));
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
            play("deny", {}, soundSource(world, heroEntity, true));
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
        if (deal && tradeEntity[FORGABLE] && canShop(world, heroEntity, deal)) {
          tradeEntity[FORGABLE].steps = [];
          tradeEntity[FORGABLE].progress = 0;
          tradeEntity[FORGABLE].completed = deal.item;
          tradeEntity[FORGABLE].lastElapsed = 0;
          tradeEntity[FORGABLE].lastAction = undefined;
          tradeEntity[FORGABLE].hitIndex = undefined;
          pushTabSelection(world, tradeEntity);
          performTrade(world, heroEntity, tradeEntity);
        } else if (addEntity) {
          const popupSequence = getSequence(world, addEntity, "popup");
          const { forgeable, addItem, baseItem, resultItem } = forgeStatus;
          const nextItem = addItem || baseItem;

          if (forgeable && selections.length < 2) {
            pushTabSelection(world, addEntity);
            play("confirm", {}, soundSource(world, heroEntity, true));

            // scroll up for preview
            if (selections.length === 2) {
              setVerticalIndex(world, addEntity, 0);
            }
          } else if (
            selections.length === 2 &&
            forgeable &&
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
            play("confirm", {}, soundSource(world, heroEntity, true));
          } else {
            play("deny", {}, soundSource(world, heroEntity, true));
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
            play("deny", {}, soundSource(world, heroEntity, true));
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
            play("confirm", {}, soundSource(world, heroEntity, true));
          } else if (missingItem) {
            play("deny", {}, soundSource(world, heroEntity, true));
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
          play("confirm", {}, soundSource(world, heroEntity, true));
        }
      } else if (tab === "plant") {
        const plantedItem = plantItems[verticalIndex];

        if (addEntity && plantedItem) {
          if (isPlantable(world, plantedItem[ITEM])) {
            closePopup(world, heroEntity, popupEntity);
            plantSeed(world, heroEntity, plantedItem);
            play("confirm", {}, soundSource(world, heroEntity, true));
          } else {
            play("deny", {}, soundSource(world, heroEntity, true));
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
      } else if (tab === "build") {
        const buildingConstruction = buildConstructions[verticalIndex - 1];
        const toolEntity = world.getEntityByIdAndComponents(
          heroEntity[EQUIPPABLE].tool,
          [ITEM]
        );

        if (addEntity && toolEntity?.[ITEM].tool === "hammer") {
          if (
            verticalIndex === 0 ||
            (buildingConstruction &&
              canBuild(world, heroEntity, buildingConstruction))
          ) {
            closePopup(world, heroEntity, popupEntity);
            castConditionable(world, heroEntity, toolEntity);
          } else if (
            buildingConstruction &&
            !canConstruct(world, heroEntity, buildingConstruction)
          ) {
            const buildingSprite = buildingConstruction.sprite;
            play("deny", {}, soundSource(world, heroEntity, true));
            queueMessage(world, heroEntity, {
              line: addBackground(
                [
                  ...createText("Can't build ", colors.silver),
                  buildingSprite,
                  ...createText(buildingSprite.name, colors.grey),
                  ...createText("!", colors.silver),
                ],
                colors.black
              ),
              orientation: "up",
              fast: false,
              delay: 0,
            });
          } else {
            const missingItem = missingFunds(
              world,
              heroEntity,
              getBuildingDeal(buildingConstruction)
            )[0];
            play("deny", {}, soundSource(world, heroEntity, true));
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
          play("deny", {}, soundSource(world, heroEntity, true));
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
        } else if (
          verticalIndex === 0 ||
          isTestMode(world, heroEntity) ||
          tab === "style"
        ) {
          popTabSelection(world, addEntity);
          pushTabSelection(world, addEntity);
          // proceed to next tab
          addEntity[POPUP].horizontalIndex += 1;
          rerenderEntity(world, addEntity);
          play("confirm", {}, soundSource(world, heroEntity, true));
        } else {
          play("deny", {}, soundSource(world, heroEntity, true));
          queueMessage(world, heroEntity, {
            line: createText("Not unlocked!", colors.silver, colors.black),
            orientation: "up",
            fast: false,
            delay: 0,
          });
        }
      } else if (tab === "load") {
        const erasing = selections.length === 1;
        const restorable = world.assertComponents(popupEntity, [RESTORABLE])[
          RESTORABLE
        ];
        const save = erasing
          ? getSaveSummaries().find((save) => save.id === restorable.saveId)
          : getSaveSummaries()[verticalIndex];

        if (erasing) {
          // stay at the same row, which then shows the next save
          setVerticalIndex(world, popupEntity, selections[0]);
          popTabSelection(world, popupEntity);
          restorable.saveId = undefined;
          if (save) {
            removeSaveSummary(save.id);
            world.metadata.eraseGame(save.id);
            play("die", { variant: 2 }, soundSource(world, heroEntity, true));
          }
        } else if (save && isLoadable(save)) {
          initiateLoad(world, popupEntity, heroEntity, save.id);
          play("confirm", {}, soundSource(world, heroEntity, true));
        } else {
          play("deny", {}, soundSource(world, heroEntity, true));
          queueMessage(world, heroEntity, {
            line: createText(
              save ? "Newer version!" : "No saves yet!",
              colors.silver,
              colors.black
            ),
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
          play("confirm", {}, soundSource(world, heroEntity, true));
        } else if (selectedLevel) {
          play("deny", {}, soundSource(world, heroEntity, true));
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
      } else if (tab === "chat" || tab === "server") {
        submitChat(world, heroEntity, selections.map(getKeyFromIndex));
      } else if (tab === "use") {
        if (addEntity && selections.length === 0) {
          pushTabSelection(world, addEntity);
          play("confirm", {}, soundSource(world, heroEntity, true));
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
          play("confirm", {}, soundSource(world, heroEntity, true));
        }
      }
    } else if (heroEntity[PLAYER].actionTriggered === "left") {
      heroEntity[PLAYER].actionTriggered = undefined;
      const tab = getTab(world, popupEntity);
      const questCompleted =
        isQuestCompleted(world, heroEntity, popupEntity) &&
        selections.length === 2;
      const forgeCompleted = tab === "forge" && selections.length === 4;

      if (tab === "server") {
        world.metadata.serverError = "";
        const config = (popupEntity[POPUP].server ||= {});
        if (!config.adding) {
          const address =
            world.metadata.listServers()[getVerticalIndex(world, popupEntity)];
          if (address) world.metadata.eraseServer(address);
        } else if (selections.length) {
          popupEntity[POPUP].selections[popupEntity[POPUP].horizontalIndex] =
            [];
        } else if (config.address) {
          delete config.address;
        } else {
          popupEntity[POPUP].server = {};
        }
      } else if (tab === "chat") {
        // clear chat
        popupEntity[POPUP].selections[popupEntity[POPUP].horizontalIndex] = [];
        play("back", {}, soundSource(world, heroEntity, true));
      } else if (tab === "use" && selections.length === 0) {
        popupEntity[POPUP].horizontalIndex =
          popupEntity[POPUP].tabs.indexOf("chat");
        play("open", {}, soundSource(world, heroEntity, true));
      } else if (tab === "load" && selections.length === 0) {
        // ask before erasing a saved game
        if (getSaveSummaries()[getVerticalIndex(world, popupEntity)]) {
          // the confirmation only shows the selected save in the first row
          world.assertComponents(popupEntity, [RESTORABLE])[RESTORABLE].saveId =
            getSaveSummaries()[getVerticalIndex(world, popupEntity)].id;
          pushTabSelection(world, popupEntity);
          setVerticalIndex(world, popupEntity, 0);
          play("confirm", {}, soundSource(world, heroEntity, true));
        }
      } else if (
        selections.length > 0 &&
        !questCompleted &&
        !forgeCompleted &&
        tab !== "class" &&
        tab !== "style"
      ) {
        // don't allow going back from completed screen or customizations
        const verticalIndex = popTabSelection(world, popupEntity);
        if (tab === "load")
          world.assertComponents(popupEntity, [RESTORABLE])[RESTORABLE].saveId =
            undefined;
        const previousIndex =
          verticalIndex === undefined || tab === "use" ? 0 : verticalIndex;
        setVerticalIndex(world, popupEntity, previousIndex);
        play("back", {}, soundSource(world, heroEntity, true));
      } else if (questCompleted || forgeCompleted) {
        // close final screens on escape
        closePopup(world, heroEntity, popupEntity);
        play("close", {}, soundSource(world, heroEntity, true));
      }
    }

    // mark as interacted
    heroEntity[MOVABLE].pendingOrientation = undefined;
    heroEntity[MOVABLE].lastInteraction = referenceGeneration;

    rerenderEntity(world, popupEntity);
  };

  const onUpdate = () => {
    for (const view of [...world.getEntities([POPUP, POSITION])]) {
      if (!view[POPUP].source) continue;
      const sourceEntity = world.getEntityById(view[POPUP].source);
      if (!sourceEntity) {
        const owner = world.getEntityByIdAndComponents(view[POPUP].owner, [
          PLAYER,
        ]);
        if (owner && owner[PLAYER].popup === world.getEntityId(view))
          closePopup(world, owner, view);
        disposeEntity(world, view, false, false);
        continue;
      }
      const source = world.getEntityComponents(sourceEntity, [POPUP, POSITION]);
      if (!source) continue;
      (source[POPUP].viewers ||= {})[view[POPUP].owner!] =
        world.getEntityId(view);
      if (source[POPUP].revision !== view[POPUP].sourceRevision) {
        bindPopupView(world, view, source);
        view[POPUP].horizontalIndex = 0;
        view[POPUP].verticalIndezes = source[POPUP].tabs.map(() => 0);
        view[POPUP].selections = source[POPUP].tabs.map(() => []);
        rerenderEntity(world, view);
      }
      if (
        view[POSITION].x !== source[POSITION].x ||
        view[POSITION].y !== source[POSITION].y
      )
        moveEntity(world, view, source[POSITION]);
    }
    for (const player of world.getEntities([
      ACTIONABLE,
      EQUIPPABLE,
      MOVABLE,
      PLAYER,
      RENDERABLE,
      INVENTORY,
      TOOLTIP,
    ]))
      updatePlayer(player);
  };
  return { onUpdate };
}
