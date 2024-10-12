import { World } from "../ecs";
import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { Entity } from "ecs";
import { QUEST } from "../components/quest";
import { ACTIONABLE } from "../components/actionable";
import { MOVABLE } from "../components/movable";
import { entities } from "..";
import { ANIMATABLE } from "../components/animatable";
import { TOOLTIP } from "../components/tooltip";
import { Inventory, INVENTORY } from "../components/inventory";
import { ITEM } from "../components/item";
import { LOCKABLE } from "../components/lockable";
import { doorOpen } from "../../game/assets/sprites";
import { SPRITE } from "../components/sprite";
import { LIGHT } from "../components/light";
import { rerenderEntity } from "./renderer";
import { disposeEntity, updateWalkable } from "./map";
import { canTrade, canUnlock, getUnlockKey, isTradable } from "./action";
import { Tradable, TRADABLE } from "../components/tradable";
import { COUNTABLE } from "../components/countable";
import { getMaterialSprite } from "../../components/Entity/utils";
import { collectItem } from "./collect";

export const getAction = (world: World, entity: Entity) =>
  ACTIONABLE in entity &&
  (world.getEntityById(entity[ACTIONABLE].quest) ||
    world.getEntityById(entity[ACTIONABLE].unlock) ||
    world.getEntityById(entity[ACTIONABLE].trade));

export const unlockDoor = (world: World, entity: Entity) => {
  entity[LOCKABLE].locked = false;
  entity[SPRITE] = doorOpen;
  entity[LIGHT].orientation = "left";
  rerenderEntity(world, entity);
  updateWalkable(world, entity[POSITION]);
};

export const lockDoor = (world: World, entity: Entity) => {
  entity[LOCKABLE].locked = true;
  entity[SPRITE] = getMaterialSprite("door", entity[LOCKABLE].material);
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
  entity[INVENTORY].items.splice(itemIndex, 1);
};

export const performTrade = (world: World, entity: Entity, trade: Entity) => {
  // remove counters and items
  for (const activationItem of (trade[TRADABLE] as Tradable).activation) {
    if (activationItem.counter) {
      entity[COUNTABLE][activationItem.counter] -= activationItem.amount;
    } else {
      const tradedId = (entity[INVENTORY] as Inventory).items.find((itemId) => {
        const itemEntity = world.getEntityById(itemId);
        const matchesSlot =
          activationItem.slot &&
          itemEntity[ITEM].slot === activationItem.slot &&
          itemEntity[ITEM].material === activationItem.material;
        const matchesConsume =
          activationItem.consume &&
          itemEntity[ITEM].consume === activationItem.consume &&
          itemEntity[ITEM].material === activationItem.material;
        return matchesSlot || matchesConsume;
      });

      if (tradedId) {
        const tradedEntity = world.getEntityById(tradedId);
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
      const entityReference = world.getEntityById(entity[MOVABLE].reference)[
        RENDERABLE
      ].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      // skip if not actionable or not triggered
      if (!getAction(world, entity) || !entity[ACTIONABLE].triggered) continue;

      entity[ACTIONABLE].triggered = false;
      entity[MOVABLE].lastInteraction = entityReference;

      if (entity[ACTIONABLE].quest) {
        const questEntity = world.getEntityById(entity[ACTIONABLE].quest);

        // create reference frame for quest
        const animationEntity = entities.createFrame(world, {
          [REFERENCE]: {
            tick: -1,
            delta: 0,
            suspended: false,
            suspensionCounter: -1,
          },
          [RENDERABLE]: { generation: 1 },
        });
        entity[ANIMATABLE].states.quest = {
          name: questEntity[QUEST].name,
          reference: world.getEntityId(animationEntity),
          elapsed: 0,
          args: { step: "initial" },
          particles: {},
        };

        // remove quest from target
        world.removeQuest(questEntity);
      } else if (entity[ACTIONABLE].unlock) {
        const unlockEntity = world.getEntityById(entity[ACTIONABLE].unlock);

        // check if entity has correct key
        if (!canUnlock(world, entity, unlockEntity)) continue;

        // unlock door and remove key
        unlockDoor(world, unlockEntity);

        const keyEntity = getUnlockKey(world, entity, unlockEntity);
        if (keyEntity) {
          removeFromInventory(world, entity, keyEntity);
          disposeEntity(world, keyEntity);
        }

        rerenderEntity(world, entity);
      } else if (entity[ACTIONABLE].trade) {
        const tradeEntity = world.getEntityById(entity[ACTIONABLE].trade);

        if (
          !isTradable(world, tradeEntity) ||
          !canTrade(world, entity, tradeEntity)
        )
          continue;

        performTrade(world, entity, tradeEntity);
        collectItem(world, entity, tradeEntity);
      }
    }
  };

  return { onUpdate };
}
