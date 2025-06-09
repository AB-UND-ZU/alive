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
import { Element, elements, ITEM } from "../components/item";
import { LOCKABLE } from "../components/lockable";
import { doorOpen, none } from "../../game/assets/sprites";
import { SPRITE } from "../components/sprite";
import { LIGHT } from "../components/light";
import { rerenderEntity } from "./renderer";
import { disposeEntity, updateWalkable } from "./map";
import {
  canAcceptQuest,
  canTrade,
  canUnlock,
  getUnlockKey,
  isTradable,
} from "./action";
import { Tradable, TRADABLE } from "../components/tradable";
import { getItemSprite } from "../../components/Entity/utils";
import { collectItem } from "./collect";
import { questSequence } from "../../game/assets/utils";
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
import { copy } from "../../game/math/std";
import { ORIENTABLE } from "../components/orientable";
import { CASTABLE } from "../components/castable";
import { isEnemy } from "./damage";
import { canCast } from "./magic";
import { createItemInInventory } from "./drop";
import { EQUIPPABLE } from "../components/equippable";

export const getAction = (world: World, entity: Entity) =>
  ACTIONABLE in entity &&
  Object.keys(entity[ACTIONABLE]).some(
    (actionName) =>
      actionName !== "triggered" &&
      world.getEntityById(entity[ACTIONABLE][actionName])
  );

export const unlockDoor = (world: World, entity: Entity, lockable: Entity) => {
  // open doors without locks
  if (!lockable[LOCKABLE].material) {
    openDoor(world, lockable);
    return;
  }

  const keyEntity = getUnlockKey(world, entity, lockable);
  if (!keyEntity) return;

  // start animation
  removeFromInventory(world, entity, keyEntity);
  createSequence<"unlock", UnlockSequence>(
    world,
    lockable,
    "unlock",
    "doorUnlock",
    {
      origin: entity[POSITION],
      itemId: world.getEntityId(keyEntity),
    }
  );

  rerenderEntity(world, lockable);
};

export const openDoor = (world: World, entity: Entity) => {
  entity[LOCKABLE].locked = false;
  entity[SPRITE] = doorOpen;
  entity[LIGHT].orientation = "left";
  entity[TOOLTIP].override = "hidden";
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
  rerenderEntity(world, entity);
};

export const performTrade = (
  world: World,
  entity: Entity,
  trade: TypedEntity<"INVENTORY" | "TRADABLE" | "TOOLTIP">
) => {
  // remove stats and items
  for (const activationItem of (trade[TRADABLE] as Tradable).activation) {
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
          itemEntity[ITEM].material === activationItem.material;
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

      if (tradedId) {
        const tradedEntity = world.assertByIdAndComponents(tradedId, [ITEM]);

        if (
          activationItem.stackable &&
          tradedEntity[ITEM].amount > activationItem.amount
        ) {
          tradedEntity[ITEM].amount -= activationItem.amount;
        } else if (tradedEntity[ITEM].equipment) {
          entity[EQUIPPABLE][tradedEntity[ITEM].equipment] = undefined;
          disposeEntity(world, tradedEntity);
        } else {
          removeFromInventory(world, entity, tradedEntity);
          disposeEntity(world, tradedEntity);
        }
      } else {
        console.error("Unable to perform trade!", {
          entity,
          trade,
          item: activationItem,
        });

        return;
      }
    }
  }

  // collect item and restock if necessary
  const newStock = trade[TRADABLE].stock - 1;
  const previousItems = [...trade[INVENTORY].items];

  if (newStock > 0) {
    for (const itemId of previousItems) {
      const itemEntity = world.assertByIdAndComponents(itemId, [ITEM, SPRITE]);
      if (ORIENTABLE in itemEntity) {
        createItemInInventory(
          world,
          trade,
          entities.createSword,
          itemEntity as TypedEntity<
            "ORIENTABLE" | "SEQUENCABLE" | "ITEM" | "SPRITE"
          >
        );
      } else {
        createItemInInventory(
          world,
          trade,
          entities.createItem,
          itemEntity as TypedEntity<"ITEM" | "SPRITE">
        );
      }
    }
  } else {
    // mark tradable as done
    trade[TRADABLE].activation = [];
    trade[TOOLTIP].dialogs = [];
    trade[TOOLTIP].changed = true;
    trade[TOOLTIP].idle = undefined;
  }

  collectItem(world, entity, trade, true);
  trade[TRADABLE].stock = newStock;

  rerenderEntity(world, trade);
};

export const acceptQuest = (world: World, entity: Entity, target: Entity) => {
  // abort any existing quests
  world.abortQuest(entity);

  // accept quest and remove from target
  questSequence(
    world,
    entity,
    target[QUEST].name,
    target[QUEST].memory,
    world.assertById(entity[ACTIONABLE].quest)
  );
  world.acceptQuest(target);
};

export const castSpell = (
  world: World,
  entity: TypedEntity<"BELONGABLE" | "POSITION">,
  item: TypedEntity<"ITEM">
) => {
  const spellEntity = entities.createSpell(world, {
    [BELONGABLE]: { faction: entity[BELONGABLE].faction },
    [CASTABLE]: {
      affected: {},
      damage: item[ITEM].amount,
      burn: 0,
      freeze: 0,
      caster: world.getEntityId(entity),
    },
    [ORIENTABLE]: { facing: entity[ORIENTABLE]?.facing },
    [POSITION]: copy(entity[POSITION]),
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
  });

  if (item[ITEM].active === "beam1") {
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
        amount: item[ITEM].amount,
        element: elements.includes(item[ITEM].material as Element)
          ? (item[ITEM].material as Element)
          : undefined,
      }
    );
  } else if (item[ITEM].active === "wave1") {
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
        amount: item[ITEM].amount,
        element: elements.includes(item[ITEM].material as Element)
          ? (item[ITEM].material as Element)
          : undefined,
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

      // skip if not actionable or not triggered
      if (!getAction(world, entity) || !entity[ACTIONABLE].triggered) continue;

      entity[ACTIONABLE].triggered = false;
      entity[MOVABLE].lastInteraction = entityReference;

      const questEntity = world.getEntityById(entity[ACTIONABLE].quest);
      const unlockEntity = world.getEntityById(entity[ACTIONABLE].unlock);
      const tradeEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].trade,
        [INVENTORY, TOOLTIP, TRADABLE]
      );
      const spawnEntity = world.getEntityById(entity[ACTIONABLE].spawn);
      const activeEntity = world.getEntityByIdAndComponents(
        entity[ACTIONABLE].active,
        [ITEM]
      );

      if (
        spawnEntity &&
        isRevivable(world, spawnEntity) &&
        canRevive(world, spawnEntity, entity)
      ) {
        reviveEntity(world, spawnEntity, entity);
      } else if (questEntity && canAcceptQuest(world, entity, questEntity)) {
        acceptQuest(world, entity, questEntity);
      } else if (unlockEntity && canUnlock(world, entity, unlockEntity)) {
        unlockDoor(world, entity, unlockEntity);
      } else if (
        tradeEntity &&
        isTradable(world, tradeEntity) &&
        canTrade(world, entity, tradeEntity)
      ) {
        performTrade(world, entity, tradeEntity);
      } else if (activeEntity) {
        if (activeEntity[ITEM].active === "bow") {
          shootArrow(world, entity, activeEntity);
        } else if (canCast(world, entity, activeEntity)) {
          castSpell(world, entity, activeEntity);
        }
      }
    }
  };

  return { onUpdate };
}
