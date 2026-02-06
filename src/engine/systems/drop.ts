import { RENDERABLE } from "../components/renderable";
import { World } from "../ecs";
import { REFERENCE } from "../components/reference";
import { isEmpty } from "./collect";
import { LOOTABLE } from "../components/lootable";
import { getRoot, isDead } from "./damage";
import { entities } from "..";
import { disposeEntity, registerEntity } from "./map";
import { DROPPABLE } from "../components/droppable";
import { Entity } from "ecs";
import { FOG } from "../components/fog";
import { INVENTORY } from "../components/inventory";
import { Position, POSITION } from "../components/position";
import { SPRITE } from "../components/sprite";
import { none, arrow, shadow, charge } from "../../game/assets/sprites";
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
  EvaporateSequence,
  SEQUENCABLE,
  VanishSequence,
} from "../components/sequencable";
import { createSequence, getSequence } from "./sequence";
import { TypedEntity } from "../entities";
import { EQUIPPABLE } from "../components/equippable";
import { getEntityGeneration } from "./renderer";
import {
  ORIENTABLE,
  Orientation,
  orientationPoints,
} from "../components/orientable";
import { decayTime, getItemSprite, lootSpeed } from "../../game/assets/utils";
import { SPAWNABLE } from "../components/spawnable";
import { LAYER } from "../components/layer";
import { RECHARGABLE } from "../components/rechargable";
import { IDENTIFIABLE } from "../components/identifiable";
import { setIdentifier } from "../utils";
import { getBurning } from "./burn";
import { PLAYER } from "../components/player";
import { NPC } from "../components/npc";
import { play } from "../../game/sound";
import { STATS } from "../components/stats";
import { isImmersible } from "./immersion";
import { POPUP } from "../components/popup";
import { TOOLTIP } from "../components/tooltip";
import { createPopup } from "./popup";
import { HARVESTABLE } from "../components/harvestable";
import { BURNABLE } from "../components/burnable";
import { SHOOTABLE } from "../components/shootable";
import { VANISHABLE } from "../components/vanishable";
import { BELONGABLE } from "../components/belongable";
import { CASTABLE, getEmptyCastable } from "../components/castable";

export const isDecayed = (world: World, entity: Entity) =>
  entity[DROPPABLE]?.decayed || entity[VANISHABLE]?.decayed;

export const isDecaying = (world: World, entity: Entity) =>
  isDead(world, entity) &&
  !isDecayed(world, entity) &&
  !getSequence(world, entity, "decay") &&
  !getSequence(world, entity, "vanish");

export const isHarvested = (world: World, entity: Entity) =>
  entity[HARVESTABLE].amount <= 0 &&
  !isDecayed(world, entity) &&
  !getSequence(world, entity, "decay");

export const isDroppable = (world: World, position: Position) =>
  !!world.metadata.gameEntity[LEVEL].walkable[position.x][position.y] &&
  !getBurning(world, position);

export const MAX_DROP_RADIUS = 5;
export const findAdjacentDroppable = (
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
    (overrideCenterWalkable === true || isDroppable(world, position))
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
      if (isDroppable(world, centerPosition)) {
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
        if (isDroppable(world, sidePosition)) {
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
    [FOG]: { visibility: "fog", type: "unit" },
    [INVENTORY]: { items: [] },
    [LAYER]: {},
    [LOOTABLE]: { disposable: true },
    [POSITION]: position,
    [RENDERABLE]: { generation: 0 },
    [SEQUENCABLE]: { states: {} },
    [SPRITE]: drop ? shadow : none,
    [SWIMMABLE]: { swimming: false },
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
  } else {
    carrier[INVENTORY].items.push(itemId);
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
      itemEntity[ITEM].material === "wood" &&
      !itemEntity[ITEM].element
    );
  });
  if (stickId) {
    const swordEntity = world.assertById(stickId);
    removeFromInventory(world, entity, swordEntity);

    disposeEntity(world, swordEntity);

    const stickEntity = entities.createItem(world, {
      [ITEM]: {
        amount: 1,
        stackable: "stick",
        carrier: -1,
        bound: false,
      },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: getItemSprite({ stackable: "stick" }),
    });
    entity[INVENTORY].items.push(world.getEntityId(stickEntity));
  }

  // remember if entity was holding a compass
  if (entity[EQUIPPABLE]?.compass && entity[SPAWNABLE]) {
    entity[SPAWNABLE].compassId = entity[EQUIPPABLE].compass;
  }

  const arrowHits = entity[SHOOTABLE]?.shots || 0;
  const arrowStacks = Math.ceil(arrowHits / STACK_SIZE);
  const recharge = entity[RECHARGABLE]?.hit;
  const items = [
    ...(inventory.filter(
      (itemId: number) =>
        !world.assertByIdAndComponents(itemId, [ITEM])[ITEM].bound
    ) || []),
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
    ...(recharge
      ? [
          world.getEntityId(
            entities.createItem(world, {
              [ITEM]: {
                amount: 1,
                stackable: "charge",
                carrier: -1,
                bound: false,
              },
              [RENDERABLE]: { generation: 0 },
              [SPRITE]: charge,
            })
          ),
        ]
      : []),
  ];

  return shuffle(items).map((itemId, index) => {
    const dropPosition = orientation
      ? add(position, orientationPoints[orientation])
      : findAdjacentDroppable(
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

    // assign identifiers to all unnamed drops
    const identifier =
      carrierEntity?.[IDENTIFIABLE]?.name || entity[IDENTIFIABLE]?.name;
    if (identifier && !itemEntity[IDENTIFIABLE]?.name) {
      setIdentifier(world, itemEntity, `${identifier}:drop`);
    }

    const containerData = {
      [FOG]: { visibility: "fog", type: "unit" },
      [INVENTORY]: { items: isCentered ? [itemId] : [] },
      [LAYER]: {},
      [LOOTABLE]: { disposable: isCentered },
      [POSITION]: dropPosition,
      [RENDERABLE]: { generation: 0 },
      [SEQUENCABLE]: { states: {} },
      [SPRITE]: !isImmersible(world, dropPosition) ? shadow : none,
      [SWIMMABLE]: { swimming: false },
    } as const;

    const containerEntity = itemEntity[POPUP]
      ? entities.createWrapper(world, {
          ...containerData,
          [TOOLTIP]: { dialogs: [], nextDialog: -1, persistent: false },
        })
      : entities.createContainer(world, containerData);

    if (itemEntity[POPUP]) {
      const { viewpoint, ...popup } = itemEntity[POPUP];
      createPopup(world, containerEntity, popup);
    }

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
          amount: itemEntity[ITEM].amount,
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
    const heroEntity = world.getEntity([PLAYER]);

    if (referencesGeneration === generation) return;

    referencesGeneration = generation;

    // create decay animation
    for (const entity of world.getEntities([
      DROPPABLE,
      RENDERABLE,
      SEQUENCABLE,
      POSITION,
    ])) {
      if (isDecaying(world, entity)) {
        play("die", {
          variant: entity[NPC] ? 1 : 2,
          intensity: entity[STATS]?.maxHp,
        });
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

    // create vanish animation
    for (const entity of world.getEntities([
      POSITION,
      RENDERABLE,
      SEQUENCABLE,
      VANISHABLE,
    ])) {
      if (isDecaying(world, entity)) {
        play("die", {
          variant: entity[NPC] ? 1 : 2,
          intensity: entity[STATS]?.maxHp,
        });
        createSequence<"vanish", VanishSequence>(
          world,
          entity,
          "vanish",
          "creatureVanish",
          {
            generation: 0,
            limbs: {},
            grow: true,
          }
        );
      }
    }

    // drop harvested resources
    for (const entity of world.getEntities([
      DROPPABLE,
      HARVESTABLE,
      RENDERABLE,
      SEQUENCABLE,
      POSITION,
    ])) {
      if (isHarvested(world, entity)) {
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
      } else if (isDecayed(world, entity) && !entity[BURNABLE]?.combusted) {
        disposeEntity(world, entity, true);
      }
    }

    // replace decayed entities, increase slay counter and evaporate unit
    for (const entity of world.getEntities([DROPPABLE, RENDERABLE, POSITION])) {
      const rootEntity = getRoot(world, entity);

      if (isDead(world, rootEntity) && isDecayed(world, entity)) {
        disposeEntity(world, entity, true, false);

        const unitKey = entity[NPC]?.type;
        if (heroEntity && unitKey) {
          heroEntity[PLAYER].defeatedUnits[unitKey] =
            (heroEntity[PLAYER].defeatedUnits[unitKey] || 0) + 1;
        }

        // play evaporate animation with own anchor
        const evaporate = entity[DROPPABLE].evaporate;
        
        if (evaporate) {
          const castableEntity = entities.createSpell(world, {
            [BELONGABLE]: { faction: entity[BELONGABLE]?.faction || "nature" },
            [CASTABLE]: getEmptyCastable(world, entity),
            [ORIENTABLE]: {},
            [POSITION]: copy(entity[POSITION]),
            [RENDERABLE]: { generation: 0 },
            [SEQUENCABLE]: { states: {} },
            [SPRITE]: none,
          });
          createSequence<"evaporate", EvaporateSequence>(
            world,
            castableEntity,
            "evaporate",
            "creatureEvaporate",
            { fast: evaporate.fast, sprite: evaporate.sprite }
          );
        }
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
