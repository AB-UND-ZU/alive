import { World } from "../ecs";
import { RENDERABLE } from "../components/renderable";
import { Entity } from "ecs";
import {
  Consumable,
  Element,
  ITEM,
  Material,
  Stackable,
} from "../components/item";
import { Inventory, INVENTORY } from "../components/inventory";
import { PLAYER } from "../components/player";
import { Countable, STATS } from "../components/stats";
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

export const isConsumable = (world: World, entity: Entity) =>
  !!entity[ITEM]?.consume;

export const getConsumables = (world: World, entity: Entity) =>
  (entity[INVENTORY].items || [])
    .map((itemId: number) => world.assertByIdAndComponents(itemId, [ITEM]))
    .filter((consumable: Entity) =>
      isConsumable(world, consumable)
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
            Element,
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
      fire: { cooldown: 5, amount: 2, countable: "hp", buffer: 2 },
      water: { cooldown: 5, amount: 1, countable: "mp", buffer: 2 },
    },
    iron: {
      fire: { cooldown: 8, amount: 5, countable: "hp", buffer: 2 },
      water: { cooldown: 8, amount: 2, countable: "mp", buffer: 2 },
    },
    gold: {
      fire: { cooldown: 10, amount: 10, countable: "hp", buffer: 2 },
      water: { cooldown: 10, amount: 4, countable: "mp", buffer: 2 },
    },
  },
};

export const stackableConsumptions: Partial<
  Record<Stackable, { amount: number; countable: keyof Countable }>
> = {
  apple: { countable: "hp", amount: 2 },
  shroom: { countable: "mp", amount: 1 },
  banana: { countable: "hp", amount: 5 },
  coconut: { countable: "mp", amount: 2 },
  fruit: { countable: "hp", amount: 5 },
  herb: { countable: "mp", amount: 2 },
};

export const getConsumption = (
  world: World,
  entity: Entity,
  target: Entity
) => {
  const bagItems = target[INVENTORY]
    ? (target[INVENTORY] as Inventory).items.filter(
        (item) => !world.assertByIdAndComponents(item, [ITEM])[ITEM].equipment
      )
    : [];

  if (bagItems.length === 0 || !target[POPUP]) return;

  const item = world.getEntityByIdAndComponents(
    bagItems[getVerticalIndex(world, target)],
    [ITEM]
  );

  if (!item) return;

  return getItemConsumption(world, item);
};

export const getItemConsumption = (world: World, item: Entity) => {
  const consumption =
    item[ITEM].stackable &&
    stackableConsumptions[item[ITEM].stackable as Stackable];

  return consumption ? { ...consumption, item } : undefined;
};

export const consumeItem = (world: World, entity: Entity, target: Entity) => {
  const consumption = getConsumption(world, entity, target);

  if (!consumption) return;

  // remove from inventory
  consumption.item[ITEM].amount -= 1;

  if (consumption.item[ITEM].amount === 0) {
    removeFromInventory(world, entity, consumption.item);
  }

  rerenderEntity(world, entity);

  // add stats
  const countableItem = entities.createItem(world, {
    [ITEM]: {
      stat: consumption?.countable,
      carrier: -1,
      bound: false,
      amount: 0,
    },
    [RENDERABLE]: { generation: 0 },
    [SPRITE]: none,
  });

  addToInventory(world, entity, countableItem, false, consumption.amount);
};

export default function setupConsume(world: World) {
  let worldGeneration = -1;
  let worldName = "";
  let nextConsumptions: Record<number, Record<number, number>> = {};
  let entityHaste: Record<number, number> = {};
  let entityVision: Record<number, number> = {};

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
          ]?.[consumable[ITEM].element!];
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
    }
  };

  return { onUpdate };
}
