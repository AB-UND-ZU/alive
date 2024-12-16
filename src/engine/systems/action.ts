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
import { INVENTORY } from "../components/inventory";
import { ITEM } from "../components/item";
import { Tradable, TRADABLE } from "../components/tradable";
import { isDead, isEnemy } from "./damage";
import { canRevive, getRevivable } from "./fate";
import { getSequence } from "./sequence";
import { rerenderEntity } from "./renderer";
import { STATS } from "../components/stats";
import { TypedEntity } from "../entities";
import { EQUIPPABLE } from "../components/equippable";

export const getQuest = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find((entity) => QUEST in entity) as
    | Entity
    | undefined;

export const canAcceptQuest = (world: World, entity: Entity, quest: Entity) =>
  PLAYER in entity &&
  !isDead(world, entity) &&
  !isEnemy(world, quest) &&
  !!getAvailableQuest(world, quest);

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
  !getSequence(world, lockable, "unlock") &&
  (!lockable[LOCKABLE].material || !!getUnlockKey(world, entity, lockable));

export const getUnlockKey = (
  world: World,
  entity: Entity,
  lockable: Entity
) => {
  const material = lockable[LOCKABLE].material;
  const keyId = entity[INVENTORY].items.find((item: number) => {
    const itemEntity = world.assertByIdAndComponents(item, [ITEM]);
    return (
      itemEntity[ITEM].consume === "key" &&
      itemEntity[ITEM].material === material
    );
  });
  return keyId && world.getEntityById(keyId);
};

export const getTradable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (entity) => TRADABLE in entity
  ) as Entity | undefined;

export const isTradable = (world: World, entity: Entity) =>
  entity[TRADABLE] && entity[TRADABLE].activation.length > 0;

export const canTrade = (world: World, entity: Entity, trade: Entity) =>
  isTradable(world, trade) &&
  (trade[TRADABLE] as Tradable).activation.every((activationItem) => {
    if (activationItem.stat) {
      // check if entity has sufficient of stat
      return entity[STATS][activationItem.stat] >= activationItem.amount;
    } else {
      // or if item is contained in inventory or equipments
      const items = [...entity[INVENTORY].items, ...Object.values(entity[EQUIPPABLE]).filter(Boolean)];
      return items.some((itemId) => {
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
    }
  });

export const getAvailableActive = (
  world: World,
  entity: TypedEntity<"INVENTORY">
) => {
  const itemEntity = world.getEntityByIdAndComponents(
    entity[INVENTORY].items.find(
      (itemId) =>
        world.assertByIdAndComponents(itemId, [ITEM])[ITEM].equipment ===
        "active"
    ),
    [ITEM]
  );

  const active = itemEntity?.[ITEM].active;

  if (!active) return;

  if (active === "bow") {
    // check if there is arrows for a bow
    const hasArrow = entity[INVENTORY].items.some(
      (itemId) =>
        world.assertByIdAndComponents(itemId, [ITEM])[ITEM].stackable ===
        "arrow"
    );
    if (hasArrow) return itemEntity;
  } else if (active === "slash" || active === "block") {
    // check if there is charges for active items
    const hasCharge = entity[INVENTORY].items.some(
      (itemId) =>
        world.assertByIdAndComponents(itemId, [ITEM])[ITEM].stackable ===
        "charge"
    );
    if (hasCharge) return itemEntity;
  } else if (entity[STATS]) {
    // check mana for spells
    if (active.endsWith("1") && entity[STATS].mp >= 1) return itemEntity;
    if (active.endsWith("2") && entity[STATS].mp >= 2) return itemEntity;
  }
};

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
      INVENTORY,
    ])) {
      let quest: Entity | undefined = undefined;
      let unlock: Entity | undefined = undefined;
      let trade: Entity | undefined = undefined;
      let spawn: Entity | undefined = undefined;

      // check any adjacent actions
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
          const delta = { x: offsetX, y: offsetY };
          const targetPosition = add(entity[POSITION], delta);
          const questEntity = getQuest(world, targetPosition);
          const lockableEntity = getLockable(world, targetPosition);
          const tradeEntity = getTradable(world, targetPosition);

          // only player can accept quests
          if (
            !quest &&
            questEntity &&
            canAcceptQuest(world, entity, questEntity) &&
            !isDead(world, entity)
          )
            quest = questEntity;

          // only locked doors can be unlocked
          if (
            !unlock &&
            lockableEntity &&
            isLocked(world, lockableEntity) &&
            !isDead(world, entity)
          )
            unlock = lockableEntity;

          // only pending trades can be bought
          if (
            !trade &&
            tradeEntity &&
            isTradable(world, tradeEntity) &&
            !isDead(world, entity)
          )
            trade = tradeEntity;
        }
      }

      // tombstones can revive player
      const spawnEntity = getRevivable(world, entity[POSITION]);
      if (
        isDead(world, entity) &&
        spawnEntity &&
        canRevive(world, spawnEntity, entity)
      )
        spawn = spawnEntity;

      // check inventory actions
      const active = getAvailableActive(world, entity);

      const questId = quest && world.getEntityId(quest);
      const unlockId = unlock && world.getEntityId(unlock);
      const tradeId = trade && world.getEntityId(trade);
      const spawnId = spawn && world.getEntityId(spawn);
      const activeId = active && world.getEntityId(active);

      if (
        entity[ACTIONABLE].quest !== questId ||
        entity[ACTIONABLE].unlock !== unlockId ||
        entity[ACTIONABLE].trade !== tradeId ||
        entity[ACTIONABLE].spawn !== spawnId ||
        entity[ACTIONABLE].active !== activeId
      ) {
        entity[ACTIONABLE].quest = questId;
        entity[ACTIONABLE].unlock = unlockId;
        entity[ACTIONABLE].trade = tradeId;
        entity[ACTIONABLE].spawn = spawnId;
        entity[ACTIONABLE].active = activeId;
        rerenderEntity(world, entity);
      }
    }
  };

  return { onUpdate };
}
