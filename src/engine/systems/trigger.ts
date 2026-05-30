import { createLevel, preloadLevel, World } from "../ecs";
import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { Entity } from "ecs";
import { ACTIONABLE } from "../components/actionable";
import { MOVABLE } from "../components/movable";
import { TOOLTIP } from "../components/tooltip";
import { Inventory, INVENTORY } from "../components/inventory";
import { Item, ITEM, ItemStats, Material } from "../components/item";
import { LOCKABLE } from "../components/lockable";
import {
  addBackground,
  createDialog,
  createText,
  mana,
  none,
  strikethrough,
} from "../../game/assets/sprites";
import { SPRITE } from "../components/sprite";
import { LIGHT } from "../components/light";
import { rerenderEntity } from "./renderer";
import {
  disposeEntity,
  moveEntity,
  registerEntity,
  updateWalkable,
} from "./map";
import {
  canUnlock,
  castableSpell,
  castableSkill,
  getPendingTotem,
  getUnlockKey,
} from "./action";
import {
  createItemName,
  createItemText,
  frameHeight,
  frameWidth,
  getItemSprite,
  hookSpeed,
  queueMessage,
  rewardWidth,
} from "../../game/assets/utils";
import { canRevive, isRevivable, reviveEntity } from "./fate";
import {
  AuraSequence,
  ConditionSequence,
  Sequencable,
  SEQUENCABLE,
  SequenceState,
  SpellSequence,
  UnlockSequence,
  VisionSequence,
} from "../components/sequencable";
import { createSequence, getParticles, getSequence } from "./sequence";
import { shootArrow } from "./ballistics";
import { STATS } from "../components/stats";
import { TypedEntity } from "../entities";
import { entities } from "..";
import { BELONGABLE } from "../components/belongable";
import { add, copy, repeat, signedDistance } from "../../game/math/std";
import { ORIENTABLE, Orientation } from "../components/orientable";
import { CASTABLE, getEmptyCastable } from "../components/castable";
import { isDead, isEnemy, isNpc, triggerSpear } from "./damage";
import { canCast, chargeSlash, summonTotem } from "./magic";
import { EQUIPPABLE, slots } from "../components/equippable";
import {
  closePopup,
  existingItem,
  getDeal,
  getTab,
  getTabSelections,
  isInPopup,
  isInTab,
  isPopupAvailable,
  matchesItem,
  openPopup,
  pushTabSelection,
  setVerticalIndex,
} from "./popup";
import { Popup, POPUP } from "../components/popup";
import { addToInventory } from "./collect";
import { getAbilityStats } from "../../game/balancing/abilities";
import { PLAYER } from "../components/player";
import { isActionable, isControllable, isInteractable } from "./freeze";
import {
  assertIdentifier,
  assertIdentifierAndComponents,
  TEST_MODE,
} from "../utils";
import { colors } from "../../game/assets/colors";
import { NPC } from "../components/npc";
import { pickupOptions, play } from "../../game/sound";
import { LEVEL, LevelName } from "../components/level";
import { VIEWABLE } from "../components/viewable";
import { SPAWNABLE } from "../components/spawnable";
import { getSelectedLevel, levelConfig } from "../../game/levels";
import { calculateVision } from "./visibility";
import {
  centerLayer,
  displayedClasses,
  hairColors,
  pixelFrame,
} from "../../game/assets/pixels";
import {
  Conditionable,
  CONDITIONABLE,
  ConditionType,
} from "../components/conditionable";
import { SWIMMABLE } from "../components/swimmable";
import { getClassData } from "../../game/balancing/classes";
import { FRAGMENT } from "../components/fragment";
import { createItemAsDrop } from "./drop";
import { populateItems } from "../../bindings/creation";
import { TRACKABLE } from "../components/trackable";
import { getActiveViewable } from "../../bindings/hooks";
import { IDENTIFIABLE } from "../components/identifiable";
import { consumeItem, getItemConsumption } from "./consume";
import { getHookable } from "./fishing";
import { HOOKABLE } from "../components/hookable";
import { BAITABLE } from "../components/baitable";
import {
  getEquipmentStats,
  getItemStats,
} from "../../game/balancing/equipment";
import { ENTERABLE } from "../components/enterable";
import { FARMABLE } from "../components/farmable";
import { MOUNTABLE } from "../components/mountable";
import { isMounting, mountVessel, stopVessel } from "./vessel";

export const canWarp = (world: World, entity: Entity, warp: Entity) => {
  const currentLevel = world.metadata.gameEntity[LEVEL].name;
  const selectedLevel = getSelectedLevel(world, warp);

  if (isNpc(world, entity) || !selectedLevel || currentLevel === selectedLevel)
    return false;

  // allow warping everywhere else in test mode
  if (TEST_MODE) return true;

  return levelConfig[currentLevel].warps.includes(selectedLevel);
};

export const initiateWarp = (world: World, warp: Entity, entity: Entity) => {
  const levelName = getSelectedLevel(world, warp);
  if (!levelName) return;

  // don't set class stats in test mode
  const classIndex = warp[POPUP].tabs.indexOf("class");
  const classUpdated = classIndex !== -1;
  const styleIndex = warp[POPUP].tabs.indexOf("style");
  const styleUpdated = styleIndex !== -1;
  const selectedClass = classUpdated
    ? TEST_MODE
      ? displayedClasses[warp[POPUP].selections[classIndex][0] ?? 0]
      : "rogue"
    : entity[SPAWNABLE].classKey;
  const selectedStyle = styleUpdated
    ? hairColors[warp[POPUP].selections[styleIndex][0] ?? 0].color
    : entity[SPAWNABLE].hairColor;

  closePopup(world, entity, warp);
  const discovery = getSequence(world, warp, "discovery");
  if (discovery) {
    discovery.args.idle = none;
  }

  moveEntity(world, entity, warp[POSITION]);
  rerenderEntity(world, entity);
  entity[ORIENTABLE].facing = undefined;
  const previousMovable = entity[MOVABLE];
  const reference = world.assertByIdAndComponents(previousMovable.reference, [
    REFERENCE,
  ]);
  world.removeComponentFromEntity(entity as TypedEntity<"MOVABLE">, MOVABLE);

  warp[TOOLTIP].dialogs = [createDialog("Generating map...")];
  warp[TOOLTIP].changed = true;
  warp[TOOLTIP].override = "visible";

  createSequence<"vision", VisionSequence>(
    world,
    entity,
    "vision",
    "changeRadius",
    {
      light: { visibility: 1.5, brightness: 1.5, darkness: 0 },
      fast: false,
    }
  );

  setTimeout(() => {
    world.metadata.suspend();

    setTimeout(() => {
      // tag hero and related entities to new world
      const { size, generator, vision } = levelConfig[levelName];
      const light = calculateVision(vision);

      const inspectEntity = assertIdentifier(world, "inspect");
      const useEntity = assertIdentifier(world, "use");
      const spawnEntity = assertIdentifier(world, "spawn");
      const focusEntity = assertIdentifierAndComponents(world, "focus", [
        MOVABLE,
        SEQUENCABLE,
        POSITION,
      ]);
      const inventory = (entity[INVENTORY]?.items || []).map((id: number) =>
        world.assertById(id)
      );
      const entityFrames = Object.values(
        (entity[SEQUENCABLE].states || {}) as Sequencable["states"]
      ).map((state) => world.assertById(state.reference));
      const focusFrames = Object.values(
        (focusEntity[SEQUENCABLE].states || {}) as Sequencable["states"]
      ).map((state) => world.assertById(state.reference));
      const transferredEntities = [
        entity,
        ...inventory,
        inspectEntity,
        useEntity,
        spawnEntity,
        focusEntity,
        reference,
        ...getParticles(world, entity),
        ...entityFrames,
        ...getParticles(world, focusEntity),
        ...focusFrames,
      ];
      transferredEntities.forEach((target) => {
        world.addComponentToEntity(target, levelName, {});
        world.removeComponentFromEntity(
          target as TypedEntity<LevelName>,
          world.metadata.gameEntity[LEVEL].name
        );
      });

      // remove old world for now
      world.getEntities([]).forEach((target) => {
        if (transferredEntities.includes(target)) return;

        disposeEntity(world, target);
      });

      // generate new world
      const level = createLevel(world, levelName, size);
      generator(world);

      // reregister positioned entities
      transferredEntities.forEach((target) => {
        if (!target[POSITION]) return;

        registerEntity(world, target);
        rerenderEntity(world, target);
      });

      // reset hero
      const spawn = entity[POSITION];
      rerenderEntity(world, entity);
      focusEntity[MOVABLE].reference = world.getEntityId(level);
      const previousSpring = entity[VIEWABLE].spring;
      entity[VIEWABLE].spring = { duration: 0 };
      entity[VIEWABLE].active = true;
      entity[SPAWNABLE].position = { ...spawn };
      entity[SPAWNABLE].light = light;
      entity[ORIENTABLE].facing = undefined;

      const { stats, sprite, swimming } = getClassData(
        selectedClass,
        selectedStyle
      );

      if (styleUpdated) {
        entity[SPAWNABLE].hairColor = selectedStyle;
      }

      if (classUpdated) {
        entity[SPAWNABLE].classKey = selectedClass;

        // add collected stats in test mode
        if (TEST_MODE) {
          const testStats = [
            "armor",
            "power",
            "power",
            "resist",
            "haste",
            "damp",
            "thaw",
            "spike",
            "vision",
          ] as const;
          testStats.forEach((stat) => {
            stats[stat] += entity[STATS][stat];
          });
          stats.maxHp = Math.max(stats.maxHp, entity[STATS].maxHp);
          stats.maxMp = Math.max(stats.maxMp, entity[STATS].maxMp);
        }

        entity[STATS] = {
          hp: stats.maxHp,
          mp: 0,
          xp: 0,
          ...stats,
        };
      }

      if (styleUpdated || classUpdated) {
        entity[SPRITE] = sprite;
        entity[SWIMMABLE].swimming = swimming;
      }

      preloadLevel(world);

      setTimeout(() => {
        world.metadata.resume();

        setTimeout(() => {
          entity[VIEWABLE].spring = previousSpring;
          createSequence<"vision", VisionSequence>(
            world,
            entity,
            "vision",
            "changeRadius",
            {
              light,
              fast: false,
            }
          );
          previousMovable.orientations = [];
          previousMovable.pendingOrientation = undefined;
          world.addComponentToEntity(entity, MOVABLE, previousMovable);
        }, 1000);
      }, 1000);
    }, 500);
  }, 3000);
};

export const unlockDoor = (world: World, entity: Entity, lockable: Entity) => {
  // open doors without locks
  if (lockable[LOCKABLE].material === "wood") {
    openDoor(world, lockable);
    return;
  }

  // consume one key
  const keyEntity = getUnlockKey(world, entity, lockable);
  if (!keyEntity) return;
  spendItem(world, entity, { ...keyEntity[ITEM], amount: 1 });

  // start animation
  createSequence<"unlock", UnlockSequence>(
    world,
    lockable,
    "unlock",
    "doorUnlock",
    {
      origin: entity[POSITION],
      item: keyEntity[ITEM],
    }
  );

  rerenderEntity(world, lockable);
};

export const openDoor = (world: World, entity: Entity) => {
  entity[LOCKABLE].locked = false;
  entity[SPRITE] = entity[LOCKABLE].sprite || none;

  if (entity[LIGHT]) {
    if (entity[LOCKABLE].sprite) {
      entity[LIGHT].orientation = "left";
    } else {
      entity[LIGHT].darkness = 0;
    }
  }

  if (entity[ENTERABLE]) {
    entity[ENTERABLE].orientation = "down";
    entity[ENTERABLE].sprite = getItemSprite({
      materialized: entity[LOCKABLE].type,
      material: entity[LOCKABLE].material,
      element: entity[LOCKABLE].element,
    });
  }

  if (entity[TOOLTIP]) {
    entity[TOOLTIP].override = "hidden";
  }

  rerenderEntity(world, entity);
  updateWalkable(world, entity[POSITION]);
};

export const lockDoor = (world: World, entity: Entity) => {
  entity[LOCKABLE].locked = true;
  entity[SPRITE] = getItemSprite({
    materialized: "door",
    material: entity[LOCKABLE].material || "wood",
  });
  entity[LIGHT].orientation = undefined;
  entity[TOOLTIP].override = undefined;
  rerenderEntity(world, entity);
  updateWalkable(world, entity[POSITION]);
};

export const removeFromInventory = (
  world: World,
  entity: Entity,
  item: Entity
) => {
  const itemId = world.getEntityId(item);
  const itemIndex = entity[INVENTORY].items.indexOf(itemId);

  if (itemIndex === -1) {
    console.error(
      Date.now(),
      "Unable to remove item from inventory",
      item,
      entity
    );
    return;
  }

  if (EQUIPPABLE in entity) {
    for (const slot of slots) {
      if (item[ITEM][slot]) {
        entity[EQUIPPABLE][slot === "accessory" ? item[ITEM].accessory : slot] =
          undefined;
      }
    }
  }

  if (itemIndex !== -1) {
    entity[INVENTORY].items.splice(itemIndex, 1);
  }

  item[ITEM].carrier = undefined;

  if (world.getEntityId(entity)) {
    rerenderEntity(world, entity);
  }
};

export const performTrade = (
  world: World,
  entity: Entity,
  shop: TypedEntity<"POPUP" | "POSITION">
) => {
  const deal = getDeal(world, entity, shop);

  if (!deal) return;

  for (const priceItem of deal.prices) {
    spendItem(world, entity, priceItem);
  }

  // collect item
  const itemData = {
    [ITEM]: { ...deal.item, bound: false, carrier: world.getEntityId(entity) },
    [RENDERABLE]: { generation: 1 },
    [SPRITE]: getItemSprite(deal.item),
  };
  const itemEntity = deal.item.weapon
    ? entities.createSword(world, {
        ...itemData,
        [SEQUENCABLE]: { states: {} },
        [ORIENTABLE]: {},
      })
    : deal.item.accessory === "compass"
    ? entities.createCompass(world, {
        ...itemData,
        [ORIENTABLE]: {},
        [SEQUENCABLE]: { states: {} },
        [TRACKABLE]: {},
      })
    : entities.createItem(world, itemData);

  // drop XP instead of collecting
  if (itemEntity[ITEM].stat === "xp" && !itemEntity[ITEM].material) {
    createItemAsDrop(world, copy(shop[POSITION]), entities.createItem, {
      ...itemData,
      [SPRITE]: none,
    });
  } else {
    addToInventory(world, entity, itemEntity, itemData[ITEM].amount);
  }

  // reduce stock
  deal.stock -= 1;

  // remove from storage
  const carrierEntity = world.getEntityByIdAndComponents(deal.carrier, [
    INVENTORY,
  ]);
  if (carrierEntity) {
    for (const itemId of carrierEntity[INVENTORY].items) {
      const storedItem = world.assertByIdAndComponents(itemId, [ITEM]);

      if (!matchesItem(world, deal.item, storedItem[ITEM])) continue;

      storedItem[ITEM].amount -= itemEntity[ITEM].amount;

      if (storedItem[ITEM].amount <= 0) {
        removeFromInventory(world, carrierEntity, storedItem);
        disposeEntity(world, storedItem);
      }
    }
  }

  // play sound
  if (!(deal.item.stat && !deal.item.material)) {
    queueMessage(world, entity, {
      line: createText(
        `${deal.item.amount}x ${getItemSprite(deal.item).name}`,
        colors.silver,
        colors.black
      ),
      orientation: "up",
      fast: false,
      delay: 0,
    });
    play("pickup", pickupOptions[(deal.item.stackable || deal.item.consume)!]);
  }

  rerenderEntity(world, shop);
};

export const spendItem = (
  world: World,
  entity: Entity,
  item: Omit<Item, "bound" | "carrier">
) => {
  if (item.stat && !item.material) {
    if (!entity[STATS] || entity[STATS][item.stat] < item.amount) {
      console.warn("Unable to spend stat", item, "for entity", entity, "!");
      throw Error("Unable to spend stat!");
    }
    entity[STATS][item.stat] -= item.amount;
    return;
  }

  const inventoryItems =
    (entity[INVENTORY] as Inventory)?.items.map((itemId) =>
      world.assertByIdAndComponents(itemId, [ITEM])
    ) || [];
  const itemEntity = inventoryItems.findLast((itemEntity) =>
    matchesItem(world, item, itemEntity[ITEM])
  );

  if (!itemEntity || itemEntity[ITEM].amount < item.amount) {
    console.warn("Unable to spend item", item, "for entity", entity, "!");
    throw Error("Unable to spend item!");
  }

  if (itemEntity[ITEM].amount === item.amount) {
    if (entity[EQUIPPABLE]) {
      for (const slot of slots) {
        if (itemEntity[ITEM][slot]) {
          entity[EQUIPPABLE][slot] = undefined;
        }
      }
    }
    removeFromInventory(world, entity, itemEntity);
    disposeEntity(world, itemEntity);
  } else {
    itemEntity[ITEM].amount -= item.amount;
  }
};

const conditionConfig: Record<
  ConditionType,
  {
    sequence: SequenceState<{}>["name"];
    modifier?: "range" | "duration";
    stat?: keyof ItemStats;
  }
> = {
  zap: { sequence: "zapCondition", stat: "range", modifier: "duration" },
  block: { sequence: "blockCondition", stat: "absorb", modifier: "duration" },
  axe: { sequence: "toolCondition", stat: "logging" },
  shovel: { sequence: "shovelCondition", stat: "farming" },
  pickaxe: { sequence: "toolCondition", stat: "mining" },
  hook: { sequence: "hookCondition", stat: "fishing", modifier: "range" },
};

export const applyCondition = (
  world: World,
  entity: Entity,
  item: Entity,
  type: ConditionType,
  material: Material,
  modifier: number,
  amount: number
) => {
  const generation = world.metadata.gameEntity[RENDERABLE].generation;
  (entity[CONDITIONABLE] as Conditionable)[type] = {
    modifier,
    item: world.getEntityId(item),
    generation,
    amount,
  };

  createSequence<"condition", ConditionSequence>(
    world,
    entity,
    "condition",
    conditionConfig[type].sequence,
    {
      modifier,
      material,
    }
  );
};

export const castConditionable = (
  world: World,
  entity: Entity,
  item: TypedEntity<"ITEM">
) => {
  const condition = item[ITEM].skill || item[ITEM].tool;
  const material = item[ITEM].material;
  const entityId = world.getEntityId(entity);

  if (
    !material ||
    (condition !== "zap" &&
      condition !== "block" &&
      condition !== "axe" &&
      condition !== "pickaxe" &&
      condition !== "hook")
  )
    return;

  // unequip tools if active
  const hookCondition = (entity[CONDITIONABLE] as Conditionable).hook;
  if (condition === "axe" && entity[CONDITIONABLE].axe) {
    delete entity[CONDITIONABLE].axe;
    return;
  } else if (condition === "pickaxe" && entity[CONDITIONABLE].pickaxe) {
    delete entity[CONDITIONABLE].pickaxe;
    return;
  } else if (condition === "hook" && hookCondition) {
    const hookSequence = getSequence(world, entity, "condition");
    if (!hookCondition.orientation) {
      // restore charge if never tossed
      addToInventory(
        world,
        entity,
        { [ITEM]: { stackable: "worm", amount: 1 } },
        1
      );
      delete entity[CONDITIONABLE].hook;
    } else if (
      hookSequence &&
      hookCondition.amount === hookCondition.modifier &&
      hookCondition.orientation
    ) {
      // catch wire
      hookSequence.args.modifier = 0;
      hookCondition.generation = hookSequence.elapsed;

      // catch entity
      const baitEntity = world
        .getEntities([BAITABLE, POSITION])
        .find((entity) => entity[BAITABLE].caster === entityId);

      const hookable = baitEntity && getHookable(world, baitEntity[POSITION]);
      if (hookable) {
        // ensure target is movable
        if (!(MOVABLE in hookable)) {
          world.addComponentToEntity(hookable, MOVABLE, {
            orientations: [],
            reference: world.getEntityId(world.metadata.gameEntity),
            spring: {
              duration: hookSpeed,
            },
            lastInteraction: 0,
            flying: false,
            swimming: false,
          });
        }

        hookable[HOOKABLE].hooked = undefined;
        hookable[HOOKABLE].catching = entityId;
        hookable[HOOKABLE].escaping = false;
      }
    } else {
      // stow hook
      delete entity[CONDITIONABLE].hook;
    }

    return;
  }

  const itemStats = getItemStats(item[ITEM]);

  // consume charges for active skills
  if (condition === "zap" || condition === "block") {
    spendItem(world, entity, { stackable: "charge", amount: 1 });
  } else if (condition === "hook") {
    spendItem(world, entity, { stackable: "worm", amount: 1 });
  }

  const modifierStat = conditionConfig[condition].modifier;
  const conditionStat = conditionConfig[condition].stat;
  applyCondition(
    world,
    entity,
    item,
    condition,
    material,
    modifierStat ? itemStats[modifierStat] : 0,
    conditionStat ? itemStats[conditionStat] : 1
  );
};

export const digShovel = (
  world: World,
  entity: Entity,
  tool: TypedEntity<"ITEM">
) => {
  const toolStats = getEquipmentStats(tool[ITEM], entity[NPC]?.type);
  applyCondition(
    world,
    entity,
    tool,
    "shovel",
    tool[ITEM].material!,
    0,
    toolStats.farming
  );
};

export const canPlant = (world: World, entity: Entity, plant: Entity) =>
  plant[FARMABLE]?.watered;

export const completeQuest = (world: World, entity: Entity, target: Entity) => {
  const popup = target[POPUP] as Popup;
  const choiceIndex = getTabSelections(world, target)[1];

  // apply selected choice
  const choice = popup.choices[choiceIndex];
  if (choice) {
    populateItems(world, entity as TypedEntity<"INVENTORY" | "POSITION">, [
      { ...choice, bound: false },
    ]);
    queueMessage(world, entity, {
      line: createText(
        `${choice.amount}x ${getItemSprite(choice).name}`,
        colors.silver,
        colors.black
      ),
      orientation: "up",
      fast: false,
      delay: 0,
    });
    play("pickup", pickupOptions[(choice.stackable || choice.consume)!]);
  }

  popup.deals.forEach((_, index) => {
    setVerticalIndex(world, target, index);
    performTrade(world, entity, target as TypedEntity<"POPUP" | "POSITION">);
  });
  setVerticalIndex(world, target, 0);

  popup.lines = [
    centerLayer(
      [
        ...repeat(
          [],
          Math.floor(
            (frameHeight - 2 - popup.deals.length - 4 - (choice ? 1 : 0)) / 2
          )
        ),
        createText("Quest complete!"),
        [],
        ...pixelFrame(
          rewardWidth,
          popup.deals.length + 2 + (choice ? 1 : 0),
          colors.lime,
          "solid",
          [
            ...(choice ? [choice] : []),
            ...popup.deals.map((deal) => deal.item),
          ].map((item) => {
            const text = createItemText(item);
            return strikethrough([
              ...text,
              ...repeat(none, rewardWidth - text.length - 2),
            ]);
          }),
          createText("Reward", colors.lime)
        ),
      ],
      frameWidth - 2
    ),
  ];
  popup.deals = [];
  popup.choices = [];
  popup.targets = [];
  popup.focuses = [];
};

export const castSpell = (
  world: World,
  entity: TypedEntity<"POSITION">,
  item: TypedEntity<"ITEM">,
  orientation?: Orientation
) => {
  // use overriden damage values for NPCs and mobs
  const castableEntity =
    (entity[FRAGMENT] &&
      world.getEntityByIdAndComponents(entity[FRAGMENT].structure, [
        BELONGABLE,
        STATS,
        INVENTORY,
      ])) ||
    (entity as TypedEntity<"BELONGABLE">);

  const spellStats = getAbilityStats(item[ITEM], castableEntity[NPC]?.type);
  const targetOrientation = orientation || entity[ORIENTABLE]?.facing || "up";

  const spellEntity = entities.createSpell(world, {
    [BELONGABLE]: { faction: castableEntity[BELONGABLE].faction },
    [CASTABLE]: {
      ...getEmptyCastable(world, castableEntity),
      ...spellStats,
    },
    [ORIENTABLE]: { facing: targetOrientation },
    [POSITION]: copy(entity[POSITION]),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
  });

  if (item[ITEM].spell === "beam") {
    createSequence<"spell", SpellSequence>(
      world,
      spellEntity,
      "spell",
      "castBeam1",
      {
        progress: 0,
        range: spellStats.range,
        duration: spellStats.duration,
        areas: [],
        material: item[ITEM].material,
        element: item[ITEM].element,
      }
    );
    play("beam", { variant: 3 });
  } else if (item[ITEM].spell === "bolt" || item[ITEM].skill === "wand") {
    // ensure wand proccing only once like melee weapons
    if (item[ITEM].skill === "wand") {
      spellEntity[CASTABLE].cascade = world.getEntityId(entity);
    }

    createSequence<"aura", AuraSequence>(
      world,
      spellEntity,
      "aura",
      "castBolt1",
      {
        progress: 0,
        range: spellStats.range,
        duration: spellStats.duration,
        areas: [],
        material: item[ITEM].material,
        element: item[ITEM].element,
      }
    );
    // TODO: add sound
  } else if (item[ITEM].spell === "blast") {
    createSequence<"spell", SpellSequence>(
      world,
      spellEntity,
      "spell",
      "castBlast",
      {
        progress: 0,
        range: spellStats.range,
        duration: spellStats.duration,
        areas: [],
        material: item[ITEM].material,
        element: item[ITEM].element,
      }
    );
    // TODO: add sound
  } else if (item[ITEM].spell === "trap") {
    createSequence<"aura", AuraSequence>(
      world,
      spellEntity,
      "aura",
      "trapAura",
      {
        progress: 0,
        range: spellStats.range,
        duration: spellStats.duration,
        areas: [],
        material: item[ITEM].material,
        element: item[ITEM].element,
      }
    );
    // TODO: add sound
  } else if (item[ITEM].spell === "dash") {
    createSequence<"spell", SpellSequence>(
      world,
      spellEntity,
      "spell",
      "castDash",
      {
        progress: 0,
        range: spellStats.range,
        duration: spellStats.duration,
        areas: [],
        material: item[ITEM].material,
        element: item[ITEM].element,
      }
    );
    // TODO: add sound
  } else if (item[ITEM].spell === "wave") {
    createSequence<"spell", SpellSequence>(
      world,
      spellEntity,
      "spell",
      "castWave1",
      {
        memory: { innerRadius: 0 },
        progress: 0,
        range: spellStats.range,
        duration: spellStats.duration,
        areas: [],
        material: item[ITEM].material,
        element: item[ITEM].element,
      }
    );
    play("wave", { intensity: spellStats.duration / 7 });
  }

  if (
    castableEntity[STATS] &&
    !isEnemy(world, castableEntity) &&
    item[ITEM].skill !== "wand"
  ) {
    castableEntity[STATS].mp -= 1;
    rerenderEntity(world, castableEntity);
  }
};

export const castSkill = (world: World, entity: Entity, skill: Entity) => {
  if (skill[ITEM].skill === "bow") {
    shootArrow(world, entity, skill);
  } else if (skill[ITEM].skill === "spear") {
    triggerSpear(world, entity, skill, entity[ORIENTABLE]?.facing);
  } else if (skill[ITEM].skill === "wand") {
    castSpell(
      world,
      entity as TypedEntity<"POSITION">,
      skill as TypedEntity<"ITEM">
    );
  } else if (skill[ITEM].skill === "slash") {
    chargeSlash(world, entity, skill);
  } else if (skill[ITEM].skill === "totem") {
    summonTotem(world, entity, skill);
  }
};

export default function setupTrigger(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const size = world.metadata.gameEntity[LEVEL].size;
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation || world.metadata.initial) return;

    referenceGenerations = generation;

    for (const entity of world.getEntities([
      ACTIONABLE,
      MOVABLE,
      POSITION,
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

      // skip if not actionable, not triggered, already interacted or not controllable
      if (
        entity[MOVABLE].lastInteraction === entityReference ||
        (!isActionable(world, entity) && !isDead(world, entity)) ||
        !(
          entity[ACTIONABLE].spellTriggered ||
          entity[ACTIONABLE].skillTriggered ||
          [
            "inspect",
            "interact",
            "equip",
            "use",
            "map",
            "gear",
            "stats",
            "content",
            "chat",
          ].includes(entity[PLAYER]?.actionTriggered!)
        )
      )
        continue;

      // mark as interacted and update orientation, except certain content clicks
      if (
        !entity[PLAYER]?.actionTriggered ||
        !["content", "chat"].includes(entity[PLAYER].actionTriggered)
      ) {
        entity[MOVABLE].lastInteraction = entityReference;
      }

      // prevent sliding away while in popup
      const mount = world.getEntityByIdAndComponents(entity[PLAYER]?.mount, [
        MOUNTABLE,
        MOVABLE,
      ]);
      if (isMounting(world, entity) && mount) {
        stopVessel(world, mount);
      }

      // remove dangling actions
      if (
        (entity[ACTIONABLE].spellTriggered ||
          entity[ACTIONABLE].skillTriggered) &&
        !isInteractable(world, entity)
      ) {
        entity[ACTIONABLE].spellTriggered = false;
        entity[ACTIONABLE].skillTriggered = false;
        continue;
      }

      if (entity[ORIENTABLE]) {
        entity[ORIENTABLE].facing =
          entity[MOVABLE].orientations[0] ||
          entity[MOVABLE].pendingOrientation ||
          entity[ORIENTABLE].facing;
      }

      const unlockEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].unlock,
        [LOCKABLE, POSITION]
      );
      const plantEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].plant,
        [FARMABLE, POSITION]
      );
      const mountEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].mount,
        [MOUNTABLE, POSITION]
      );
      const popupEntity = world.getEntityById(entity[ACTIONABLE].popup);
      const spawnEntity = world.getEntityById(entity[ACTIONABLE].spawn);
      const spellEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].spell,
        [ITEM]
      );
      const skillEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].skill,
        [ITEM]
      );
      const toolEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].tool,
        [ITEM]
      );

      const currentPopup = world.getEntityByIdAndComponents(
        entity[PLAYER]?.popup,
        [POPUP]
      );
      const useEntity = assertIdentifierAndComponents(world, "use", [
        POPUP,
        VIEWABLE,
      ]);

      // remap quick screen clicks
      if (
        entity[PLAYER]?.actionTriggered === "content" &&
        currentPopup?.[IDENTIFIABLE]?.name === "use"
      ) {
        const contentIndex = entity[PLAYER].contentTriggered;
        const offsetIndex = entity[PLAYER].offsetTriggered;
        const selections = getTabSelections(world, currentPopup);
        const tab = getTab(world, currentPopup);

        if (
          contentIndex === undefined ||
          offsetIndex === undefined ||
          tab !== "use" ||
          selections.length === 2
        ) {
          // ignore
          continue;
        } else if (contentIndex === 0 && offsetIndex >= 10) {
          entity[PLAYER].actionTriggered = "inspect";
        } else if (contentIndex === 2 && offsetIndex >= 10) {
          entity[PLAYER].actionTriggered = "equip";
        } else if (contentIndex === 4 && offsetIndex >= 10) {
          entity[PLAYER].actionTriggered = "gear";
        } else if (contentIndex === 6 && offsetIndex >= 10) {
          entity[PLAYER].actionTriggered = "stats";
        } else if (contentIndex === 8 && offsetIndex >= 10) {
          entity[PLAYER].actionTriggered = "map";
        } else if (contentIndex % 2 === 0) {
          const rowIndex = (contentIndex - (contentIndex % 2)) / 2;
          const columnIndex = Math.floor(offsetIndex / 5);
          const index = rowIndex * 2 + columnIndex;
          const hotkey = index >= 9 ? 0 : index + 1;

          entity[PLAYER].actionTriggered = "use";
          entity[PLAYER].contentTriggered = hotkey;
        } else if (TEST_MODE) {
          // trigger chat in test mode only
          entity[PLAYER].actionTriggered = "chat";
        } else continue;

        // mark interaction
        if (entity[PLAYER].actionTriggered !== "use") {
          entity[PLAYER].contentTriggered = undefined;
          entity[PLAYER].offsetTriggered = undefined;
        }

        entity[MOVABLE].lastInteraction = entityReference;
      }

      if (
        entity[PLAYER]?.actionTriggered === "inspect" ||
        entity[PLAYER]?.actionTriggered === "map" ||
        entity[PLAYER]?.actionTriggered === "equip" ||
        entity[PLAYER]?.actionTriggered === "gear" ||
        entity[PLAYER]?.actionTriggered === "stats" ||
        entity[PLAYER]?.actionTriggered === "chat" ||
        entity[PLAYER]?.actionTriggered === "use"
      ) {
        const targetTab = entity[PLAYER].actionTriggered;
        const contentIndex = entity[PLAYER].contentTriggered;
        const offsetIndex = entity[PLAYER].offsetTriggered;
        const tabIndex = entity[PLAYER].tabTriggered;

        entity[PLAYER].actionTriggered = undefined;
        entity[PLAYER].contentTriggered = undefined;
        entity[PLAYER].offsetTriggered = undefined;
        entity[PLAYER].tabTriggered = undefined;

        // skip trying to open missing map
        if (targetTab === "map" && !entity[EQUIPPABLE]?.map) {
          if (currentPopup === useEntity && isInTab(world, entity, "use")) {
            queueMessage(world, entity, {
              line: addBackground(
                [
                  ...createText("Need ", colors.silver),
                  ...createItemName({
                    accessory: "map",
                    material: "gold",
                  }),
                  ...createText("!", colors.silver),
                ],
                colors.black
              ),
              orientation: "up",
              fast: false,
              delay: 0,
            });
          }
          continue;
        } else if (targetTab === "use" && contentIndex !== undefined) {
          // prevent while viewing other popups or editing
          const hotKey = contentIndex;
          const selections = getTabSelections(world, useEntity);
          if (
            (currentPopup && currentPopup !== useEntity) ||
            selections.length === 2
          ) {
            continue;
          }

          // handle edit selections
          if (selections.length === 1) {
            if (entity[PLAYER].quickItems[hotKey]) {
              // clear previous selection
              delete entity[PLAYER].quickItems[hotKey];
              rerenderEntity(world, useEntity);
            } else {
              pushTabSelection(world, useEntity, hotKey);
            }
            continue;
          }

          // handle hotkey clicks
          const hotItem = entity[PLAYER].quickItems[hotKey];
          const inventoryItem = hotItem && existingItem(world, entity, hotItem);
          const consumption =
            inventoryItem && getItemConsumption(inventoryItem);
          consumeItem(world, entity, consumption);
          rerenderEntity(world, useEntity);
          continue;
        } else if (targetTab === "chat") {
          if (entity[TOOLTIP]) {
            // clear previous chat
            entity[TOOLTIP].dialogs = [];
            entity[TOOLTIP].changed = true;
            entity[TOOLTIP].override = undefined;
            entity[TOOLTIP].enemy = false;
          }
        }

        // close any popup but preserve selections
        const currentTab = getTab(world, useEntity);
        const targetIndex = useEntity[POPUP].tabs.indexOf(targetTab);
        const shouldClose =
          currentPopup &&
          (targetTab === currentTab ||
            currentPopup !== useEntity ||
            (targetTab === "use" && currentTab !== "use"));

        if (currentPopup && shouldClose) {
          const selections = currentPopup[POPUP].selections;
          closePopup(world, entity, currentPopup);

          // ensure popup was not removed when closed, or reset index
          if (currentPopup[POPUP]) {
            if (currentPopup === useEntity) {
              currentPopup[POPUP].verticalIndezes[targetIndex] = 0;
            } else {
              currentPopup[POPUP].selections = selections;
            }
          }
        }

        const shouldOpen = currentPopup !== useEntity;

        useEntity[POPUP].horizontalIndex = targetIndex;
        rerenderEntity(world, useEntity);

        if (shouldOpen) {
          const inspectEntity = assertIdentifier(world, "inspect");

          // move viewpoints
          const viewables = world.getEntities([VIEWABLE, POSITION]);
          const viewable = getActiveViewable(viewables);
          moveEntity(world, inspectEntity, viewable[POSITION]);
          moveEntity(
            world,
            useEntity,
            add(viewable[POSITION], { x: 0, y: (frameHeight + 1) / 2 })
          );
          openPopup(world, entity, useEntity, true);
        }

        if (targetTab === "chat") {
          // reset history index
          setVerticalIndex(world, useEntity, 0);

          // handle typing command slash
          if (
            contentIndex !== undefined &&
            offsetIndex !== undefined &&
            tabIndex !== undefined
          ) {
            entity[PLAYER].actionTriggered = "type";
            entity[PLAYER].contentTriggered = contentIndex;
            entity[PLAYER].offsetTriggered = offsetIndex;
            entity[PLAYER].tabTriggered = tabIndex;
            continue;
          }
        }

        entity[MOVABLE].lastInteraction = entityReference;
      } else if (entity[PLAYER]?.actionTriggered === "interact") {
        entity[PLAYER].actionTriggered = undefined;

        if (!world.metadata.interact.active) {
          // skip
        } else if (
          spawnEntity &&
          isRevivable(world, spawnEntity) &&
          canRevive(world, spawnEntity, entity)
        ) {
          reviveEntity(world, spawnEntity, entity);
          world.metadata.interact.last = world.getEntityId(spawnEntity);
        } else if (unlockEntity) {
          if (canUnlock(world, entity, unlockEntity)) {
            unlockDoor(world, entity, unlockEntity);
            world.metadata.interact.last = world.getEntityId(unlockEntity);
          } else {
            queueMessage(world, entity, {
              line: addBackground(
                [
                  ...createText("Need ", colors.silver),
                  ...createItemName({
                    consume: "key",
                    material: unlockEntity[LOCKABLE].material,
                    element: unlockEntity[LOCKABLE].element,
                  }),
                  ...createText("!", colors.silver),
                ],
                colors.black
              ),
              orientation:
                signedDistance(
                  entity[POSITION].y,
                  unlockEntity[POSITION].y,
                  size
                ) >= 0
                  ? "up"
                  : "down",
              fast: false,
              delay: 0,
            });
            continue;
          }
        } else if (plantEntity) {
          if (canPlant(world, entity, plantEntity)) {
            const targetIndex = useEntity[POPUP].tabs.indexOf("plant");
            useEntity[POPUP].horizontalIndex = targetIndex;
            rerenderEntity(world, useEntity);

            const inspectEntity = assertIdentifier(world, "inspect");

            // move viewpoints
            const viewables = world.getEntities([VIEWABLE, POSITION]);
            const viewable = getActiveViewable(viewables);
            moveEntity(world, inspectEntity, viewable[POSITION]);
            moveEntity(
              world,
              useEntity,
              add(viewable[POSITION], { x: 0, y: (frameHeight + 1) / 2 })
            );
            openPopup(world, entity, useEntity, true);
            world.metadata.interact.last = world.getEntityId(plantEntity);
          } else {
            queueMessage(world, entity, {
              line: addBackground(
                [
                  ...createText("Need ", colors.silver),
                  ...createItemName({
                    consume: "bucket",
                    material: "iron",
                    element: "water",
                  }),
                  ...createText("!", colors.silver),
                ],
                colors.black
              ),
              orientation: "up",
              fast: false,
              delay: 0,
            });
            continue;
          }
        } else if (mountEntity) {
          mountVessel(world, entity, mountEntity);
          world.metadata.interact.last = world.getEntityId(mountEntity);
        } else if (popupEntity && isPopupAvailable(world, popupEntity)) {
          openPopup(world, entity, popupEntity);
          world.metadata.interact.last = world.getEntityId(popupEntity);
        }

        world.metadata.interact.active = undefined;
      } else if (entity[ACTIONABLE].spellTriggered) {
        entity[ACTIONABLE].spellTriggered = false;

        if (spellEntity) {
          const castReady = canCast(world, entity, spellEntity);

          if (
            castReady &&
            castableSpell(
              world,
              entity as TypedEntity<"INVENTORY">,
              spellEntity
            )
          ) {
            castSpell(world, entity, spellEntity);
          } else if (!isInPopup(world, entity)) {
            queueMessage(world, entity, {
              line: addBackground(
                castReady
                  ? [
                      ...createText("Need ", colors.silver),
                      mana,
                      ...createText("MP", colors.blue),
                      ...createText("!", colors.silver),
                    ]
                  : createText("Not ready!", colors.silver),
                colors.black
              ),
              orientation: "up",
              fast: false,
              delay: 0,
            });
            continue;
          }
        }
      } else if (entity[ACTIONABLE].skillTriggered) {
        entity[ACTIONABLE].skillTriggered = false;

        // mark tool as equipped if no skill available
        if (!entity[ACTIONABLE].toolEquipped && !skillEntity && toolEntity) {
          entity[ACTIONABLE].toolEquipped = true;
        }

        if (skillEntity && !entity[ACTIONABLE].toolEquipped) {
          if (
            !castableSkill(
              world,
              entity as TypedEntity<"INVENTORY" | "POSITION">,
              skillEntity
            )
          ) {
            if (
              !isInPopup(world, entity) &&
              skillEntity[ITEM].tool !== "axe" &&
              skillEntity[ITEM].tool !== "shovel" &&
              skillEntity[ITEM].tool !== "pickaxe" &&
              !(
                skillEntity[ITEM].skill === "zap" && entity[CONDITIONABLE]?.zap
              ) &&
              !(
                skillEntity[ITEM].skill === "block" &&
                entity[CONDITIONABLE]?.block
              ) &&
              !(
                skillEntity[ITEM].skill === "totem" &&
                getPendingTotem(world, entity)
              )
            ) {
              queueMessage(world, entity, {
                line: addBackground(
                  [
                    ...createText("Need ", colors.silver),
                    ...createItemName(
                      skillEntity[ITEM].skill === "slash" &&
                        !entity[EQUIPPABLE]?.weapon
                        ? {
                            weapon: "sword",
                            material: "wood",
                          }
                        : {
                            stackable:
                              skillEntity[ITEM].skill === "bow"
                                ? "arrow"
                                : "charge",
                          }
                    ),
                    ...createText("!", colors.silver),
                  ],
                  colors.black
                ),
                orientation: "up",
                fast: false,
                delay: 0,
              });
            }
            continue;
          } else if (
            skillEntity[ITEM].skill === "zap" ||
            skillEntity[ITEM].skill === "block"
          ) {
            castConditionable(world, entity, skillEntity);
          } else if (skillEntity[ITEM].skill) {
            castSkill(world, entity, skillEntity);
          }
        } else if (toolEntity && entity[ACTIONABLE].toolEquipped) {
          if (
            !castableSkill(
              world,
              entity as TypedEntity<"INVENTORY" | "POSITION">,
              toolEntity
            ) &&
            isControllable(world, entity)
          ) {
            if (
              toolEntity[ITEM].tool === "hook" &&
              !entity[CONDITIONABLE]?.hook
            ) {
              queueMessage(world, entity, {
                line: addBackground(
                  [
                    ...createText("Need ", colors.silver),
                    ...createItemName({
                      stackable: "worm",
                    }),
                    ...createText("!", colors.silver),
                  ],
                  colors.black
                ),
                orientation: "up",
                fast: false,
                delay: 0,
              });
            }
            continue;
          }

          if (
            toolEntity[ITEM].tool === "axe" ||
            toolEntity[ITEM].tool === "pickaxe" ||
            toolEntity[ITEM].tool === "hook"
          ) {
            castConditionable(world, entity, toolEntity);
          } else if (toolEntity[ITEM].tool === "shovel") {
            digShovel(world, entity, toolEntity);
          }
        }
      }
    }
  };

  return { onUpdate };
}
