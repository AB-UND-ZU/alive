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
import { ORIENTABLE } from "../components/orientable";
import { CASTABLE, getEmptyCastable } from "../components/castable";
import { isDead, isEnemy, isNpc } from "./damage";
import { canCast, chargeSlash, summonTotem } from "./magic";
import { EQUIPPABLE } from "../components/equippable";
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
import { isActionable } from "./freeze";
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
  consumeCharge(world, entity, keyEntity[ITEM]);

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

  const equipment = item[ITEM].equipment;
  if (EQUIPPABLE in entity && entity[EQUIPPABLE][equipment] === itemId) {
    entity[EQUIPPABLE][equipment] = undefined;
  } else if (itemIndex === -1) {
    console.error(
      Date.now(),
      "Unable to remove item from inventory",
      item,
      entity
    );
    return;
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
    // remove stats and items
    if (priceItem.stat) {
      entity[STATS][priceItem.stat] -= priceItem.amount;
    } else {
      const tradedId = (entity[INVENTORY] as Inventory).items.find((itemId) => {
        const itemEntity = world.assertByIdAndComponents(itemId, [ITEM]);
        return matchesItem(world, itemEntity[ITEM], priceItem);
      });

      if (tradedId) {
        const tradedEntity = world.assertByIdAndComponents(tradedId, [ITEM]);

        if (
          (priceItem.stackable || priceItem.consume) &&
          tradedEntity[ITEM].amount > priceItem.amount
        ) {
          tradedEntity[ITEM].amount -= priceItem.amount;
        } else {
          if (tradedEntity[ITEM].equipment) {
            entity[EQUIPPABLE][tradedEntity[ITEM].equipment] = undefined;
          }
          removeFromInventory(world, entity, tradedEntity);
          disposeEntity(world, tradedEntity);
        }
      } else {
        console.error("Unable to perform trade!", {
          entity,
          shop,
          item: priceItem,
        });

        return;
      }
    }
  }

  // collect item
  const itemData = {
    [ITEM]: { ...deal.item, bound: false, carrier: world.getEntityId(entity) },
    [RENDERABLE]: { generation: 1 },
    [SPRITE]: getItemSprite(deal.item),
  };
  const itemEntity =
    deal.item.equipment === "weapon"
      ? entities.createSword(world, {
          ...itemData,
          [SEQUENCABLE]: { states: {} },
          [ORIENTABLE]: {},
        })
      : deal.item.stackable === "note"
      ? entities.createNote(world, {
          ...itemData,
          [SEQUENCABLE]: { states: {} },
          [POPUP]: {
            active: false,
            verticalIndezes: [0],
            horizontalIndex: 0,
            selections: [],
            deals: [],
            recipes: [],
            lines: [],
            targets: [],
            focuses: [],
            choices: [],
            viewpoint: world.getEntityId(entity),
            tabs: ["info"],
          },
        })
      : deal.item.equipment === "compass"
      ? entities.createCompass(world, {
          ...itemData,
          [ORIENTABLE]: {},
          [SEQUENCABLE]: { states: {} },
          [TRACKABLE]: {},
        })
      : entities.createItem(world, itemData);

  // drop XP instead of collecting
  if (itemEntity[ITEM].stat === "xp") {
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
  if (!deal.item.stat) {
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

export const consumeCharge = (
  world: World,
  entity: Entity,
  item: Pick<Item, "stackable" | "consume" | "material">
) => {
  // consume one stackable from inventory
  const chargeId = entity[INVENTORY].items.findLast((itemId: number) => {
    const itemEntity = world.assertByIdAndComponents(itemId, [ITEM]);
    return (
      (item.stackable && itemEntity[ITEM].stackable === item.stackable) ||
      (item.consume &&
        itemEntity[ITEM].consume === item.consume &&
        itemEntity[ITEM].material === item.material)
    );
  });
  const chargeEntity = world.assertByIdAndComponents(chargeId, [ITEM]);
  if (!isEnemy(world, entity)) {
    if (chargeEntity[ITEM].amount === 1) {
      removeFromInventory(world, entity, chargeEntity);
      disposeEntity(world, chargeEntity);
    } else {
      chargeEntity[ITEM].amount -= 1;
    }
  }
};

const conditionConfig: Record<
  ConditionType,
  {
    sequence: SequenceState<{}>["name"];
    duration: number;
    stat?: keyof ItemStats;
  }
> = {
  zap: { sequence: "zapCondition", stat: "range", duration: 50 },
  block: { sequence: "blockCondition", stat: "absorb", duration: 10 },
  axe: { sequence: "axeCondition", duration: 0 },
  pickaxe: { sequence: "axeCondition", duration: 0 },
};

export const applyCondition = (
  world: World,
  entity: Entity,
  item: Entity,
  type: ConditionType,
  material: Material,
  duration: number,
  amount: number
) => {
  const generation = world.metadata.gameEntity[RENDERABLE].generation;
  (entity[CONDITIONABLE] as Conditionable)[type] = {
    duration,
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
      duration,
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

  if (
    !material ||
    (condition !== "zap" &&
      condition !== "block" &&
      condition !== "axe" &&
      condition !== "pickaxe")
  )
    return;

  // unequip tools if active
  if (condition === "axe" && entity[CONDITIONABLE].axe) {
    delete entity[CONDITIONABLE].axe;
    return;
  } else if (condition === "pickaxe" && entity[CONDITIONABLE].pickaxe) {
    delete entity[CONDITIONABLE].pickaxe;
    return;
  }

  const itemStats = getAbilityStats(item[ITEM]);

  // consume charges for active skills
  if (condition === "zap" || condition === "block") {
    consumeCharge(world, entity, { stackable: "charge" });
  }

  const duration = conditionConfig[condition].duration;
  const conditionStat = conditionConfig[condition].stat;
  applyCondition(
    world,
    entity,
    item,
    condition,
    material,
    duration,
    conditionStat ? itemStats[conditionStat] : 1
  );
};

export const completeQuest = (world: World, entity: Entity, target: Entity) => {
  const popup = target[POPUP] as Popup;
  const choiceIndex = getTabSelections(world, target)[1];

  // apply selected choice
  const choice = popup.choices[choiceIndex];
  if (choice) {
    populateItems(world, entity as TypedEntity<"INVENTORY">, [
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
  item: TypedEntity<"ITEM">
) => {
  // use overriden damage values for NPCs and mobs
  const castableEntity = entity[FRAGMENT]
    ? world.assertByIdAndComponents(entity[FRAGMENT].structure, [
        BELONGABLE,
        STATS,
        INVENTORY,
      ])
    : (entity as TypedEntity<"BELONGABLE">);

  const spellStats = getAbilityStats(item[ITEM], castableEntity[NPC]?.type);

  const spellEntity = entities.createSpell(world, {
    [BELONGABLE]: { faction: castableEntity[BELONGABLE].faction },
    [CASTABLE]: {
      ...getEmptyCastable(world, castableEntity),
      ...spellStats,
    },
    [ORIENTABLE]: { facing: entity[ORIENTABLE]?.facing },
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
  } else if (item[ITEM].spell === "bolt") {
    createSequence<"spell", SpellSequence>(
      world,
      spellEntity,
      "spell",
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

  if (castableEntity[STATS] && !isEnemy(world, castableEntity)) {
    castableEntity[STATS].mp -= 1;
    rerenderEntity(world, castableEntity);
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
          ].includes(entity[PLAYER]?.actionTriggered!)
        )
      )
        continue;

      // mark as interacted and update orientation, except certain content clicks
      if (entity[PLAYER]?.actionTriggered !== "content") {
        entity[MOVABLE].lastInteraction = entityReference;
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

        if (
          contentIndex === undefined ||
          offsetIndex === undefined ||
          selections.length === 2
        ) {
          // ignore
          continue;
        } else if (contentIndex === 0 && offsetIndex >= 10) {
          entity[PLAYER].actionTriggered = "inspect";
        } else if (contentIndex === 2 && offsetIndex >= 10) {
          entity[PLAYER].actionTriggered = "gear";
        } else if (contentIndex === 4 && offsetIndex >= 10) {
          entity[PLAYER].actionTriggered = "stats";
        } else if (contentIndex === 6 && offsetIndex >= 10) {
          entity[PLAYER].actionTriggered = "map";
        } else if (contentIndex === 8 && offsetIndex >= 10) {
          entity[PLAYER].actionTriggered = "equip";
        } else if (contentIndex % 2 === 0) {
          const rowIndex = (contentIndex - (contentIndex % 2)) / 2;
          const columnIndex = Math.floor(offsetIndex / 5);
          const index = rowIndex * 2 + columnIndex;
          const hotkey = index >= 9 ? 0 : index + 1;

          entity[PLAYER].actionTriggered = "use";
          entity[PLAYER].contentTriggered = hotkey;
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
        entity[PLAYER]?.actionTriggered === "gear" ||
        entity[PLAYER]?.actionTriggered === "stats" ||
        entity[PLAYER]?.actionTriggered === "use"
      ) {
        const targetTab = entity[PLAYER].actionTriggered;
        const hotKey = entity[PLAYER].contentTriggered;

        entity[PLAYER].actionTriggered = undefined;
        entity[PLAYER].contentTriggered = undefined;

        // skip trying to open missing map
        if (targetTab === "map" && !entity[EQUIPPABLE]?.map) {
          if (currentPopup === useEntity && isInTab(world, entity, "use")) {
            queueMessage(world, entity, {
              line: addBackground(
                [
                  ...createText("Need ", colors.silver),
                  ...createItemName({
                    equipment: "map",
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
        } else if (targetTab === "use" && hotKey !== undefined) {
          // prevent while viewing other popups or editing
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
            inventoryItem && getItemConsumption(world, inventoryItem);
          consumeItem(world, entity, consumption);
          rerenderEntity(world, useEntity);
          continue;
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
      } else if (entity[PLAYER]?.actionTriggered === "equip") {
        entity[PLAYER].actionTriggered = undefined;
        let targetItem;

        if (entity[ACTIONABLE].toolEquipped && skillEntity) {
          entity[ACTIONABLE].toolEquipped = false;
          targetItem = skillEntity;
        } else if (!entity[ACTIONABLE].toolEquipped && toolEntity) {
          entity[ACTIONABLE].toolEquipped = true;
          targetItem = skillEntity && toolEntity;
        } else continue;

        // close quick dialog if visible
        if (currentPopup === useEntity) {
          closePopup(world, entity, useEntity);
        }

        if (targetItem) {
          queueMessage(world, entity, {
            line: addBackground(
              [
                ...createText("Equipped ", colors.silver),
                ...createItemName(targetItem[ITEM]),
              ],
              colors.black
            ),
            orientation: "up",
            fast: false,
            delay: 0,
          });
        }

        rerenderEntity(world, entity);
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
              entity as TypedEntity<"INVENTORY">,
              skillEntity
            )
          ) {
            if (
              !isInPopup(world, entity) &&
              skillEntity[ITEM].tool !== "axe" &&
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
                            equipment: "weapon",
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
          } else if (skillEntity[ITEM].skill === "bow") {
            shootArrow(world, entity, skillEntity);
          } else if (skillEntity[ITEM].skill === "slash") {
            chargeSlash(world, entity, skillEntity);
          } else if (skillEntity[ITEM].skill === "totem") {
            summonTotem(world, entity, skillEntity);
          } else if (
            skillEntity[ITEM].skill === "zap" ||
            skillEntity[ITEM].skill === "block"
          ) {
            castConditionable(world, entity, skillEntity);
          }
        } else if (toolEntity && entity[ACTIONABLE].toolEquipped) {
          if (
            castableSkill(
              world,
              entity as TypedEntity<"INVENTORY">,
              toolEntity
            ) &&
            (toolEntity[ITEM].tool === "axe" ||
              toolEntity[ITEM].tool === "pickaxe")
          ) {
            castConditionable(world, entity, toolEntity);
          }
        }
      }
    }
  };

  return { onUpdate };
}
