import { World } from "../ecs";
import { RENDERABLE } from "../components/renderable";
import { Entity } from "ecs";
import { Consumable, ITEM, Material } from "../components/item";
import { INVENTORY } from "../components/inventory";
import { PLAYER } from "../components/player";
import { Countable, STATS } from "../components/stats";
import { TypedEntity } from "../entities";
import { rerenderEntity } from "./renderer";
import { removeFromInventory } from "./trigger";
import { getMaxCounter } from "../../game/assets/sprites";
import { createSequence, getSequence } from "./sequence";
import { ConsumeSequence } from "../components/sequencable";

export const isConsumable = (world: World, entity: Entity) =>
  !!entity[ITEM]?.consume;

export const getConsumables = (world: World, entity: Entity) =>
  (entity[INVENTORY].items || [])
    .map((itemId: number) => world.assertByIdAndComponents(itemId, [ITEM]))
    .filter((consumable: Entity) =>
      isConsumable(world, consumable)
    ) as TypedEntity<"ITEM">[];

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
          buffer: number; // leave a few countables open so the player can still manually restore stats without wasting health
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

export default function setupConsume(world: World) {
  let worldGeneration = -1;
  const entityConsumptions: Record<number, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world.metadata.gameEntity[RENDERABLE].generation;

    if (worldGeneration === generation) return;

    worldGeneration = generation;

    for (const entity of world.getEntities([INVENTORY, PLAYER, STATS])) {
      // skip if currently consuming
      if (getSequence(world, entity, "consume")) continue;

      const entityId = world.getEntityId(entity);
      const consumptions = [];
      for (const consumable of getConsumables(world, entity)) {
        const consumptionConfig =
          consumptionConfigs[consumable[ITEM].consume!]?.[
            consumable[ITEM].material!
          ];

        if (!consumptionConfig) continue;

        // ensure consumable is not on cooldown
        if (
          entityId in entityConsumptions &&
          consumptionConfig.cooldown + entityConsumptions[entityId] >
            worldGeneration
        )
          continue;

        // ensure consumable is needed
        const maxCounter = getMaxCounter(consumptionConfig.countable);
        const currentCountable = entity[STATS][consumptionConfig.countable];
        const maxCountable = entity[STATS][maxCounter];

        if (
          currentCountable +
            consumptionConfig.amount +
            consumptionConfig.buffer >
          maxCountable
        )
          continue;

        consumptions.push({
          consumable,
          countable: consumptionConfig.countable,
          amount: consumptionConfig.amount,
          percentage: currentCountable / maxCountable,
        });
      }

      consumptions.sort((left, right) => left.percentage - right.percentage);
      const consumption = consumptions[0];

      if (!consumption) continue;

      consumption.consumable[ITEM].amount -= 1;
      rerenderEntity(world, entity);
      entityConsumptions[entityId] = worldGeneration;

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
  };

  return { onUpdate };
}
