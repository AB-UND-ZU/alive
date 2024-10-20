import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add } from "../../game/math/std";
import { PLAYER } from "../components/player";
import { REFERENCE } from "../components/reference";
import { getCell } from "./map";
import { Entity } from "ecs";
import { QUEST } from "../components/quest";
import { ACTIONABLE } from "../components/actionable";
import { MOVABLE } from "../components/movable";
import { LOCKABLE } from "../components/lockable";
import { Inventory, INVENTORY } from "../components/inventory";
import { ITEM } from "../components/item";
import { Tradable, TRADABLE } from "../components/tradable";
import { COUNTABLE } from "../components/countable";
import { isEnemy } from "./damage";
import { ANIMATABLE } from "../components/animatable";

export const getQuest = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) => QUEST in entity) as
    | Entity
    | undefined;

export const canAcceptQuest = (world: World, entity: Entity, quest: Entity) =>
  !isEnemy(world, quest) && !!getAvailableQuest(world, quest);

export const getAvailableQuest = (world: World, entity: Entity) =>
  entity[QUEST]?.available && entity[QUEST].name;

export const getLockable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (entity) => LOCKABLE in entity
  ) as Entity | undefined;

export const isLocked = (world: World, entity: Entity) =>
  !!entity[LOCKABLE]?.locked;

export const isUnlocked = (world: World, entity: Entity) =>
  entity[LOCKABLE]?.locked === false;

export const canUnlock = (world: World, entity: Entity, lockable: Entity) =>
  !lockable[ANIMATABLE].states.unlock &&
  (!lockable[LOCKABLE].material || !!getUnlockKey(world, entity, lockable));

export const getUnlockKey = (
  world: World,
  entity: Entity,
  lockable: Entity
) => {
  const material = lockable[LOCKABLE].material;
  const keyId = entity[INVENTORY].items.find((item: Entity) => {
    const itemEntity = world.getEntityById(item);
    return (
      itemEntity[ITEM].consume === "key" &&
      itemEntity[ITEM].material === material
    );
  });
  return keyId && world.getEntityById(keyId);
};

export const getTrade = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (entity) => TRADABLE in entity
  ) as Entity | undefined;

export const isTradable = (world: World, entity: Entity) =>
  entity[TRADABLE] && entity[TRADABLE].activation.length > 0;

export const canTrade = (world: World, entity: Entity, trade: Entity) =>
  isTradable(world, trade) &&
  (trade[TRADABLE] as Tradable).activation.every((item) => {
    // check if entity has sufficient count
    if (item.counter) return entity[COUNTABLE][item.counter] >= item.amount;
    // or if item is contained in inventory (and ignore amount)
    else
      return (entity[INVENTORY] as Inventory).items.some((itemId) => {
        const itemEntity = world.getEntityById(itemId);
        const matchesSlot =
          item.slot &&
          itemEntity[ITEM].slot === item.slot &&
          itemEntity[ITEM].material === item.material;
        const matchesConsume =
          item.consume &&
          itemEntity[ITEM].consume === item.consume &&
          itemEntity[ITEM].material === item.material;
        return matchesSlot || matchesConsume;
      });
  });

export default function setupAction(world: World) {
  let referenceGenerations = -1;

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
      let quest: Entity | undefined = undefined;
      let unlock: Entity | undefined = undefined;
      let trade: Entity | undefined = undefined;

      // check any adjacent actions
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          const delta = { x: offsetX, y: offsetY };
          const targetPosition = add(entity[POSITION], delta);
          const questEntity = getQuest(world, targetPosition);
          const lockableEntity = getLockable(world, targetPosition);
          const tradeEntity = getTrade(world, targetPosition);

          // only player can accept quests
          if (
            !quest &&
            questEntity &&
            PLAYER in entity &&
            getAvailableQuest(world, questEntity)
          )
            quest = questEntity;

          // only locked doors can be unlocked
          if (!unlock && lockableEntity && isLocked(world, lockableEntity))
            unlock = lockableEntity;

          // only pending trades can be bought
          if (!trade && tradeEntity && isTradable(world, tradeEntity))
            trade = tradeEntity;
        }
      }

      entity[ACTIONABLE].quest = quest && world.getEntityId(quest);
      entity[ACTIONABLE].unlock = unlock && world.getEntityId(unlock);
      entity[ACTIONABLE].trade = trade && world.getEntityId(trade);
    }
  };

  return { onUpdate };
}
