import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { REFERENCE } from "../components/reference";
import { ATTACKABLE } from "../components/attackable";
import { isEmpty } from "./collect";
import { LOOTABLE } from "../components/lootable";
import { isDead } from "./damage";
import { Animatable, ANIMATABLE } from "../components/animatable";
import { entities } from "..";
import { disposeEntity, registerEntity } from "./map";
import { DROPPABLE } from "../components/droppable";
import { Entity } from "ecs";
import { FOG } from "../components/fog";
import { Inventory, INVENTORY } from "../components/inventory";
import { Position, POSITION } from "../components/position";
import { SPRITE } from "../components/sprite";
import { TOOLTIP } from "../components/tooltip";
import { createDialog, none, shop } from "../../game/assets/sprites";
import { ITEM } from "../components/item";
import { SWIMMABLE } from "../components/swimmable";
import { Tradable, TRADABLE } from "../components/tradable";
import { COLLIDABLE } from "../components/collidable";
import { removeFromInventory } from "./trigger";

export const isDecayed = (world: World, entity: Entity) =>
  entity[DROPPABLE].decayed;

export const dropItem = (
  world: World,
  items: Inventory["items"],
  position: Position
) => {
  const previousItems = [...items];
  const containerEntity = entities.createContainer(world, {
    [ANIMATABLE]: { states: {} },
    [FOG]: { visibility: "fog", type: "unit" },
    [INVENTORY]: { items: previousItems, size: previousItems.length },
    [LOOTABLE]: { disposable: true },
    [POSITION]: position,
    [RENDERABLE]: { generation: 0 },
    [SPRITE]: none,
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
  });
  registerEntity(world, containerEntity);
  const containerId = world.getEntityId(containerEntity);
  previousItems.forEach((item) => {
    const itemEntity = world.getEntityById(item);
    const previousCarrier = itemEntity[ITEM].carrier;

    if (previousCarrier) {
      const carrierEntity = world.getEntityById(previousCarrier);
      removeFromInventory(world, carrierEntity, itemEntity);
    }

    itemEntity[ITEM].carrier = containerId;
  });

  return containerEntity;
};

export const sellItem = (
  world: World,
  items: Inventory["items"],
  position: Position,
  activation: Tradable["activation"]
) => {
  const previousItems = [...items];
  const itemNames = items
    .map((itemId) => world.getEntityById(itemId)[SPRITE].name.toLowerCase())
    .join(", ");
  const shopEntity = entities.createShop(world, {
    [ANIMATABLE]: { states: {} },
    [COLLIDABLE]: {},
    [FOG]: { visibility: "fog", type: "unit" },
    [INVENTORY]: { items: previousItems, size: previousItems.length },
    [LOOTABLE]: { disposable: true },
    [POSITION]: position,
    [RENDERABLE]: { generation: 0 },
    [SPRITE]: none,
    [TRADABLE]: { activation },
    [TOOLTIP]: {
      dialogs: [createDialog(`Buy ${itemNames}`)],
      persistent: false,
      nextDialog: -1,
      idle: shop,
    },
  });
  registerEntity(world, shopEntity);
  const shopId = world.getEntityId(shopEntity);
  previousItems.forEach((item) => {
    const itemEntity = world.getEntityById(item);
    const previousCarrier = itemEntity[ITEM].carrier;
    
    if (previousCarrier) {
      const carrierEntity = world.getEntityById(previousCarrier);
      removeFromInventory(world, carrierEntity, itemEntity);
    }

    itemEntity[ITEM].carrier = shopId;
  });

  return shopEntity;
};

export default function setupDrop(world: World) {
  let referencesGeneration = -1;

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referencesGeneration === generation) return;

    referencesGeneration = generation;

    // create decay animation
    for (const entity of world.getEntities([
      ATTACKABLE,
      DROPPABLE,
      ANIMATABLE,
      RENDERABLE,
    ])) {
      if (
        isDead(world, entity) &&
        !entity[DROPPABLE].decayed &&
        !(entity[ANIMATABLE] as Animatable).states.decay
      ) {
        const animationEntity = entities.createFrame(world, {
          [REFERENCE]: {
            tick: -1,
            delta: 0,
            suspended: false,
            suspensionCounter: -1,
          },
          [RENDERABLE]: { generation: 1 },
        });
        (entity[ANIMATABLE] as Animatable).states.decay = {
          name: "creatureDecay",
          reference: world.getEntityId(animationEntity),
          elapsed: 0,
          args: {},
          particles: {},
        };
      }
    }

    // replace decayed entities
    for (const entity of world.getEntities([DROPPABLE, RENDERABLE])) {
      if (isDead(world, entity) && isDecayed(world, entity)) {
        dropItem(world, entity[INVENTORY].items, entity[POSITION]);
        disposeEntity(world, entity);
      }
    }

    // schedule entity removal when fully looted
    for (const entity of world.getEntities([LOOTABLE, RENDERABLE])) {
      if (
        entity[LOOTABLE].disposable &&
        isEmpty(world, entity) &&
        !(entity[ANIMATABLE] as Animatable).states.dispose
      ) {
        const animationEntity = entities.createFrame(world, {
          [REFERENCE]: {
            tick: -1,
            delta: 0,
            suspended: false,
            suspensionCounter: -1,
          },
          [RENDERABLE]: { generation: 1 },
        });
        (entity[ANIMATABLE] as Animatable).states.dispose = {
          name: "entityDispose",
          reference: world.getEntityId(animationEntity),
          elapsed: 0,
          args: {},
          particles: {},
        };
      }
    }
  };

  return { onUpdate };
}
