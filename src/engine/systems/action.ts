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
import { ITEM, materials } from "../components/item";
import { isDead, isEnemy, isNpc } from "./damage";
import { canRevive, getRevivable } from "./fate";
import { getSequence } from "./sequence";
import { rerenderEntity } from "./renderer";
import { STATS } from "../components/stats";
import { TypedEntity } from "../entities";
import {
  getPopup,
  getTabSelections,
  getVerticalIndex,
  isInPopup,
  isInTab,
  isPopupAvailable,
  isQuestCompleted,
} from "./popup";
import { WARPABLE } from "../components/warpable";
import { POPUP } from "../components/popup";
import { EQUIPPABLE } from "../components/equippable";
import { HARVESTABLE } from "../components/harvestable";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";
import { getLootable } from "./collect";
import { CONDITIONABLE } from "../components/conditionable";

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
  const keyId = entity[INVENTORY].items.find((item: number) => {
    const itemEntity = world.assertByIdAndComponents(item, [ITEM]);
    return (
      itemEntity[ITEM].consume === "key" &&
      itemEntity[ITEM].material === material
    );
  });
  return keyId && world.getEntityById(keyId);
};

export const getHarvestable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (entity) => HARVESTABLE in entity
  ) as Entity | undefined;

export const getHarvestTarget = (
  world: World,
  entity: Entity,
  tool: Entity
) => {
  // check if pointing to something harvestable
  const orientation = entity[ORIENTABLE]?.facing as Orientation;

  if (!orientation || !entity[POSITION]) return;

  const target = add(entity[POSITION], orientationPoints[orientation]);
  const harvestable = getHarvestable(world, target);
  const lootable = getLootable(world, target);

  if (
    lootable ||
    !harvestable ||
    harvestable[HARVESTABLE].resource !== "tree" ||
    harvestable[HARVESTABLE].amount <= 0 ||
    materials.indexOf(harvestable[HARVESTABLE].material) >
      materials.indexOf(tool[ITEM].material)
  )
    return;

  return harvestable;
};

export const castablePrimary = (
  world: World,
  entity: TypedEntity<"INVENTORY">,
  item: TypedEntity<"ITEM">
) => {
  const primary = item[ITEM].primary;

  // check mana for spells
  if (entity[STATS] && primary && entity[STATS].mp >= 1) return true;

  return false;
};

export const castableSecondary = (
  world: World,
  entity: TypedEntity<"INVENTORY">,
  item: TypedEntity<"ITEM">
) => {
  if (isNpc(world, entity)) return true;

  const secondary = item[ITEM].secondary;

  if (secondary === "bow") {
    // check if there is arrows for a bow
    const hasArrow = entity[INVENTORY].items.some(
      (itemId) =>
        world.assertByIdAndComponents(itemId, [ITEM])[ITEM].stackable ===
        "arrow"
    );
    if (hasArrow) return true;
  } else if (secondary === "slash" || secondary === "raise") {
    // check if there is charges for active items
    const hasCharge = entity[INVENTORY].items.some(
      (itemId) =>
        world.assertByIdAndComponents(itemId, [ITEM])[ITEM].stackable ===
        "charge"
    );
    const activeCondition =
      secondary === "raise" && entity[CONDITIONABLE]?.raise;
    if (hasCharge && !activeCondition) return true;
  } else if (secondary === "axe" && item[ITEM].material) {
    // check if pointing to something harvestable
    return !!getHarvestTarget(world, entity, item);
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
      INVENTORY,
    ])) {
      let warp: Entity | undefined = undefined;
      let unlock: Entity | undefined = undefined;
      let popup: Entity | undefined = undefined;
      let trade: Entity | undefined = undefined;
      let use: Entity | undefined = undefined;
      let add_: Entity | undefined = undefined;
      let close: Entity | undefined = world.getEntityById(
        entity[PLAYER]?.popup
      );
      let spawn: Entity | undefined = undefined;

      // check direct actions

      // tombstones can revive player
      const spawnEntity = getRevivable(world, entity[POSITION]);
      if (isDead(world, entity)) {
        if (spawnEntity && canRevive(world, spawnEntity, entity)) {
          spawn = spawnEntity;
        }
      } else {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
            // check any adjacent actions
            const delta = { x: offsetX, y: offsetY };
            const targetPosition = add(entity[POSITION], delta);
            const warpableEntity = getWarpable(world, targetPosition);
            const lockableEntity = getLockable(world, targetPosition);
            const adjacentPopup = getPopup(world, targetPosition);
            const popupEntity =
              adjacentPopup === entity ? undefined : adjacentPopup;
            const selections = popupEntity
              ? getTabSelections(world, popupEntity)
              : [];
            const tradeEntity = popupEntity;
            const useEntity = entity;
            const addEntity = popupEntity;

            // portals can warp players
            if (
              !warp &&
              entity[PLAYER] &&
              warpableEntity &&
              isInTab(world, entity, "warp")
            ) {
              warp = warpableEntity;
            }

            // only locked doors can be unlocked
            if (
              !unlock &&
              lockableEntity &&
              !isInPopup(world, entity) &&
              isLocked(world, lockableEntity) &&
              !isEnemy(world, entity) &&
              !isDead(world, entity)
            )
              unlock = lockableEntity;

            // only available popups can be opened when not already viewing one
            if (
              !popup &&
              entity[PLAYER] &&
              !isInPopup(world, entity) &&
              popupEntity &&
              isPopupAvailable(world, popupEntity) &&
              entity !== popupEntity
            )
              popup = popupEntity;

            // trading only while in shops or finished forging
            if (
              !trade &&
              entity[PLAYER] &&
              tradeEntity &&
              (isInTab(world, entity, "buy") ||
                isInTab(world, entity, "sell") ||
                (isInTab(world, entity, "forge") && selections.length === 2) ||
                (isInTab(world, entity, "craft") && selections.length === 1) ||
                (isInTab(world, entity, "quest") &&
                  isQuestCompleted(world, entity, tradeEntity) &&
                  ((selections.length === 0 &&
                    tradeEntity[POPUP].choices.length === 0) ||
                    selections.length === 1)))
            )
              trade = tradeEntity;

            // using only while in inspect
            if (
              !use &&
              entity[PLAYER] &&
              useEntity &&
              isInTab(world, entity, "inspect")
            )
              use = useEntity;

            // adding only while in certain popup states
            if (
              !use &&
              entity[PLAYER] &&
              addEntity &&
              ((isInTab(world, entity, "forge") && selections.length < 2) ||
                (isInTab(world, entity, "craft") && selections.length < 1) ||
                (isInTab(world, entity, "class") && selections.length < 1) ||
                (isInTab(world, entity, "quest") &&
                  ((!isQuestCompleted(world, entity, addEntity) &&
                    ((selections.length === 0 &&
                      addEntity[POPUP].objectives.length > 0) ||
                      (selections.length === 1 &&
                        addEntity[POPUP].objectives[
                          getVerticalIndex(world, addEntity)
                        ].identifier))) ||
                    (isQuestCompleted(world, entity, addEntity) &&
                      selections.length === 0 &&
                      addEntity[POPUP].choices.length > 0))))
            )
              add_ = addEntity;
          }
        }
      }

      // check inventory actions
      const primary = world.getEntityById(entity[EQUIPPABLE]?.primary);
      const secondary = world.getEntityById(entity[EQUIPPABLE]?.secondary);

      const warpId = warp && world.getEntityId(warp);
      const unlockId = unlock && world.getEntityId(unlock);
      const popupId = popup && world.getEntityId(popup);
      const tradeId = trade && world.getEntityId(trade);
      const useId = use && world.getEntityId(use);
      const addId = add_ && world.getEntityId(add_);
      const closeId = close && world.getEntityId(close);
      const spawnId = spawn && world.getEntityId(spawn);
      const primaryId = primary && world.getEntityId(primary);
      const secondaryId =
        !isEnemy(world, entity) &&
        (warpId || unlockId || popupId || tradeId || useId || addId || spawnId)
          ? undefined
          : secondary && world.getEntityId(secondary);

      if (
        entity[ACTIONABLE].warp !== warpId ||
        entity[ACTIONABLE].unlock !== unlockId ||
        entity[ACTIONABLE].popup !== popupId ||
        entity[ACTIONABLE].trade !== tradeId ||
        entity[ACTIONABLE].use !== useId ||
        entity[ACTIONABLE].add !== addId ||
        entity[ACTIONABLE].close !== closeId ||
        entity[ACTIONABLE].spawn !== spawnId ||
        entity[ACTIONABLE].primary !== primaryId ||
        entity[ACTIONABLE].secondary !== secondaryId
      ) {
        entity[ACTIONABLE].warp = warpId;
        entity[ACTIONABLE].unlock = unlockId;
        entity[ACTIONABLE].popup = popupId;
        entity[ACTIONABLE].trade = tradeId;
        entity[ACTIONABLE].use = useId;
        entity[ACTIONABLE].add = addId;
        entity[ACTIONABLE].close = closeId;
        entity[ACTIONABLE].spawn = spawnId;
        entity[ACTIONABLE].primary = primaryId;
        entity[ACTIONABLE].secondary = secondaryId;
        rerenderEntity(world, entity);
      }
    }
  };

  return { onUpdate };
}
