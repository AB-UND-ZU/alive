import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { REFERENCE } from "../components/reference";
import { ATTACKABLE } from "../components/attackable";
import { isEmpty } from "./collect";
import { LOOTABLE } from "../components/lootable";
import { isDead } from "./damage";
import { entities } from "..";
import { disposeEntity, registerEntity } from "./map";
import { DROPPABLE } from "../components/droppable";
import { Entity } from "ecs";
import { FOG } from "../components/fog";
import { Inventory, INVENTORY } from "../components/inventory";
import { Position, POSITION } from "../components/position";
import { SPRITE } from "../components/sprite";
import { TOOLTIP } from "../components/tooltip";
import {
  createDialog,
  none,
  shop,
  getCountableSprite,
  arrow,
} from "../../game/assets/sprites";
import { Item, ITEM, STACK_SIZE } from "../components/item";
import { SWIMMABLE } from "../components/swimmable";
import { Tradable, TRADABLE } from "../components/tradable";
import { COLLIDABLE } from "../components/collidable";
import { removeFromInventory } from "./trigger";
import { Level, LEVEL } from "../components/level";
import { turnedIterations } from "../../game/math/tracing";
import { add, copy, normalize } from "../../game/math/std";
import { Countable, COUNTABLE } from "../components/countable";
import {
  CollectSequence,
  DecaySequence,
  DisposeSequence,
  SEQUENCABLE,
} from "../components/sequencable";
import { createSequence, getSequence } from "./sequence";
import { TypedEntity } from "../entities";
import { EQUIPPABLE } from "../components/equippable";
import { getEntityGeneration } from "./renderer";
import { PLAYER } from "../components/player";
import { SHOOTABLE } from "../components/shootable";
import { Orientation, orientationPoints } from "../components/orientable";

export const isDecayed = (world: World, entity: Entity) =>
  entity[DROPPABLE].decayed;

const MAX_DROP_RADIUS = 5;
export const findAdjacentWalkable = (
  world: World,
  position: Position,
  maxRadius: number = MAX_DROP_RADIUS,
  overrideCenterWalkable?: boolean
) => {
  const level = world.metadata.gameEntity[LEVEL] as Level;

  // allow using dropEntity during world generation
  if (level.walkable.length === 0) return position;

  if (
    overrideCenterWalkable !== false &&
    (overrideCenterWalkable === true || level.walkable[position.x][position.y])
  ) {
    return position;
  }

  for (let direction = 1; direction <= maxRadius; direction += 1) {
    // centers
    for (const iteration of turnedIterations) {
      let normal = 0;
      const centerPosition = {
        x: normalize(
          position.x +
            direction * iteration.direction.x +
            normal * iteration.normal.x,
          level.size
        ),
        y: normalize(
          position.y +
            direction * iteration.direction.y +
            normal * iteration.normal.y,
          level.size
        ),
      };
      if (level.walkable[centerPosition.x][centerPosition.y]) {
        return centerPosition;
      }
    }

    // sides
    for (const iteration of turnedIterations) {
      for (let normal = 1; normal <= direction; normal += 1) {
        const sidePosition = {
          x: normalize(
            position.x +
              direction * iteration.direction.x +
              normal * iteration.normal.x,
            level.size
          ),
          y: normalize(
            position.y +
              direction * iteration.direction.y +
              normal * iteration.normal.y,
            level.size
          ),
        };
        if (level.walkable[sidePosition.x][sidePosition.y]) {
          return sidePosition;
        }
      }
    }
  }

  console.error(
    Date.now(),
    "Unable to find free adjacent drop location at:",
    position
  );
  return position;
};

export const createItemAsDrop = <T extends TypedEntity<"ITEM" | "RENDERABLE">>(
  world: World,
  position: Position,
  factory: (world: World, data: T) => T,
  entity: Omit<T, "ITEM" | "RENDERABLE"> & {
    [ITEM]: Omit<Item, "carrier">;
  }
) => {
  const containerEntity = entities.createContainer(world, {
    [FOG]: { visibility: "fog", type: "terrain" },
    [INVENTORY]: { items: [], size: 1 },
    [LOOTABLE]: { disposable: true },
    [POSITION]: position,
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: none,
    [SWIMMABLE]: { swimming: false },
    [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
  });
  return createItemInInventory(world, containerEntity, factory, entity);
};

export const createItemInInventory = <
  T extends TypedEntity<"ITEM" | "RENDERABLE">
>(
  world: World,
  carrier: TypedEntity<"INVENTORY">,
  factory: (world: World, data: T) => T,
  entity: Omit<T, "ITEM" | "RENDERABLE"> & {
    [ITEM]: Omit<Item, "carrier">;
  },
  attachType?: "inventoryOnly" | "equipOnly"
) => {
  const itemEntity = factory(world, {
    ...entity,
    [ITEM]: {
      ...entity[ITEM],
      carrier: world.getEntityId(carrier),
    },
    [RENDERABLE]: { generation: 0 },
  } as T);

  // add to inventory
  const itemId = world.getEntityId(itemEntity);
  const targetSlot = itemEntity[ITEM].slot;
  const targetCounter = itemEntity[ITEM].counter;
  const targetConsume = itemEntity[ITEM].consume;
  const targetStackable = itemEntity[ITEM].stackable;

  if (attachType === "inventoryOnly") {
    carrier[INVENTORY].items.push(itemId);
  } else if (targetSlot) {
    if (carrier[EQUIPPABLE]) {
      const existingId = carrier[EQUIPPABLE][targetSlot];

      // add existing render count if item is replaced
      if (existingId) {
        const existingItem = world.assertById(existingId);
        itemEntity[RENDERABLE].generation += getEntityGeneration(
          world,
          existingItem
        );

        // TODO: handle dropping existing item instead
        removeFromInventory(world, carrier, existingItem);
        disposeEntity(world, existingItem);
      }
      carrier[EQUIPPABLE][targetSlot] = itemId;
    }

    if (attachType !== "equipOnly") carrier[INVENTORY].items.push(itemId);
  } else if (targetConsume || targetStackable) {
    carrier[INVENTORY].items.push(itemId);
  } else if (targetCounter) {
    if (carrier[COUNTABLE]) {
      carrier[COUNTABLE][targetCounter] += 1;
    } else {
      carrier[INVENTORY].items.push(itemId);
    }
  }
  return itemEntity;
};

export const dropEntity = (
  world: World,
  entity: Entity,
  position: Position,
  overrideCenterWalkable?: boolean,
  maxRadius: number = MAX_DROP_RADIUS,
  orientation?: Orientation
) => {
  const remains = entity[DROPPABLE]?.remains;

  if (remains) {
    entities.createGround(world, {
      [FOG]: { visibility: "hidden", type: "terrain" },
      [POSITION]: position,
      [SPRITE]: remains,
      [RENDERABLE]: { generation: 0 },
    });
  }

  const droppedCountables: (keyof Countable)[] = [
    "xp",
    "gold",
    "ore",
    "wood",
    "flower",
    "berry",
  ];

  const arrowHits = entity[SHOOTABLE]?.hits || 0;
  const arrowStacks = Math.ceil(arrowHits / STACK_SIZE);
  const items = [
    ...(entity[INVENTORY]?.items || []),
    ...droppedCountables
      .filter((counter) => entity[COUNTABLE]?.[counter])
      .map((counter) =>
        world.getEntityId(
          entities.createItem(world, {
            [ITEM]: {
              amount: entity[COUNTABLE][counter],
              counter,
              carrier: -1,
            },
            [RENDERABLE]: { generation: 0 },
            [SPRITE]: getCountableSprite(counter, "drop"),
          })
        )
      ),
    ...(arrowHits > 0
      ? Array.from({ length: arrowStacks }).map((_, index) =>
          world.getEntityId(
            entities.createItem(world, {
              [ITEM]: {
                amount:
                  index === arrowStacks - 1
                    ? arrowHits % STACK_SIZE
                    : STACK_SIZE,
                stackable: "arrow",
                carrier: -1,
              },
              [RENDERABLE]: { generation: 0 },
              [SPRITE]: arrow,
            })
          )
        )
      : []),
  ];

  return items.map((itemId, index) => {
    const dropPosition = orientation
      ? add(position, orientationPoints[orientation])
      : findAdjacentWalkable(
          world,
          position,
          maxRadius,
          overrideCenterWalkable
            ? index === 0
              ? overrideCenterWalkable
              : undefined
            : overrideCenterWalkable
        );

    const isCentered =
      dropPosition.x === position.x && dropPosition.y === position.y;

    const itemEntity = world.assertByIdAndComponents(itemId, [ITEM]);
    const previousCarrier = itemEntity[ITEM].carrier;
    const carrierEntity = world.getEntityByIdAndComponents(previousCarrier, [
      POSITION,
    ]);

    const containerEntity = entities.createContainer(world, {
      [FOG]: { visibility: "fog", type: "terrain" },
      [INVENTORY]: { items: isCentered ? [itemId] : [], size: 1 },
      [LOOTABLE]: { disposable: isCentered },
      [POSITION]: dropPosition,
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: none,
      [SWIMMABLE]: { swimming: false },
      [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
    });

    // animate drop if not on center position
    if (!isCentered) {
      createSequence<"collect", CollectSequence>(
        world,
        containerEntity,
        "collect",
        "itemCollect",
        {
          origin: copy(carrierEntity?.[POSITION] || position),
          itemId,
          drop: itemEntity[ITEM].amount,
        }
      );
    }

    if (carrierEntity) {
      removeFromInventory(world, carrierEntity, itemEntity);
    }

    const containerId = world.getEntityId(containerEntity);
    itemEntity[ITEM].carrier = containerId;

    registerEntity(world, containerEntity);

    return containerEntity;
  });
};

export const sellItem = (
  world: World,
  items: Inventory["items"],
  position: Position,
  activation: Tradable["activation"]
) => {
  const previousItems = [...items];
  const sellPosition = findAdjacentWalkable(world, position);
  const itemNames = items
    .map((itemId) =>
      world.assertByIdAndComponents(itemId, [SPRITE])[SPRITE].name.toLowerCase()
    )
    .join(", ");
  const shopEntity = entities.createShop(world, {
    [COLLIDABLE]: {},
    [FOG]: { visibility: "fog", type: "unit" },
    [INVENTORY]: { items: previousItems, size: previousItems.length },
    [LOOTABLE]: { disposable: true },
    [POSITION]: sellPosition,
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
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
    const itemEntity = world.assertByIdAndComponents(item, [ITEM]);
    const previousCarrier = itemEntity[ITEM].carrier;

    if (previousCarrier) {
      const carrierEntity = world.assertById(previousCarrier);
      removeFromInventory(world, carrierEntity, itemEntity);
    }

    itemEntity[ITEM].carrier = shopId;
  });
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
      RENDERABLE,
    ])) {
      if (
        isDead(world, entity) &&
        !entity[DROPPABLE].decayed &&
        !getSequence(world, entity, "decay")
      ) {
        createSequence<"decay", DecaySequence>(
          world,
          entity,
          "decay",
          "creatureDecay",
          {}
        );
      }
    }

    // replace decayed entities
    for (const entity of world.getEntities([DROPPABLE, RENDERABLE, POSITION])) {
      if (isDead(world, entity) && isDecayed(world, entity)) {
        dropEntity(world, entity, entity[POSITION], !entity[PLAYER]);
        disposeEntity(world, entity);
      }
    }

    // schedule entity removal when fully looted
    for (const entity of world.getEntities([LOOTABLE, RENDERABLE])) {
      if (
        entity[LOOTABLE].disposable &&
        isEmpty(world, entity) &&
        !getSequence(world, entity, "dispose")
      ) {
        createSequence<"dispose", DisposeSequence>(
          world,
          entity,
          "dispose",
          "entityDispose",
          {}
        );
      }
    }
  };

  return { onUpdate };
}
