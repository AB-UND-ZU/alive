import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { add } from "../../game/math/std";
import { PLAYER } from "../components/player";
import { REFERENCE } from "../components/reference";
import { getCell } from "./map";
import { Entity } from "ecs";
import { ACTIONABLE } from "../components/actionable";
import { MOVABLE } from "../components/movable";
import { LOCKABLE } from "../components/lockable";
import { INVENTORY } from "../components/inventory";
import { ITEM, rechargables } from "../components/item";
import { isDead, isEnemy } from "./damage";
import { canRevive, getRevivable } from "./fate";
import { getSequence } from "./sequence";
import { rerenderEntity } from "./renderer";
import { STATS } from "../components/stats";
import { TypedEntity } from "../entities";
import {
  getPopup,
  getTabSelections,
  isInPopup,
  isInTab,
  isPopupAvailable,
  isQuestCompleted,
} from "./popup";
import { WARPABLE } from "../components/warpable";
import { POPUP } from "../components/popup";
import { EQUIPPABLE } from "../components/equippable";
import { CONDITIONABLE } from "../components/conditionable";
import { FRAGMENT } from "../components/fragment";
import { EXERTABLE } from "../components/exertable";
import { CASTABLE } from "../components/castable";
import { SEQUENCABLE } from "../components/sequencable";
import { getItemSprite } from "../../game/assets/utils";
import { none } from "../../game/assets/sprites";
import { isControllable } from "./freeze";
import { BLOCKABLE } from "../components/blockable";
import { getIdentifier } from "../utils";
import { canDig, canPlant, getFarmable } from "./harvest";
import { forgingCompleted } from "../../game/balancing/forging";
import { canMount, getMountable } from "./vessel";

export const getBlockable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (entity) => BLOCKABLE in entity
  ) as Entity | undefined;

export const getWarpable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (entity) => WARPABLE in entity
  ) as Entity | undefined;

export const getLockable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (entity) => LOCKABLE in entity
  ) as Entity | undefined;

export const isLocked = (world: World, entity: Entity) =>
  !!entity[LOCKABLE]?.locked;

export const isUnlockable = (world: World, lockable: Entity) =>
  isLocked(world, lockable) && !getBlockable(world, lockable[POSITION]);

export const isUnlocked = (world: World, entity: Entity) =>
  entity[LOCKABLE]?.locked === false;

export const canUnlock = (world: World, entity: Entity, lockable: Entity) =>
  !getSequence(world, lockable, "unlock") &&
  (lockable[LOCKABLE].material === "wood" ||
    !!getUnlockKey(world, entity, lockable));

export const getUnlockKey = (
  world: World,
  entity: Entity,
  lockable: Entity
) => {
  const material = lockable[LOCKABLE].material;
  const element = lockable[LOCKABLE].element;
  const keyId = entity[INVENTORY].items.find((item: number) => {
    const itemEntity = world.assertByIdAndComponents(item, [ITEM]);
    return (
      itemEntity[ITEM].consume === "key" &&
      itemEntity[ITEM].material === material &&
      itemEntity[ITEM].element === element
    );
  });
  return keyId && world.getEntityById(keyId);
};

export const getUnlockSprite = (world: World, lockable: Entity) =>
  lockable[LOCKABLE].material === "wood"
    ? none
    : getItemSprite({
        consume: "key",
        material: lockable[LOCKABLE].material,
        element: lockable[LOCKABLE].element,
      });

export const getPendingTotem = (world: World, entity: Entity) => {
  const entityId = world.getEntityId(entity);
  return world
    .getEntities([CASTABLE, EXERTABLE, SEQUENCABLE])
    .find((castable) => {
      const auraSequence = getSequence(world, castable, "aura");

      if (!auraSequence || castable[CASTABLE].caster !== entityId) return false;

      return (
        auraSequence.name === "totemAura" && auraSequence.args.progress < 3
      );
    });
};

export const castableSpell = (
  world: World,
  entity: TypedEntity<"INVENTORY">,
  item: TypedEntity<"ITEM">
) => {
  const spell = item[ITEM].spell;
  const castableEntity =
    (entity[FRAGMENT] &&
      world.getEntityByIdAndComponents(entity[FRAGMENT].structure, [STATS])) ||
    entity;

  // check mana for spells
  if (castableEntity[STATS] && spell && castableEntity[STATS].mp >= 1)
    return true;

  return false;
};

export const castableSkill = (
  world: World,
  entity: TypedEntity<"INVENTORY" | "POSITION">,
  item: TypedEntity<"ITEM">
) => {
  if (!isControllable(world, entity)) return false;

  const skill = item[ITEM].skill;
  const tool = item[ITEM].tool;

  if (skill === "bow") {
    // check if there is arrows for a bow
    const hasArrow = entity[INVENTORY].items.some(
      (itemId) =>
        world.assertByIdAndComponents(itemId, [ITEM])[ITEM].stackable ===
        "arrow"
    );
    if (hasArrow) return true;
  } else if (rechargables.includes(skill as (typeof rechargables)[number])) {
    // check if there is charges for active items
    const hasCharge = entity[INVENTORY].items.some(
      (itemId) =>
        world.assertByIdAndComponents(itemId, [ITEM])[ITEM].stackable ===
        "charge"
    );
    const activeCondition =
      (skill === "zap" && entity[CONDITIONABLE]?.zap) ||
      (skill === "block" && entity[CONDITIONABLE]?.block);
    const pendingTotem = skill === "totem" && !!getPendingTotem(world, entity);
    const missingSword = skill === "slash" && !entity[EQUIPPABLE]?.weapon;

    if (hasCharge && !activeCondition && !pendingTotem && !missingSword)
      return true;
  } else if (skill === "spear" && item[ITEM].material) {
    return true;
  } else if (skill === "wand" && item[ITEM].material) {
    return true;
  } else if (tool === "axe" && item[ITEM].material) {
    return true;
  } else if (tool === "shovel" && item[ITEM].material) {
    return canDig(world, entity, entity[POSITION]);
  } else if (tool === "pickaxe" && item[ITEM].material) {
    return true;
  } else if (tool === "hook") {
    const hookCondition = entity[CONDITIONABLE]?.hook;
    const hookSequence = getSequence(world, entity, "condition");
    const hasWorm = entity[INVENTORY].items.some(
      (itemId) =>
        world.assertByIdAndComponents(itemId, [ITEM])[ITEM].stackable === "worm"
    );
    if (
      (!hookCondition && hasWorm) ||
      (hookCondition && !hookCondition.orientation) ||
      (hookCondition &&
        hookSequence &&
        hookCondition.amount === hookCondition.modifier &&
        hookSequence.args.modifier > 0)
    ) {
      return true;
    }
  } else if (tool === "hammer") {
    return !isInPopup(world, entity);
  }

  return false;
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
    ])) {
      let action: Entity | undefined = undefined;
      let warp: Entity | undefined = undefined;
      let unlock: Entity | undefined = undefined;
      let plant: Entity | undefined = undefined;
      let mount: Entity | undefined = undefined;
      let popup: Entity | undefined = undefined;
      let trade: Entity | undefined = undefined;
      let add_: Entity | undefined = undefined;
      let spawn: Entity | undefined = undefined;

      // check direct actions

      // tombstones can revive player
      const spawnEntity = getRevivable(world, entity[POSITION]);
      if (isDead(world, entity)) {
        if (spawnEntity && canRevive(world, spawnEntity, entity)) {
          spawn = spawnEntity;
          action = spawn;
        }
      } else {
        const farmable = getFarmable(world, entity[POSITION]);
        if (canPlant(world, entity)) {
          plant = farmable;
          action = plant;
        }

        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
            // check any adjacent actions
            const delta = { x: offsetX, y: offsetY };
            const targetPosition = add(entity[POSITION], delta);
            const warpableEntity = getWarpable(world, targetPosition);
            const lockableEntity = getLockable(world, targetPosition);
            const adjacentPopup = getPopup(world, targetPosition);
            const mountableEntity = getMountable(world, targetPosition);
            const popupEntity =
              adjacentPopup === entity ? undefined : adjacentPopup;
            const selections = popupEntity
              ? getTabSelections(world, popupEntity)
              : [];
            const tradeEntity = popupEntity;
            const addEntity = popupEntity;

            // portals can warp players
            if (
              !action &&
              entity[PLAYER] &&
              warpableEntity &&
              isInTab(world, entity, "warp")
            ) {
              warp = warpableEntity;
              action = warp;
            }

            // players can mount vessels
            if (
              !action &&
              entity[PLAYER] &&
              mountableEntity &&
              canMount(world, entity, mountableEntity)
            ) {
              mount = mountableEntity;
              action = mount;
            }

            // only locked doors can be unlocked
            if (
              !action &&
              lockableEntity &&
              !isInPopup(world, entity) &&
              isUnlockable(world, lockableEntity) &&
              !isEnemy(world, entity) &&
              !isDead(world, entity)
            ) {
              unlock = lockableEntity;
              action = unlock;
            }

            // only available popups can be opened when not already viewing one
            if (
              !action &&
              entity[PLAYER] &&
              !isInPopup(world, entity) &&
              popupEntity &&
              isPopupAvailable(world, popupEntity) &&
              entity !== popupEntity
            ) {
              popup = popupEntity;
              action = popup;
            }

            // trading only while in shops or finished forging
            if (
              !action &&
              entity[PLAYER] &&
              tradeEntity &&
              (isInTab(world, entity, "buy") ||
                isInTab(world, entity, "sell") ||
                (isInTab(world, entity, "forge") &&
                  selections.length === 3 &&
                  forgingCompleted(popupEntity)) ||
                isInTab(world, entity, "craft") ||
                (isInTab(world, entity, "brew") && selections.length === 2) ||
                (isInTab(world, entity, "quest") &&
                  isQuestCompleted(world, entity, tradeEntity) &&
                  ((selections.length === 0 &&
                    tradeEntity[POPUP].choices.length === 0) ||
                    selections.length === 1)))
            ) {
              trade = tradeEntity;
              action = trade;
            }

            // adding only while in certain popup states
            if (
              !action &&
              entity[PLAYER] &&
              addEntity &&
              ((isInTab(world, entity, "forge") && selections.length < 3) ||
                (isInTab(world, entity, "brew") && selections.length < 2) ||
                ((isInTab(world, entity, "class") ||
                  isInTab(world, entity, "style")) &&
                  selections.length <= 1) ||
                (isInTab(world, entity, "quest") &&
                  ((!isQuestCompleted(world, entity, addEntity) &&
                    selections.length === 0 &&
                    addEntity[POPUP].focuses[
                      addEntity[POPUP].horizontalIndex
                    ]) ||
                    (isQuestCompleted(world, entity, addEntity) &&
                      selections.length === 0 &&
                      addEntity[POPUP].choices.length > 0))))
            ) {
              add_ = addEntity;
              action = add_;
            }
          }
        }
      }

      // check inventory actions
      const castableEntity = entity[FRAGMENT]
        ? world.getEntityByIdAndComponents(entity[FRAGMENT].structure, [
            EQUIPPABLE,
          ])
        : entity;
      const spell = world.getEntityById(castableEntity?.[EQUIPPABLE]?.spell);
      const skill = world.getEntityById(castableEntity?.[EQUIPPABLE]?.skill);
      const tool = world.getEntityById(castableEntity?.[EQUIPPABLE]?.tool);

      const usePopup = getIdentifier(world, "use");
      const currentPopup = world.getEntityByIdAndComponents(
        entity[PLAYER]?.popup,
        [POPUP]
      );
      const popupSelections = currentPopup
        ? getTabSelections(world, currentPopup)
        : [];

      const useId =
        usePopup &&
        (isInTab(world, entity, "inspect") || isInTab(world, entity, "equip"))
          ? world.getEntityId(usePopup)
          : currentPopup &&
            isInTab(world, entity, "forge") &&
            popupSelections.length === 3 &&
            !forgingCompleted(currentPopup)
          ? world.getEntityId(currentPopup)
          : undefined;

      if (
        !action &&
        usePopup &&
        (isInTab(world, entity, "plant") ||
          isInTab(world, entity, "build") ||
          (isInTab(world, entity, "use") &&
            getTabSelections(world, usePopup).length <= 2))
      ) {
        add_ = usePopup;
        action = add_;
      }

      const warpId = warp && world.getEntityId(warp);
      const unlockId = unlock && world.getEntityId(unlock);
      const plantId = plant && world.getEntityId(plant);
      const mountId = mount && world.getEntityId(mount);
      const popupId = popup && world.getEntityId(popup);
      const tradeId = trade && world.getEntityId(trade);
      const addId = add_ && world.getEntityId(add_);
      const spawnId = spawn && world.getEntityId(spawn);
      const spellId = spell && world.getEntityId(spell);
      const skillId = skill && world.getEntityId(skill);
      const toolId = tool && world.getEntityId(tool);

      if (
        entity[ACTIONABLE].warp !== warpId ||
        entity[ACTIONABLE].unlock !== unlockId ||
        entity[ACTIONABLE].plant !== plantId ||
        entity[ACTIONABLE].mount !== mountId ||
        entity[ACTIONABLE].popup !== popupId ||
        entity[ACTIONABLE].trade !== tradeId ||
        entity[ACTIONABLE].use !== useId ||
        entity[ACTIONABLE].add !== addId ||
        entity[ACTIONABLE].spawn !== spawnId ||
        entity[ACTIONABLE].spell !== spellId ||
        entity[ACTIONABLE].skill !== skillId ||
        entity[ACTIONABLE].tool !== toolId
      ) {
        entity[ACTIONABLE].warp = warpId;
        entity[ACTIONABLE].unlock = unlockId;
        entity[ACTIONABLE].plant = plantId;
        entity[ACTIONABLE].mount = mountId;
        entity[ACTIONABLE].popup = popupId;
        entity[ACTIONABLE].trade = tradeId;
        entity[ACTIONABLE].use = useId;
        entity[ACTIONABLE].add = addId;
        entity[ACTIONABLE].spawn = spawnId;
        entity[ACTIONABLE].spell = spellId;
        entity[ACTIONABLE].skill = skillId;
        entity[ACTIONABLE].tool = toolId;
        rerenderEntity(world, entity);
      }
    }
  };

  return { onUpdate };
}
