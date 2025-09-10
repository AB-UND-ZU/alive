import { createLevel, World } from "../ecs";
import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { Entity } from "ecs";
import { QUEST } from "../components/quest";
import { ACTIONABLE } from "../components/actionable";
import { MOVABLE } from "../components/movable";
import { TOOLTIP } from "../components/tooltip";
import { INVENTORY } from "../components/inventory";
import { Element, elements, Item, ITEM } from "../components/item";
import { LOCKABLE } from "../components/lockable";
import { createDialog, createText, none } from "../../game/assets/sprites";
import { SPRITE } from "../components/sprite";
import { LIGHT } from "../components/light";
import { rerenderEntity } from "./renderer";
import { disposeEntity, moveEntity, updateWalkable } from "./map";
import {
  canAcceptQuest,
  canUnlock,
  castablePrimary,
  castableSecondary,
  getUnlockKey,
} from "./action";
import {
  createItemName,
  frameHeight,
  getItemSprite,
  questSequence,
  queueMessage,
} from "../../game/assets/utils";
import { canRevive, isRevivable, reviveEntity } from "./fate";
import {
  Sequencable,
  SEQUENCABLE,
  SpellSequence,
  UnlockSequence,
  VisionSequence,
} from "../components/sequencable";
import { createSequence, getParticles } from "./sequence";
import { shootArrow } from "./ballistics";
import { STATS } from "../components/stats";
import { TypedEntity } from "../entities";
import { entities } from "..";
import { BELONGABLE } from "../components/belongable";
import { add, copy, signedDistance } from "../../game/math/std";
import { ORIENTABLE } from "../components/orientable";
import { CASTABLE } from "../components/castable";
import { isDead, isEnemy } from "./damage";
import { canCast, chargeSlash, getParticleAmount } from "./magic";
import { EQUIPPABLE } from "../components/equippable";
import {
  canRedeem,
  canShop,
  closePopup,
  getDeal,
  isInPopup,
  isPopupAvailable,
  isQuestCompleted,
  matchesItem,
  missingFunds,
  openPopup,
} from "./popup";
import { Deal, POPUP } from "../components/popup";
import { addToInventory } from "./collect";
import { getSpellStat } from "../../game/balancing/spells";
import { PLAYER } from "../components/player";
import { isControllable } from "./freeze";
import {
  assertIdentifier,
  assertIdentifierAndComponents,
  acceptQuest as ecsAcceptQuest,
  removeQuest,
} from "../utils";
import * as colors from "../../game/assets/colors";
import { NPC } from "../components/npc";
import { consumeItem, defaultLight, getConsumption } from "./consume";
import { pickupOptions, play } from "../../game/sound";
import { LEVEL } from "../components/level";
import {
  forestName,
  forestSize,
  generateForest,
} from "../../game/levels/forest";
import { overworldName } from "../../game/levels/overworld";
import { VIEWABLE } from "../components/viewable";
import { SPAWNABLE } from "../components/spawnable";

export const getAction = (world: World, entity: Entity) =>
  ACTIONABLE in entity &&
  Object.keys(entity[ACTIONABLE]).some(
    (actionName) =>
      actionName !== "primaryTriggered" &&
      actionName !== "secondaryTriggered" &&
      world.getEntityById(entity[ACTIONABLE][actionName])
  );

export const canWarp = (world: World, entity: Entity, warp: Entity) =>
  warp[TOOLTIP].dialogs.length === 0 &&
  canRedeem(world, entity, {
    stock: 1,
    item: { consume: "map", amount: 1 },
    price: [{ consume: "map", amount: 1 }],
  });

export const initiateWarp = (world: World, warp: Entity, entity: Entity) => {
  moveEntity(world, entity, warp[POSITION]);

  warp[TOOLTIP].dialogs = [createDialog("Please wait...")];
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
    // tag hero and related entities to new world
    const reference = world.assertByIdAndComponents(entity[MOVABLE].reference, [
      REFERENCE,
    ]);
    const inspectEntity = assertIdentifier(world, "inspect");
    const focusEntity = assertIdentifierAndComponents(world, "focus", [
      MOVABLE,
      SEQUENCABLE,
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
      focusEntity,
      reference,
      ...getParticles(world, entity),
      ...entityFrames,
      ...getParticles(world, focusEntity),
      ...focusFrames,
    ];
    transferredEntities.forEach((target) => {
      world.addComponentToEntity(target, forestName, {});
      world.removeComponentFromEntity(
        target as TypedEntity<typeof overworldName>,
        overworldName
      );
    });

    // remove old world for now
    world.getEntities([]).forEach((target) => {
      if (transferredEntities.includes(target)) return;

      disposeEntity(world, target);
    });

    // generate new world
    const level = createLevel(world, forestName, forestSize);
    generateForest(world);
    focusEntity[MOVABLE].reference = world.getEntityId(level);

    // reset hero
    moveEntity(world, entity, { x: 0, y: 0 });
    const previousSpring = entity[VIEWABLE].spring;
    entity[VIEWABLE].spring = { duration: 0 };
    entity[VIEWABLE].active = true;
    entity[SPAWNABLE].position = { x: 0, y: 0 };
    entity[SPAWNABLE].light = defaultLight;

    setTimeout(() => {
      entity[VIEWABLE].spring = previousSpring;

      createSequence<"vision", VisionSequence>(
        world,
        entity,
        "vision",
        "changeRadius",
        {
          light: defaultLight,
          fast: false,
        }
      );
    }, 1000);
  }, 3000);
};

export const unlockDoor = (world: World, entity: Entity, lockable: Entity) => {
  // open doors without locks
  if (!lockable[LOCKABLE].material) {
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
  const deal = getDeal(world, shop);
  // remove stats and items
  for (const activationItem of deal.price) {
    if (activationItem.stat) {
      entity[STATS][activationItem.stat] -= activationItem.amount;
    } else {
      const items = [
        ...entity[INVENTORY].items,
        ...Object.values(entity[EQUIPPABLE]).filter(Boolean),
      ];
      const tradedId = items.find((itemId) => {
        const itemEntity = world.assertByIdAndComponents(itemId, [ITEM]);
        return matchesItem(world, itemEntity[ITEM], activationItem);
      });

      if (tradedId) {
        const tradedEntity = world.assertByIdAndComponents(tradedId, [ITEM]);

        if (
          (activationItem.stackable || activationItem.consume) &&
          tradedEntity[ITEM].amount > activationItem.amount
        ) {
          tradedEntity[ITEM].amount -= activationItem.amount;
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
          item: activationItem,
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
        colors.silver
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

export const acceptQuest = (world: World, entity: Entity, target: Entity) => {
  // accept quest and remove from target
  questSequence(
    world,
    entity,
    target[QUEST].name,
    target[QUEST].memory,
    world.assertById(entity[ACTIONABLE].quest)
  );
  ecsAcceptQuest(world, target);
  closePopup(world, entity, target);
};

export const completeQuest = (world: World, entity: Entity, target: Entity) => {
  target[POPUP].deals.forEach((deal: Deal, index: number) => {
    target[POPUP].verticalIndex = index;
    performTrade(
      world,
      entity,
      target as TypedEntity<"POPUP" | "TOOLTIP" | "POSITION">
    );
  });
  closePopup(world, entity, target);
  removeQuest(world, target);
};

export const castSpell = (
  world: World,
  entity: TypedEntity<"BELONGABLE" | "POSITION">,
  item: TypedEntity<"ITEM">
) => {
  // use overriden damage values for NPCs and mobs
  const spellStats = getSpellStat(
    entity[NPC]?.type || "hero",
    item[ITEM].primary!,
    item[ITEM].material as Element
  );
  const spellEntity = entities.createSpell(world, {
    [BELONGABLE]: { faction: entity[BELONGABLE].faction },
    [CASTABLE]: {
      medium: "magic",
      affected: {},
      ...spellStats,
      caster: world.getEntityId(entity),
    },
    [ORIENTABLE]: { facing: entity[ORIENTABLE]?.facing },
    [POSITION]: copy(entity[POSITION]),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
  });

  const element = elements.includes(item[ITEM].material as Element)
    ? (item[ITEM].material as Element)
    : entity[PLAYER]
    ? "default"
    : "wild";

  if (item[ITEM].primary === "beam1") {
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
        element,
      }
    );
    play("beam", {
      variant: getParticleAmount(world, spellStats.damage || spellStats.heal),
    });
  } else if (item[ITEM].primary === "wave1") {
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
        element,
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
      const questEntity = world.getEntityById(entity[ACTIONABLE].quest);
      const unlockEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].unlock,
        [LOCKABLE, POSITION]
      );
      const popupEntity = world.getEntityById(entity[ACTIONABLE].popup);
      const claimEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].claim,
        [TOOLTIP, POPUP]
      );
      const tradeEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].trade,
        [TOOLTIP, POPUP, POSITION]
      );
      const useEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].use,
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

        // close any popup
        const popupEntity = world.getEntityById(entity[PLAYER].popup);
        if (popupEntity) {
          closePopup(world, entity, popupEntity);
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

        if (
          spawnEntity &&
          isRevivable(world, spawnEntity) &&
          canRevive(world, spawnEntity, entity)
        ) {
          reviveEntity(world, spawnEntity, entity);
        } else if (warpEntity) {
          if (canWarp(world, entity, warpEntity)) {
            initiateWarp(world, warpEntity, entity);
          } else {
            queueMessage(world, entity, {
              line: [
                ...createText("Need ", colors.silver),
                ...createItemName({
                  consume: "map",
                }),
                ...createText("!", colors.silver),
              ],
              orientation:
                signedDistance(
                  entity[POSITION].y,
                  warpEntity[POSITION].y,
                  size
                ) >= 0
                  ? "up"
                  : "down",
              fast: false,
              delay: 0,
            });
          }
        } else if (questEntity && canAcceptQuest(world, entity, questEntity)) {
          acceptQuest(world, entity, questEntity);
        } else if (unlockEntity) {
          if (canUnlock(world, entity, unlockEntity)) {
            unlockDoor(world, entity, unlockEntity);
          } else {
            queueMessage(world, entity, {
              line: [
                ...createText("Need ", colors.silver),
                ...createItemName({
                  consume: "key",
                  material: unlockEntity[LOCKABLE].material,
                }),
                ...createText("!", colors.silver),
              ],
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
        } else if (claimEntity) {
          if (isQuestCompleted(world, entity, claimEntity)) {
            completeQuest(world, entity, claimEntity);
          } else {
            queueMessage(world, entity, {
              line: createText("Not completed!", colors.silver),
              orientation: "up",
              fast: false,
              delay: 0,
            });
            return;
          }
        } else if (tradeEntity) {
          const deal = getDeal(world, tradeEntity);
          if (canShop(world, entity, deal)) {
            performTrade(world, entity, tradeEntity);
          } else if (deal.stock === 0) {
            queueMessage(world, entity, {
              line: createText("Sold out!", colors.silver),
              orientation: "up",
              fast: false,
              delay: 0,
            });
          } else {
            const missingItem = missingFunds(world, entity, deal)[0];
            queueMessage(world, entity, {
              line: [
                ...createText("Need ", colors.silver),
                ...createItemName(missingItem),
                ...createText("!", colors.silver),
              ],
              orientation: "up",
              fast: false,
              delay: 0,
            });
          }
        } else if (useEntity) {
          if (useEntity && getConsumption(world, entity, useEntity)) {
            consumeItem(world, entity, useEntity);
          } else {
            const item = world.getEntityByIdAndComponents(
              entity[INVENTORY]?.items[entity[POPUP]?.verticalIndex!],
              [ITEM]
            )?.[ITEM];
            queueMessage(world, entity, {
              line: item?.equipment
                ? [
                    ...createItemName(item),
                    ...createText(" already worn!", colors.silver),
                  ]
                : item
                ? [
                    ...createText("Can't use ", colors.silver),
                    ...createItemName(item),
                    ...createText("!", colors.silver),
                  ]
                : createText("Nothing to use!", colors.silver),
              orientation: "up",
              fast: false,
              delay: 0,
            });
          }
        } else if (primaryEntity) {
          if (
            canCast(world, entity, primaryEntity) &&
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
              line: createText("Need mana!", colors.silver),
              orientation: "up",
              fast: false,
              delay: 0,
            });
            return;
          }
        } else if (!primaryEntity && !isInPopup(world, entity)) {
          queueMessage(world, entity, {
            line: createText("Need spell!", colors.silver),
            orientation: "up",
            fast: false,
            delay: 0,
          });
          return;
        }
      } else if (entity[ACTIONABLE].secondaryTriggered) {
        entity[ACTIONABLE].secondaryTriggered = false;

        if (closeEntity) {
          closePopup(world, entity, closeEntity);
        } else if (secondaryEntity) {
          if (
            !castableSecondary(
              world,
              entity as TypedEntity<"INVENTORY">,
              secondaryEntity
            ) &&
            entity[INVENTORY]
          ) {
            queueMessage(world, entity, {
              line: [
                ...createText("Need ", colors.silver),
                ...createItemName(
                  entity[EQUIPPABLE]?.sword
                    ? {
                        stackable:
                          secondaryEntity[ITEM].secondary === "bow"
                            ? "arrow"
                            : "charge",
                      }
                    : { equipment: "sword", material: "wood" }
                ),
                ...createText("!", colors.silver),
              ],
              orientation: "up",
              fast: false,
              delay: 0,
            });
            return;
          } else if (secondaryEntity[ITEM].secondary === "bow") {
            shootArrow(world, entity, secondaryEntity);
          } else if (
            secondaryEntity[ITEM].secondary === "slash" &&
            entity[EQUIPPABLE]?.sword
          ) {
            chargeSlash(world, entity, secondaryEntity);
          }
        } else if (!secondaryEntity && !popupEntity) {
          queueMessage(world, entity, {
            line: createText("Need item!", colors.silver),
            orientation: "up",
            fast: false,
            delay: 0,
          });
          return;
        }
      }
    }
  };

  return { onUpdate };
}
