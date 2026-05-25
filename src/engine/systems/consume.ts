import { World } from "../ecs";
import { RENDERABLE } from "../components/renderable";
import { Entity } from "ecs";
import { Consumable, ITEM, Material, Stackable } from "../components/item";
import { Inventory, INVENTORY } from "../components/inventory";
import { PLAYER } from "../components/player";
import { Countable, STATS, UnitStats } from "../components/stats";
import { TypedEntity } from "../entities";
import { rerenderEntity } from "./renderer";
import { removeFromInventory } from "./trigger";
import { getMaxCounter, none } from "../../game/assets/sprites";
import { createSequence, getSequence } from "./sequence";
import { ConsumeSequence, VisionSequence } from "../components/sequencable";
import { MOVABLE } from "../components/movable";
import { entities } from "..";
import { REFERENCE } from "../components/reference";
import { getEntityHaste, getHasteInterval } from "./movement";
import { NPC } from "../components/npc";
import { POPUP } from "../components/popup";
import { addToInventory } from "./collect";
import { SPRITE } from "../components/sprite";
import { getVerticalIndex } from "./popup";
import { LEVEL } from "../components/level";
import { isInside } from "./enter";
import { calculateVision, getEntityVision } from "./visibility";
import { LIGHT } from "../components/light";
import { createItemAsDrop } from "./drop";
import { POSITION } from "../components/position";
import { getEntityEquipmentStats } from "./damage";
import { clamp } from "../../game/math/std";
import { slots } from "../components/equippable";

export const isConsumable = (world: World, entity: Entity) =>
  !!entity[ITEM]?.consume;

export const getConsumables = (world: World, entity: Entity) =>
  (entity[INVENTORY].items || [])
    .map((itemId: number) => world.assertByIdAndComponents(itemId, [ITEM]))
    .filter(
      (consumable: Entity) =>
        isConsumable(world, consumable) &&
        (!entity[NPC] || consumable[ITEM].bound)
    ) as TypedEntity<"ITEM">[];

export const defaultLight = calculateVision(0);
export const torchLight = calculateVision(3);
export const spawnLight = calculateVision(6);
export const roomLight = calculateVision(23);

export const consumptionConfigs: Partial<
  Record<
    Consumable,
    Partial<
      Record<
        Material,
        Partial<
          Record<
            keyof UnitStats,
            {
              cooldown: number;
              amount: number;
              countable: keyof Countable;
              buffer: number; // leave a few countables open so the player can still manually restore stats without wasting consumable
            }
          >
        >
      >
    >
  >
> = {
  potion: {
    wood: {
      hp: { cooldown: 5, amount: 2, countable: "hp", buffer: 2 },
      mp: { cooldown: 5, amount: 1, countable: "mp", buffer: 2 },
    },
    iron: {
      hp: { cooldown: 8, amount: 5, countable: "hp", buffer: 2 },
      mp: { cooldown: 8, amount: 2, countable: "mp", buffer: 2 },
    },
    gold: {
      hp: { cooldown: 10, amount: 8, countable: "hp", buffer: 2 },
      mp: { cooldown: 10, amount: 3, countable: "mp", buffer: 2 },
    },
  },
};

export type StackableConsumption = {
  amount: number;
  percentage?: boolean;
  countable: keyof Countable;
};
export type ItemConsumption = StackableConsumption & {
  item: TypedEntity<"ITEM">;
};

export const stackableConsumptions: Partial<
  Record<Stackable, StackableConsumption>
> = {
  apple: { countable: "hp", amount: 2 },
  shroom: { countable: "mp", amount: 1 },
  banana: { countable: "hp", amount: 5 },
  coconut: { countable: "mp", amount: 2 },
  fruit: { countable: "hp", amount: 5 },
  herb: { countable: "mp", amount: 2 },
  seed: { countable: "xp", amount: 1 },

  bread: { countable: "hp", amount: 5 },

  salmon: { countable: "hp", amount: 5 },
  pike: { countable: "mp", amount: 2 },
  tuna: { countable: "hp", amount: 8 },
  cod: { countable: "mp", amount: 3 },
  algae: { countable: "xp", amount: 1 },
  eel: { countable: "xp", amount: 3 },

  soup: { countable: "mp", amount: 25, percentage: true },
  curry: { countable: "mp", amount: 20, percentage: true },
  tea: { countable: "mp", amount: 15, percentage: true },
  toast: { countable: "hp", amount: 25, percentage: true },
  juice: { countable: "hp", amount: 20, percentage: true },
  granola: { countable: "hp", amount: 15, percentage: true },
};

export const getConsumption = (
  world: World,
  entity: Entity,
  target: Entity
) => {
  const bagItems = entity[INVENTORY]
    ? (entity[INVENTORY] as Inventory).items.filter(
        (item) =>
          !slots.some(
            (slot) => world.assertByIdAndComponents(item, [ITEM])[ITEM][slot]
          )
      )
    : [];

  if (bagItems.length === 0 || !target[POPUP]) return;

  const item = world.getEntityByIdAndComponents(
    bagItems[getVerticalIndex(world, target)],
    [ITEM]
  );

  if (!item) return;

  return getItemConsumption(item);
};

export const getItemConsumption = (
  item: Entity
): ItemConsumption | undefined => {
  const consumption =
    item[ITEM].stackable &&
    stackableConsumptions[item[ITEM].stackable as Stackable];

  return consumption ? { ...consumption, item } : undefined;
};

export const consumeItem = (
  world: World,
  entity: Entity,
  consumption?: ItemConsumption
) => {
  let consumed = false;

  if (!consumption) return consumed;

  // remove from inventory
  consumption.item[ITEM].amount -= 1;

  if (consumption.item[ITEM].amount === 0) {
    removeFromInventory(world, entity, consumption.item);
    consumed = true;
  }

  rerenderEntity(world, entity);

  // add stats
  const amount = consumption.percentage
    ? Math.round(
        (entity[STATS][
          getMaxCounter(consumption.countable) || consumption.countable
        ] *
          consumption.amount) /
          100
      )
    : consumption.amount;
  const itemData = {
    [ITEM]: {
      stat: consumption.countable,
      carrier: -1,
      bound: false,
      amount,
    },
    [RENDERABLE]: { generation: 0 },
    [SPRITE]: none,
  };

  if (consumption.countable === "xp") {
    createItemAsDrop(
      world,
      { ...entity[POSITION] },
      entities.createItem,
      itemData,
      false
    );
  } else {
    const countableItem = entities.createItem(world, itemData);
    addToInventory(world, entity, countableItem, itemData[ITEM].amount);
  }

  return consumed;
};

export default function setupConsume(world: World) {
  let worldGeneration = -1;
  let worldName = "";
  let nextConsumptions: Record<number, Record<number, number>> = {};
  let entityHaste: Record<number, number> = {};
  let entityVision: Record<number, number> = {};
  let entityHp: Record<number, number> = {};
  let entityMp: Record<number, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world.metadata.gameEntity[RENDERABLE].generation;

    if (worldGeneration === generation) return;

    worldGeneration = generation;

    if (worldName !== world.metadata.gameEntity[LEVEL].name) {
      worldName = world.metadata.gameEntity[LEVEL].name;
      nextConsumptions = {};
      entityHaste = {};
      entityVision = {};
    }

    // process consumable items in inventory
    for (const entity of world.getEntities([INVENTORY, STATS])) {
      // skip if currently consuming or unit
      if (
        getSequence(world, entity, "consume") ||
        (!entity[PLAYER] && !entity[NPC])
      )
        continue;

      const entityId = world.getEntityId(entity);
      const consumptions = [];
      for (const consumable of getConsumables(world, entity)) {
        const consumableId = world.getEntityId(consumable);
        const consumptionConfig =
          consumptionConfigs[consumable[ITEM].consume!]?.[
            consumable[ITEM].material!
          ]?.[consumable[ITEM].stat!];
        const maxCounter =
          consumptionConfig && getMaxCounter(consumptionConfig.countable);

        if (!consumptionConfig || !maxCounter) continue;

        // ensure consumable is needed
        const currentCountable = entity[STATS][consumptionConfig.countable];
        const maxCountable = entity[STATS][maxCounter];
        const nextConsumption = nextConsumptions[entityId]?.[consumableId];

        if (
          currentCountable +
            consumptionConfig.amount +
            consumptionConfig.buffer >
          maxCountable
        ) {
          if (nextConsumption) {
            delete nextConsumptions[entityId][consumableId];
          }
          continue;
        }

        // ensure consumable is not already scheduled
        if (nextConsumption && nextConsumption <= worldGeneration) {
          consumptions.push({
            consumable,
            countable: consumptionConfig.countable,
            amount: consumptionConfig.amount,
            percentage: currentCountable / maxCountable,
          });
        } else if (!nextConsumption) {
          const entityConsumptions = nextConsumptions[entityId] || {};
          nextConsumptions[entityId] = entityConsumptions;
          entityConsumptions[consumableId] =
            worldGeneration + consumptionConfig.cooldown * 3;
        }
      }

      consumptions.sort((left, right) => left.percentage - right.percentage);
      const consumption = consumptions[0];

      if (!consumption) continue;

      consumption.consumable[ITEM].amount -= 1;
      rerenderEntity(world, entity);
      delete nextConsumptions[entityId];

      if (consumption.consumable[ITEM].amount === 0) {
        removeFromInventory(world, entity, consumption.consumable);
      }

      createSequence<"consume", ConsumeSequence>(
        world,
        entity,
        "consume",
        "flaskConsume",
        { itemId: world.getEntityId(consumption.consumable) }
      );
    }

    // process changes in stats
    for (const entity of world.getEntities([PLAYER, STATS, MOVABLE])) {
      const entityId = world.getEntityId(entity);
      const haste = getEntityHaste(world, entity);
      const vision = getEntityVision(world, entity);
      const equipmentStats = getEntityEquipmentStats(world, entity);
      const frame = world.assertByIdAndComponents(entity[MOVABLE].reference, [
        REFERENCE,
        RENDERABLE,
      ]);

      if (haste !== entityHaste[entityId]) {
        frame[REFERENCE].tick = getHasteInterval(world, haste);
        entityHaste[entityId] = haste;
      }

      if (vision.visibility !== entityVision[entityId] && entity[LIGHT]) {
        if (
          entity[LIGHT].visibility !== vision.visibility &&
          !isInside(world, entity) &&
          !getSequence(world, entity, "vision")
        ) {
          createSequence<"vision", VisionSequence>(
            world,
            entity,
            "vision",
            "changeRadius",
            {
              fast: false,
              light: vision,
            }
          );
        }
        entityHaste[entityId] = vision.visibility;
      }

      const maxHp = equipmentStats.maxHp;
      if (maxHp !== entityHp[entityId]) {
        const hpDelta = maxHp - (entityHp[entityId] || 0);
        entityHp[entityId] = maxHp;
        entity[STATS].maxHp = clamp(
          entity[STATS].maxHp + hpDelta,
          1,
          entity[STATS].maxHpCap
        );
        entity[STATS].hp = clamp(entity[STATS].hp, 0, entity[STATS].maxHp);
        rerenderEntity(world, entity);
      }

      const maxMp = equipmentStats.maxMp;
      if (maxMp !== entityMp[entityId]) {
        const mpDelta = maxMp - (entityMp[entityId] || 0);
        entityMp[entityId] = maxMp;
        entity[STATS].maxMp = clamp(
          entity[STATS].maxMp + mpDelta,
          0,
          entity[STATS].maxMpCap
        );
        entity[STATS].mp = clamp(entity[STATS].mp, 0, entity[STATS].maxMp);
        rerenderEntity(world, entity);
      }
    }
  };

  return { onUpdate };
}
