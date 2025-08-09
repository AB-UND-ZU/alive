import { World } from "../ecs";
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
import { createText, doorOpen, none } from "../../game/assets/sprites";
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
import { getItemSprite } from "../../components/Entity/utils";
import {
  frameHeight,
  questSequence,
  queueMessage,
} from "../../game/assets/utils";
import { canRevive, isRevivable, reviveEntity } from "./fate";
import {
  SEQUENCABLE,
  SpellSequence,
  UnlockSequence,
} from "../components/sequencable";
import { createSequence } from "./sequence";
import { shootArrow } from "./ballistics";
import { STATS } from "../components/stats";
import { TypedEntity } from "../entities";
import { entities } from "..";
import { BELONGABLE } from "../components/belongable";
import { add, copy } from "../../game/math/std";
import { ORIENTABLE } from "../components/orientable";
import { CASTABLE } from "../components/castable";
import { isDead, isEnemy } from "./damage";
import { canCast, chargeSlash } from "./magic";
import { EQUIPPABLE } from "../components/equippable";
import {
  canShop,
  closePopup,
  getDeal,
  isPopupAvailable,
  isQuestCompleted,
  openPopup,
} from "./popup";
import { Deal, POPUP } from "../components/popup";
import { addToInventory } from "./collect";
import { getSpellStat } from "../../game/balancing/spells";
import { PLAYER } from "../components/player";
import { isControllable } from "./freeze";
import {
  assertIdentifier,
  acceptQuest as ecsAcceptQuest,
  removeQuest,
} from "../utils";
import { fenceDoor, fenceDoorOpen } from "../../game/assets/sprites/structures";
import * as colors from "../../game/assets/colors";
import { NPC } from "../components/npc";

export const getAction = (world: World, entity: Entity) =>
  ACTIONABLE in entity &&
  Object.keys(entity[ACTIONABLE]).some(
    (actionName) =>
      actionName !== "primaryTriggered" &&
      actionName !== "secondaryTriggered" &&
      world.getEntityById(entity[ACTIONABLE][actionName])
  );

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
  entity[TOOLTIP].override = "hidden";

  if (entity[SPRITE] === fenceDoor) {
    entity[SPRITE] = fenceDoorOpen;
  } else {
    entity[SPRITE] = doorOpen;
    entity[LIGHT].orientation = "left";
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
        const matchesEquipment =
          activationItem.equipment &&
          itemEntity[ITEM].equipment === activationItem.equipment &&
          itemEntity[ITEM].material === activationItem.material &&
          itemEntity[ITEM].primary === activationItem.primary &&
          itemEntity[ITEM].secondary === activationItem.secondary;
        const matchesConsume =
          activationItem.consume &&
          itemEntity[ITEM].consume === activationItem.consume &&
          itemEntity[ITEM].material === activationItem.material &&
          itemEntity[ITEM].amount >= activationItem.amount;
        const matchesStackable =
          activationItem.stackable &&
          itemEntity[ITEM].stackable === activationItem.stackable &&
          itemEntity[ITEM].material === activationItem.material &&
          itemEntity[ITEM].amount >= activationItem.amount;
        return matchesEquipment || matchesConsume || matchesStackable;
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

  // collect item and reduce stock
  deal.stock -= 1;

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

  rerenderEntity(world, shop);
};

export const consumeCharge = (
  world: World,
  entity: Entity,
  item: Pick<Item, "stackable" | "consume">
) => {
  // consume one stackable from inventory
  const chargeId = entity[INVENTORY].items.findLast(
    (itemId: number) =>
      (item.stackable &&
        world.assertByIdAndComponents(itemId, [ITEM])[ITEM].stackable ===
          item.stackable) ||
      (item.consume &&
        world.assertByIdAndComponents(itemId, [ITEM])[ITEM].consume ===
          item.consume)
  );
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

      const questEntity = world.getEntityById(entity[ACTIONABLE].quest);
      const unlockEntity = world.getEntityById(entity[ACTIONABLE].unlock);
      const popupEntity = world.getEntityById(entity[ACTIONABLE].popup);
      const claimEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].claim,
        [TOOLTIP, POPUP]
      );
      const tradeEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].trade,
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
        } else if (questEntity && canAcceptQuest(world, entity, questEntity)) {
          acceptQuest(world, entity, questEntity);
        } else if (unlockEntity) {
          if (canUnlock(world, entity, unlockEntity)) {
            unlockDoor(world, entity, unlockEntity);
          } else {
            queueMessage(world, entity, {
              line: createText("Need key!", colors.silver),
              orientation: "up",
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
        } else if (
          tradeEntity &&
          canShop(world, entity, getDeal(world, tradeEntity))
        ) {
          performTrade(world, entity, tradeEntity);
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
        } else if (!primaryEntity) {
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
              line: createText(
                secondaryEntity[ITEM].secondary === "bow"
                  ? "Need arrow!"
                  : "Need charge!",
                colors.silver
              ),
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
        } else if (!secondaryEntity) {
          queueMessage(world, entity, {
            line: createText("Need item!", colors.silver),
            orientation: "up",
            fast: false,
            delay: 0,
          });
          return;
        }
      }

      entity[MOVABLE].lastInteraction = entityReference;
    }
  };

  return { onUpdate };
}
