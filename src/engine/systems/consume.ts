import { World } from "../ecs";
import { RENDERABLE } from "../components/renderable";
import { Entity } from "ecs";
import { Consumable, ITEM, Material, Stackable } from "../components/item";
import { INVENTORY } from "../components/inventory";
import { PLAYER } from "../components/player";
import { Countable, STATS } from "../components/stats";
import { TypedEntity } from "../entities";
import { rerenderEntity } from "./renderer";
import { removeFromInventory } from "./trigger";
import { getMaxCounter, none } from "../../game/assets/sprites";
import { createSequence, getSequence } from "./sequence";
import { ConsumeSequence, VisionSequence } from "../components/sequencable";
import { EQUIPPABLE } from "../components/equippable";
import { LIGHT } from "../components/light";
import { MOVABLE } from "../components/movable";
import { entities } from "..";
import { REFERENCE } from "../components/reference";
import { getEntityHaste, getHasteInterval } from "./movement";
import { disposeEntity } from "./map";
import { LAYER } from "../components/layer";
import { NPC } from "../components/npc";
import { POPUP } from "../components/popup";
import { addToInventory } from "./collect";
import { SPRITE } from "../components/sprite";

export const isConsumable = (world: World, entity: Entity) =>
  !!entity[ITEM]?.consume;

export const getConsumables = (world: World, entity: Entity) =>
  (entity[INVENTORY].items || [])
    .map((itemId: number) => world.assertByIdAndComponents(itemId, [ITEM]))
    .filter((consumable: Entity) =>
      isConsumable(world, consumable)
    ) as TypedEntity<"ITEM">[];

export const defaultLight = { visibility: 3.66, brightness: 3.66, darkness: 0 };
export const torchLight = { visibility: 5.55, brightness: 5.55, darkness: 0 };
export const spawnLight = { visibility: 18, brightness: 18, darkness: 0 };

export const consumptionConfigs: Partial<
  Record<
    Consumable,
    Partial<
      Record<
        Material,
        {
          cooldown: number;
          amount: number;
          countable: keyof Countable;
          buffer: number; // leave a few countables open so the player can still manually restore stats without wasting consumable
        }
      >
    >
  >
> = {
  potion1: {
    fire: { cooldown: 10, amount: 2, countable: "hp", buffer: 2 },
    water: { cooldown: 10, amount: 1, countable: "mp", buffer: 2 },
  },
  potion2: {
    fire: { cooldown: 7, amount: 5, countable: "hp", buffer: 3 },
    water: { cooldown: 7, amount: 2, countable: "mp", buffer: 3 },
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
  if (
    !target[INVENTORY] ||
    target[INVENTORY].items.length === 0 ||
    !target[POPUP]
  )
    return;

  const item = world.getEntityByIdAndComponents(
    target[INVENTORY].items[target[POPUP].verticalIndex],
    [ITEM]
  );

  if (!item) return;

  const consumption =
    item[ITEM].stackable && stackableConsumptions[item[ITEM].stackable];

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
  const nextConsumptions: Record<number, Record<number, number>> = {};
  const entityHaste: Record<number, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world.metadata.gameEntity[RENDERABLE].generation;

    if (worldGeneration === generation) return;

    worldGeneration = generation;

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
          ];

        if (!consumptionConfig) continue;

        // ensure consumable is needed
        const maxCounter = getMaxCounter(consumptionConfig.countable);
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
            worldGeneration + consumptionConfig.cooldown;
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

    // process consumable equipments
    for (const entity of world.getEntities([
      PLAYER,
      EQUIPPABLE,
      LIGHT,
      LAYER,
    ])) {
      // increase vision radius when stepping outside
      if (
        entity[EQUIPPABLE].torch &&
        entity[LIGHT].brightness === defaultLight.brightness &&
        entity[LIGHT].visibility === defaultLight.visibility &&
        !getSequence(world, entity, "vision") &&
        !entity[LAYER].structure
      ) {
        createSequence<"vision", VisionSequence>(
          world,
          entity,
          "vision",
          "changeRadius",
          {
            fast: false,
            light: { ...torchLight },
          }
        );
      }
    }

    // process changes in haste
    for (const entity of world.getEntities([PLAYER, STATS, MOVABLE])) {
      const entityId = world.getEntityId(entity);
      const haste = getEntityHaste(world, entity);

      if (!(entityId in entityHaste)) {
        entityHaste[entityId] = haste;
      } else if (haste !== entityHaste[entityId]) {
        const oldFrame = world.assertByIdAndComponents(
          entity[MOVABLE].reference,
          [REFERENCE, RENDERABLE]
        );
        const newFrame = entities.createFrame(world, {
          [REFERENCE]: {
            ...oldFrame[REFERENCE],
            tick: getHasteInterval(world, haste),
          },
          [RENDERABLE]: { generation: oldFrame[RENDERABLE].generation },
        });
        entity[MOVABLE].reference = world.getEntityId(newFrame);

        entityHaste[entityId] = haste;
        disposeEntity(world, oldFrame);
      }
    }
  };

  return { onUpdate };
}
