import { createLevel, preloadLevel, World } from "../ecs";
import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { Entity } from "ecs";
import { ACTIONABLE } from "../components/actionable";
import { MOVABLE } from "../components/movable";
import { TOOLTIP } from "../components/tooltip";
import { Inventory, INVENTORY } from "../components/inventory";
import { Item, ITEM, Material } from "../components/item";
import { LOCKABLE } from "../components/lockable";
import {
  addBackground,
  createDialog,
  createText,
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
  castablePrimary,
  castableSecondary,
  getHarvestTarget,
  getUnlockKey,
} from "./action";
import {
  createItemName,
  createItemText,
  frameHeight,
  frameWidth,
  getItemSprite,
  questWidth,
  queueMessage,
} from "../../game/assets/utils";
import { canRevive, isRevivable, reviveEntity } from "./fate";
import {
  ConditionSequence,
  HarvestSequence,
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
import { CASTABLE } from "../components/castable";
import { isDead, isEnemy, isFriendlyFire, isNpc } from "./damage";
import { canCast, chargeSlash } from "./magic";
import { EQUIPPABLE } from "../components/equippable";
import {
  canSell,
  canShop,
  closePopup,
  getDeal,
  getTab,
  getTabSelections,
  getVerticalIndex,
  isPopupAvailable,
  isQuestCompleted,
  matchesItem,
  missingFunds,
  openPopup,
  popTabSelection,
  pushTabSelection,
  removePopup,
  setVerticalIndex,
} from "./popup";
import { Popup, POPUP } from "../components/popup";
import { addToInventory } from "./collect";
import { getAbilityStats } from "../../game/balancing/abilities";
import { PLAYER } from "../components/player";
import { isControllable } from "./freeze";
import {
  assertIdentifier,
  assertIdentifierAndComponents,
  getIdentifier,
  setHighlight,
  TEST_MODE,
} from "../utils";
import { colors } from "../../game/assets/colors";
import { NPC } from "../components/npc";
import { consumeItem, getConsumption } from "./consume";
import { pickupOptions, play } from "../../game/sound";
import { LEVEL, LevelName } from "../components/level";
import { VIEWABLE } from "../components/viewable";
import { SPAWNABLE } from "../components/spawnable";
import { getForgeStatus } from "../../game/balancing/forging";
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

export const getAction = (world: World, entity: Entity) =>
  ACTIONABLE in entity &&
  Object.keys(entity[ACTIONABLE]).some(
    (actionName) =>
      actionName !== "primaryTriggered" &&
      actionName !== "secondaryTriggered" &&
      world.getEntityById(entity[ACTIONABLE][actionName])
  );

export const canWarp = (world: World, entity: Entity, warp: Entity) => {
  const currentLevel = world.metadata.gameEntity[LEVEL].name;
  const selectedLevel = getSelectedLevel(world, warp);

  if (isNpc(world, entity) || currentLevel === selectedLevel) return false;

  // allow warping everywhere else in test mode
  if (TEST_MODE) return true;

  return levelConfig[currentLevel].warps.includes(selectedLevel);
};

export const initiateWarp = (world: World, warp: Entity, entity: Entity) => {
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
      const levelName = getSelectedLevel(world, warp);
      const { size, generator, vision } = levelConfig[levelName];
      const light = calculateVision(vision);

      const inspectEntity = assertIdentifier(world, "inspect");
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

      // don't set class stats in test mode
      const classIndex = warp[POPUP].tabs.indexOf("class");
      const classUpdated = classIndex !== -1;
      const styleIndex = warp[POPUP].tabs.indexOf("style");
      const styleUpdated = styleIndex !== -1;
      const selectedClass = classUpdated
        ? TEST_MODE
          ? displayedClasses[warp[POPUP].verticalIndezes[classIndex]]
          : "rogue"
        : entity[SPAWNABLE].classKey;
      const selectedStyle = styleUpdated
        ? hairColors[warp[POPUP].verticalIndezes[styleIndex]].color
        : entity[SPAWNABLE].hairColor;

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
  shop: TypedEntity<"POPUP" | "TOOLTIP" | "POSITION">
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
    [ITEM]: { ...deal.item, bound: false, carrier: -1 },
    [RENDERABLE]: { generation: 1 },
    [SPRITE]: getItemSprite(deal.item),
  };
  const itemEntity =
    deal.item.equipment === "sword"
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
            objectives: [],
            choices: [],
            viewpoint: world.getEntityId(entity),
            tabs: ["info"],
          },
        })
      : entities.createItem(world, itemData);
  addToInventory(world, entity, itemEntity, true);

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

      storedItem[ITEM].amount -= 1;

      if (storedItem[ITEM].amount === 0) {
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
    play("pickup", pickupOptions[deal.item.stackable!]);
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

export const harvestTree = (world: World, entity: Entity, axe: Entity) => {
  const harvestable = getHarvestTarget(world, entity, axe);

  if (!harvestable) return;

  createSequence<"harvest", HarvestSequence>(
    world,
    entity,
    "harvest",
    "harvestResource",
    {
      amount: 1,
      item: world.getEntityId(axe),
      target: world.getEntityId(harvestable),
      orientation: entity[ORIENTABLE].facing,
    }
  );
};

const conditionSequences: Record<ConditionType, SequenceState<{}>["name"]> = {
  raise: "raiseCondition",
  block: "blockCondition",
};

export const applyCondition = (
  world: World,
  entity: Entity,
  type: ConditionType,
  material: Material,
  amount: number
) => {
  const duration = 10;
  const generation = world.metadata.gameEntity[RENDERABLE].generation;
  (entity[CONDITIONABLE] as Conditionable)[type] = {
    duration,
    generation,
    amount,
  };

  createSequence<"condition", ConditionSequence>(
    world,
    entity,
    "condition",
    conditionSequences[type],
    {
      duration: 10,
      material,
    }
  );
};

export const completeQuest = (world: World, entity: Entity, target: Entity) => {
  const popup = target[POPUP] as Popup;
  const choiceIndex = getVerticalIndex(world, target);
  popup.deals.forEach((_, index) => {
    popup.verticalIndezes[target[POPUP].horizontalIndex] = index;
    performTrade(
      world,
      entity,
      target as TypedEntity<"POPUP" | "TOOLTIP" | "POSITION">
    );
  });

  // apply selected choice
  const choice = popup.choices[choiceIndex];
  if (choice) {
    const itemEntity = entities.createItem(world, {
      [ITEM]: { ...choice, carrier: -1, bound: false },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: getItemSprite(choice),
    });
    addToInventory(world, entity, itemEntity, true);
    queueMessage(world, entity, {
      line: createText(
        `${choice.amount}x ${getItemSprite(choice).name}`,
        itemEntity[ITEM].equipment ? colors.black : colors.silver,
        itemEntity[ITEM].equipment ? colors.silver : colors.black
      ),
      orientation: "up",
      fast: false,
      delay: 0,
    });
    play("pickup", pickupOptions[choice.stat || choice.stackable!]);
  }

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
          questWidth,
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
              ...repeat(none, questWidth - text.length - 2),
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
  popup.objectives = [];
};

export const castSpell = (
  world: World,
  entity: TypedEntity<"BELONGABLE" | "POSITION">,
  item: TypedEntity<"ITEM">
) => {
  if (!item[ITEM].material) return;

  // use overriden damage values for NPCs and mobs
  const spellStats = getAbilityStats(item[ITEM], entity[NPC]?.type);

  const spellEntity = entities.createSpell(world, {
    [BELONGABLE]: { faction: entity[BELONGABLE].faction },
    [CASTABLE]: {
      affected: {},
      ...spellStats,
      retrigger: item[ITEM].primary === "beam" ? 2 : 0,
      caster: world.getEntityId(entity),
    },
    [ORIENTABLE]: { facing: entity[ORIENTABLE]?.facing },
    [POSITION]: copy(entity[POSITION]),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
  });

  if (item[ITEM].primary === "beam") {
    createSequence<"spell", SpellSequence>(
      world,
      spellEntity,
      "spell",
      "castBeam1",
      {
        progress: 0,
        duration: 31,
        range: 12,
        areas: [],
        material: item[ITEM].material,
        element: item[ITEM].element,
      }
    );
    play("beam", { variant: 3 });
  } else if (item[ITEM].primary === "bolt") {
    createSequence<"spell", SpellSequence>(
      world,
      spellEntity,
      "spell",
      "castBolt1",
      {
        progress: 0,
        duration: 6,
        range: 6,
        areas: [],
        material: item[ITEM].material,
        element: item[ITEM].element,
      }
    );
    // TODO: add sound
  } else if (item[ITEM].primary === "wave") {
    createSequence<"spell", SpellSequence>(
      world,
      spellEntity,
      "spell",
      "castWave1",
      {
        memory: { innerRadius: 0 },
        progress: 0,
        range: 7,
        duration: 7,
        areas: [],
        material: item[ITEM].material,
        element: item[ITEM].element,
      }
    );
    play("wave");
  }

  if (entity[STATS] && !isEnemy(world, entity)) {
    entity[STATS].mp -= 1;
    rerenderEntity(world, entity);
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

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    for (const entity of world.getEntities([
      ACTIONABLE,
      BELONGABLE,
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
        (!isControllable(world, entity) && !isDead(world, entity)) ||
        !(
          entity[ACTIONABLE].primaryTriggered ||
          entity[ACTIONABLE].secondaryTriggered ||
          entity[PLAYER]?.inspectTriggered
        )
      )
        continue;

      // mark as interacted and update orientation
      entity[MOVABLE].lastInteraction = entityReference;

      if (entity[ORIENTABLE]) {
        entity[ORIENTABLE].facing =
          entity[MOVABLE].orientations[0] ||
          entity[MOVABLE].pendingOrientation ||
          entity[ORIENTABLE].facing;
      }

      const warpEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].warp,
        [POSITION, TOOLTIP]
      );
      const unlockEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].unlock,
        [LOCKABLE, POSITION]
      );
      const popupEntity = world.getEntityById(entity[ACTIONABLE].popup);
      const tradeEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].trade,
        [TOOLTIP, POPUP, POSITION]
      );
      const useEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].use,
        [TOOLTIP, POPUP, POSITION]
      );
      const addEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].add,
        [TOOLTIP, POPUP, POSITION]
      );
      const closeEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].close,
        [POPUP]
      );
      const spawnEntity = world.getEntityById(entity[ACTIONABLE].spawn);
      const primaryEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].primary,
        [ITEM]
      );
      const secondaryEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].secondary,
        [ITEM]
      );

      if (entity[PLAYER]?.inspectTriggered) {
        entity[PLAYER].inspectTriggered = false;

        // close any popup but preserve selections
        const popupEntity = world.getEntityByIdAndComponents(
          entity[PLAYER].popup,
          [POPUP]
        );
        if (popupEntity) {
          const selections = popupEntity[POPUP].selections;
          closePopup(world, entity, popupEntity);
          popupEntity[POPUP].selections = selections;
        }

        // open if it wasn't just closed and move viewpoint
        if (popupEntity !== entity) {
          const inspectEntity = assertIdentifier(world, "inspect");
          moveEntity(
            world,
            inspectEntity,
            add(entity[POSITION], { x: 0, y: (frameHeight + 1) / -2 })
          );
          openPopup(world, entity, entity);
        }
      } else if (entity[ACTIONABLE].primaryTriggered) {
        entity[ACTIONABLE].primaryTriggered = false;

        const inventoryItems = (entity[INVENTORY]?.items || []).map((itemId) =>
          world.assertByIdAndComponents(itemId, [ITEM])
        );

        if (
          spawnEntity &&
          isRevivable(world, spawnEntity) &&
          canRevive(world, spawnEntity, entity)
        ) {
          reviveEntity(world, spawnEntity, entity);
        } else if (warpEntity && canWarp(world, entity, warpEntity)) {
          initiateWarp(world, warpEntity, entity);
        } else if (unlockEntity) {
          if (canUnlock(world, entity, unlockEntity)) {
            unlockDoor(world, entity, unlockEntity);
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
            return;
          }
        } else if (popupEntity && isPopupAvailable(world, popupEntity)) {
          openPopup(world, entity, popupEntity);
        } else if (tradeEntity) {
          const tab = getTab(world, tradeEntity);
          const deal = getDeal(world, entity, tradeEntity);

          if (!deal) {
            // ignore
          } else if (tab === "buy") {
            const missingItem = missingFunds(world, entity, deal)[0];
            if (canShop(world, entity, deal)) {
              performTrade(world, entity, tradeEntity);
            } else if (deal.stock === 0) {
              queueMessage(world, entity, {
                line: createText("Sold out!", colors.silver, colors.black),
                orientation: "up",
                fast: false,
                delay: 0,
              });
            } else if (missingItem) {
              queueMessage(world, entity, {
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
          } else if (tab === "sell") {
            if (canSell(world, deal.prices[0])) {
              performTrade(world, entity, tradeEntity);
            } else {
              queueMessage(world, entity, {
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
          } else if (tab === "forge") {
            const resultItem = deal.item;
            performTrade(world, entity, tradeEntity);
            popTabSelection(world, tradeEntity);
            popTabSelection(world, tradeEntity);

            const resultIndex = (entity[INVENTORY]?.items || []).findIndex(
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
          } else if (tab === "craft") {
            const missingItem = missingFunds(world, entity, deal)[0];
            if (canShop(world, entity, deal)) {
              performTrade(world, entity, tradeEntity);
            } else if (missingItem) {
              queueMessage(world, entity, {
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
          } else if (tab === "quest") {
            if (isQuestCompleted(world, entity, tradeEntity)) {
              completeQuest(world, entity, tradeEntity);

              // advance to completed screen
              const selections = getTabSelections(world, tradeEntity);
              if (selections.length === 0) pushTabSelection(world, tradeEntity);
              pushTabSelection(world, tradeEntity);
            } else {
              queueMessage(world, entity, {
                line: createText("Not completed!", colors.silver, colors.black),
                orientation: "up",
                fast: false,
                delay: 0,
              });
            }
          }
        } else if (useEntity) {
          if (useEntity && getConsumption(world, entity, useEntity)) {
            consumeItem(world, entity, useEntity);
          } else {
            const useItem =
              inventoryItems[getVerticalIndex(world, entity)]?.[ITEM];
            queueMessage(world, entity, {
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
        } else if (addEntity) {
          const tab = getTab(world, addEntity);
          const verticalIndex = getVerticalIndex(world, addEntity);
          const selections = getTabSelections(world, addEntity);

          if (tab === "forge") {
            const [firstIndex, secondIndex] = selections;
            const { forgeable, addItem, baseItem } = getForgeStatus(
              world,
              entity,
              firstIndex,
              secondIndex,
              verticalIndex
            );
            const nextItem = addItem || baseItem;

            if (forgeable) {
              pushTabSelection(world, addEntity);
            } else {
              queueMessage(world, entity, {
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
          } else if (tab === "craft") {
            pushTabSelection(world, addEntity);
            setVerticalIndex(world, addEntity, 0);
          } else if (tab === "class" || tab === "style") {
            if (verticalIndex === 0 || TEST_MODE || tab === "style") {
              addEntity[POPUP].horizontalIndex += 1;
              rerenderEntity(world, addEntity);
            } else {
              queueMessage(world, entity, {
                line: createText("Not unlocked!", colors.silver, colors.black),
                orientation: "up",
                fast: false,
                delay: 0,
              });
            }
          } else if (tab === "quest") {
            const objectives = addEntity[POPUP].objectives;
            if (objectives.length > 0 && selections.length === 1) {
              const target = getIdentifier(
                world,
                objectives[verticalIndex]?.identifier
              );
              if (target) {
                setHighlight(
                  world,
                  isFriendlyFire(world, entity, target) ? "quest" : "enemy",
                  target
                );
              }
              closePopup(world, entity, addEntity);
            } else {
              pushTabSelection(world, addEntity);
              setVerticalIndex(world, addEntity, 0);
            }
          }
        } else if (primaryEntity) {
          const castReady = canCast(world, entity, primaryEntity);
          if (
            castReady &&
            entity[INVENTORY] &&
            castablePrimary(
              world,
              entity as TypedEntity<"INVENTORY">,
              primaryEntity
            )
          ) {
            castSpell(world, entity, primaryEntity);
          } else {
            queueMessage(world, entity, {
              line: createText(
                castReady ? "Need mana!" : "Not ready!",
                colors.silver,
                colors.black
              ),
              orientation: "up",
              fast: false,
              delay: 0,
            });
            return;
          }
        }
      } else if (entity[ACTIONABLE].secondaryTriggered) {
        entity[ACTIONABLE].secondaryTriggered = false;

        if (closeEntity) {
          const tab = getTab(world, closeEntity);
          const selections = getTabSelections(world, closeEntity);

          if (
            tab === "quest" &&
            isQuestCompleted(world, entity, closeEntity) &&
            selections.length === 2
          ) {
            // clear quest after showing completed screen
            closePopup(world, entity, closeEntity);
            removePopup(world, closeEntity);
          } else if (selections.length > 0) {
            const verticalIndex = popTabSelection(world, closeEntity);
            setVerticalIndex(world, closeEntity, verticalIndex || 0);
          } else {
            closePopup(world, entity, closeEntity);
          }
        } else if (secondaryEntity) {
          if (
            !castableSecondary(
              world,
              entity as TypedEntity<"INVENTORY">,
              secondaryEntity
            )
          ) {
            if (
              secondaryEntity[ITEM].secondary !== "axe" &&
              !(
                secondaryEntity[ITEM].secondary === "raise" &&
                entity[CONDITIONABLE]?.raise
              ) &&
              !(
                secondaryEntity[ITEM].secondary === "block" &&
                entity[CONDITIONABLE]?.block
              )
            ) {
              queueMessage(world, entity, {
                line: addBackground(
                  [
                    ...createText("Need ", colors.silver),
                    ...createItemName({
                      stackable:
                        secondaryEntity[ITEM].secondary === "bow"
                          ? "arrow"
                          : "charge",
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
            return;
          } else if (secondaryEntity[ITEM].secondary === "bow") {
            shootArrow(world, entity, secondaryEntity);
          } else if (secondaryEntity[ITEM].secondary === "slash") {
            chargeSlash(world, entity, secondaryEntity);
          } else if (secondaryEntity[ITEM].secondary === "axe") {
            harvestTree(world, entity, secondaryEntity);
          } else if (secondaryEntity[ITEM].secondary === "raise") {
            consumeCharge(world, entity, { stackable: "charge" });
            applyCondition(world, entity, "raise", "wood", 2);
          } else if (secondaryEntity[ITEM].secondary === "block") {
            consumeCharge(world, entity, { stackable: "charge" });
            applyCondition(world, entity, "block", "wood", 1);
          }
        }
      }
    }
  };

  return { onUpdate };
}
