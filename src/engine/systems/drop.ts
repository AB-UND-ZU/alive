import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { REFERENCE } from "../components/reference";
import { isEmpty } from "./collect";
import { LOOTABLE } from "../components/lootable";
import { isDead } from "./damage";
import { entities } from "..";
import { disposeEntity, registerEntity } from "./map";
import { DROPPABLE } from "../components/droppable";
import { Entity } from "ecs";
import { FOG } from "../components/fog";
import { INVENTORY } from "../components/inventory";
import { Position, POSITION } from "../components/position";
import { SPRITE } from "../components/sprite";
import { TOOLTIP } from "../components/tooltip";
import { none, arrow, getStatSprite, shadow } from "../../game/assets/sprites";
import { Item, ITEM, STACK_SIZE } from "../components/item";
import { SWIMMABLE } from "../components/swimmable";
import { removeFromInventory } from "./trigger";
import { Level, LEVEL } from "../components/level";
import { iterations } from "../../game/math/tracing";
import { add, copy, normalize, shuffle } from "../../game/math/std";
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
import { SHOOTABLE } from "../components/shootable";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";
import {
  droppableCountables,
  emptyStats,
  Stats,
  STATS,
} from "../components/stats";
import { decayTime, lootSpeed } from "../../game/assets/utils";
import { SPAWNABLE } from "../components/spawnable";
import { LAYER } from "../components/layer";

export const isDecayed = (world: World, entity: Entity) =>
  entity[DROPPABLE].decayed;

export const MAX_DROP_RADIUS = 5;
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
    const turnedIterations = shuffle(iterations);
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
  },
  drop = true
) => {
  const containerEntity = entities.createContainer(world, {
    [FOG]: { visibility: "fog", type: "terrain" },
    [INVENTORY]: { items: [], size: 1 },
    [LAYER]: {},
    [LOOTABLE]: { disposable: true },
    [POSITION]: position,
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: drop ? shadow : none,
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
    [ITEM]: Omit<Item, "carrier" | "bound">;
  },
  equip: boolean = true
) => {
  const itemEntity = factory(world, {
    ...entity,
    [ITEM]: {
      bound: false,
      ...entity[ITEM],
      carrier: world.getEntityId(carrier),
    },
    [RENDERABLE]: { generation: 0 },
  } as T);

  // add to inventory
  const itemId = world.getEntityId(itemEntity);
  const targetEquipment = itemEntity[ITEM].equipment;
  const targetStat = itemEntity[ITEM].stat;
  const targetConsume = itemEntity[ITEM].consume;
  const targetStackable = itemEntity[ITEM].stackable;

  if (!equip) {
    carrier[INVENTORY].items.push(itemId);
  } else if (targetEquipment) {
    if (carrier[EQUIPPABLE]) {
      const existingId = carrier[EQUIPPABLE][targetEquipment];

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
      carrier[EQUIPPABLE][targetEquipment] = itemId;
    }

    carrier[INVENTORY].items.push(itemId);
  } else if (targetConsume || targetStackable) {
    carrier[INVENTORY].items.push(itemId);
  } else if (targetStat) {
    if (carrier[STATS]) {
      carrier[STATS][targetStat] += 1;
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
  orientation?: Orientation,
  delay?: number
) => {
  const stats: Stats = { ...emptyStats, ...entity[STATS] };
  const inventory = entity[INVENTORY]?.items || [];
  const remains = entity[DROPPABLE]?.remains;

  if (remains) {
    entities.createGround(world, {
      [FOG]: { visibility: "hidden", type: "terrain" },
      [POSITION]: position,
      [SPRITE]: remains,
      [RENDERABLE]: { generation: 0 },
    });
  }

  // convert wood sword back to stick
  const stickId = inventory.find((itemId: number) => {
    const itemEntity = world.assertByIdAndComponents(itemId, [ITEM]);
    return (
      itemEntity[ITEM].equipment === "sword" &&
      itemEntity[ITEM].material === "wood"
    );
  });
  if (stickId) {
    const stickEntity = world.assertById(stickId);
    removeFromInventory(world, entity, stickEntity);

    disposeEntity(world, stickEntity);
    stats.stick += 1;
  }

  // remember if entity was holding a compass
  if (entity[EQUIPPABLE]?.compass && entity[SPAWNABLE]) {
    entity[SPAWNABLE].compassId = entity[EQUIPPABLE].compass;
  }

  const arrowHits = entity[SHOOTABLE]?.hits || 0;
  const arrowStacks = Math.ceil(arrowHits / STACK_SIZE);
  const items = [
    ...(inventory.filter(
      (itemId: number) =>
        !world.assertByIdAndComponents(itemId, [ITEM])[ITEM].bound
    ) || []),
    ...droppableCountables
      .filter((counter) => stats[counter])
      .map((counter) =>
        world.getEntityId(
          entities.createItem(world, {
            [ITEM]: {
              amount: stats[counter],
              stat: counter,
              carrier: -1,
              bound: false,
            },
            [RENDERABLE]: { generation: 0 },
            [SPRITE]: getStatSprite(counter, "drop"),
          })
        )
      ),
    ...(arrowHits > 0
      ? Array.from({ length: arrowStacks }).map((_, index) =>
          world.getEntityId(
            entities.createItem(world, {
              [ITEM]: {
                amount:
                  index === arrowStacks - 1 && arrowHits % STACK_SIZE !== 0
                    ? arrowHits % STACK_SIZE
                    : STACK_SIZE,
                stackable: "arrow",
                carrier: -1,
                bound: false,
              },
              [RENDERABLE]: { generation: 0 },
              [SPRITE]: arrow,
            })
          )
        )
      : []),
  ];

  return shuffle(items).map((itemId, index) => {
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
      [LAYER]: {},
      [LOOTABLE]: { disposable: isCentered },
      [POSITION]: dropPosition,
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: none,
      [SWIMMABLE]: { swimming: false },
      [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
    });

    // reset orientable e.g. from using sword
    if (itemEntity[ORIENTABLE]?.facing) {
      itemEntity[ORIENTABLE].facing = undefined;
    }

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
          drop: true,
          delay,
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
      DROPPABLE,
      RENDERABLE,
      SEQUENCABLE,
      POSITION,
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
          { fast: false }
        );
        dropEntity(
          world,
          entity,
          entity[POSITION],
          false,
          MAX_DROP_RADIUS,
          undefined,
          lootSpeed + decayTime / 2
        );
      }
    }

    // replace decayed entities
    for (const entity of world.getEntities([DROPPABLE, RENDERABLE, POSITION])) {
      if (isDead(world, entity) && isDecayed(world, entity)) {
        disposeEntity(world, entity, true, false);
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
