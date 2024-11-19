import { World } from "../ecs";
import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { Entity } from "ecs";
import { QUEST } from "../components/quest";
import { ACTIONABLE } from "../components/actionable";
import { MOVABLE } from "../components/movable";
import { TOOLTIP } from "../components/tooltip";
import { Inventory, INVENTORY } from "../components/inventory";
import { ITEM } from "../components/item";
import { LOCKABLE } from "../components/lockable";
import { doorOpen } from "../../game/assets/sprites";
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
import { getMaterialSprite } from "../../components/Entity/utils";
import { collectItem } from "./collect";
import { questSequence } from "../../game/assets/utils";
import { canRevive, isRevivable, reviveEntity } from "./fate";
import { UnlockSequence } from "../components/sequencable";
import { createSequence } from "./sequence";
import { shootArrow } from "./ballistics";
import { STATS } from "../components/stats";

export const getAction = (world: World, entity: Entity) =>
  ACTIONABLE in entity &&
  (world.getEntityById(entity[ACTIONABLE].quest) ||
    world.getEntityById(entity[ACTIONABLE].unlock) ||
    world.getEntityById(entity[ACTIONABLE].trade) ||
    world.getEntityById(entity[ACTIONABLE].spawn) ||
    world.getEntityById(entity[ACTIONABLE].bow));

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
  rerenderEntity(world, entity);
  updateWalkable(world, entity[POSITION]);
};

export const lockDoor = (world: World, entity: Entity) => {
  entity[LOCKABLE].locked = true;
  entity[SPRITE] = getMaterialSprite({
    materialized: "door",
    material: entity[LOCKABLE].material,
  });
  entity[LIGHT].orientation = undefined;
  rerenderEntity(world, entity);
  updateWalkable(world, entity[POSITION]);
};

export const removeFromInventory = (
  world: World,
  entity: Entity,
  item: Entity
) => {
  item[ITEM].carrier = undefined;
  const itemIndex = entity[INVENTORY].items.indexOf(world.getEntityId(item));

  if (itemIndex === -1) {
    console.error(
      Date.now(),
      "Unable to remove item from inventory",
      item,
      entity
    );
    return;
  }

  entity[INVENTORY].items.splice(itemIndex, 1);
  rerenderEntity(world, entity);
};

export const performTrade = (world: World, entity: Entity, trade: Entity) => {
  // remove stats and items
  for (const activationItem of (trade[TRADABLE] as Tradable).activation) {
    if (activationItem.stat) {
      entity[STATS][activationItem.stat] -= activationItem.amount;
    } else {
      const tradedId = (entity[INVENTORY] as Inventory).items.find((itemId) => {
        const itemEntity = world.assertByIdAndComponents(itemId, [ITEM]);
        const matchesEquipment =
          activationItem.equipment &&
          itemEntity[ITEM].equipment === activationItem.equipment &&
          itemEntity[ITEM].material === activationItem.material;
        const matchesConsume =
          activationItem.consume &&
          itemEntity[ITEM].consume === activationItem.consume &&
          itemEntity[ITEM].material === activationItem.material;
        return matchesEquipment || matchesConsume;
      });

      if (tradedId) {
        const tradedEntity = world.assertById(tradedId);
        removeFromInventory(world, entity, tradedEntity);
        disposeEntity(world, tradedEntity);
      } else {
        console.error("Unable to perform trade!", {
          entity,
          trade,
          item: activationItem,
        });
      }
    }
  }

  // mark tradable as done
  trade[TRADABLE].activation = [];
  trade[TOOLTIP].dialogs = [];
  trade[TOOLTIP].changed = true;
  trade[TOOLTIP].idle = undefined;

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
    world.assertById(entity[ACTIONABLE].quest)
  );
  world.acceptQuest(target);
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
      POSITION,
      ACTIONABLE,
      MOVABLE,
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
      const tradeEntity = world.getEntityById(entity[ACTIONABLE].trade);
      const spawnEntity = world.getEntityById(entity[ACTIONABLE].spawn);
      const bowEntity = world.getEntityById(entity[ACTIONABLE].bow);

      if (questEntity && canAcceptQuest(world, entity, questEntity)) {
        acceptQuest(world, entity, questEntity);
      } else if (unlockEntity && canUnlock(world, entity, unlockEntity)) {
        unlockDoor(world, entity, unlockEntity);
      } else if (
        tradeEntity &&
        isTradable(world, tradeEntity) &&
        canTrade(world, entity, tradeEntity)
      ) {
        performTrade(world, entity, tradeEntity);
        collectItem(world, entity, tradeEntity);
      } else if (
        spawnEntity &&
        isRevivable(world, spawnEntity) &&
        canRevive(world, spawnEntity, entity)
      ) {
        reviveEntity(world, spawnEntity, entity);
      } else if (bowEntity) {
        shootArrow(world, entity, bowEntity);
      }
    }
  };

  return { onUpdate };
}
