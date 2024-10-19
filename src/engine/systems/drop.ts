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
import {
  createDialog,
  none,
  tombstone,
  shop,
  getCountableSprite,
} from "../../game/assets/sprites";
import { ITEM } from "../components/item";
import { SWIMMABLE } from "../components/swimmable";
import { Tradable, TRADABLE } from "../components/tradable";
import { COLLIDABLE } from "../components/collidable";
import { removeFromInventory } from "./trigger";
import { Level, LEVEL } from "../components/level";
import { turnedIterations } from "../../game/math/tracing";
import { copy, normalize } from "../../game/math/std";
import { PLAYER } from "../components/player";
import { LIGHT } from "../components/light";
import { VIEWABLE } from "../components/viewable";
import { SPAWNABLE } from "../components/spawnable";
import { EQUIPPABLE } from "../components/equippable";
import { MOVABLE } from "../components/movable";
import { Countable, COUNTABLE } from "../components/countable";

export const isDecayed = (world: World, entity: Entity) =>
  entity[DROPPABLE].decayed;

const MAX_DROP_RADIUS = 5;
export const findAdjacentWalkable = (
  world: World,
  position: Position,
  maxRadius: number = MAX_DROP_RADIUS,
  overrideCenter?: boolean
) => {
  const level = world.metadata.gameEntity[LEVEL] as Level;

  // allow using dropEntity during world generation
  if (level.walkable.length === 0) return position;

  if (
    overrideCenter !== false &&
    (overrideCenter === true || level.walkable[position.x][position.y])
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

export const dropEntity = (
  world: World,
  entity: Entity,
  position: Position,
  dropAside: boolean = false,
  maxRadius: number = MAX_DROP_RADIUS
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
    "gold",
    "iron",
    "wood",
    "herb",
    "seed",
  ];

  const items = [
    ...(entity[INVENTORY]?.items || []),
    ...droppedCountables
      .filter((counter) => entity[COUNTABLE]?.[counter])
      .map((counter) =>
        world.getEntityId(
          entities.createItem(world, {
            [ITEM]: { amount: entity[COUNTABLE][counter], counter },
            [RENDERABLE]: { generation: 0 },
            [SPRITE]: getCountableSprite(counter, remains ? undefined : 'drop'),
          })
        )
      ),
  ];

  return items.map((itemId, index) => {
    const dropPosition = findAdjacentWalkable(
      world,
      position,
      maxRadius,
      dropAside ? index === 0 && dropAside : undefined
    );

    const isCentered =
      dropPosition.x === position.x && dropPosition.y === position.y;

    const itemEntity = world.getEntityById(itemId);
    const previousCarrier = itemEntity[ITEM].carrier;
    const carrierEntity =
      previousCarrier && world.getEntityById(previousCarrier);

    const containerEntity = entities.createContainer(world, {
      [ANIMATABLE]: { states: {} },
      [FOG]: { visibility: "fog", type: "terrain" },
      [INVENTORY]: { items: isCentered ? [itemId] : [], size: 1 },
      [LOOTABLE]: { disposable: isCentered },
      [POSITION]: dropPosition,
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: none,
      [SWIMMABLE]: { swimming: false },
      [TOOLTIP]: { dialogs: [], persistent: false, nextDialog: -1 },
    });

    // animate drop if not on center position
    if (!isCentered) {
      const animationEntity = entities.createFrame(world, {
        [REFERENCE]: {
          tick: -1,
          delta: 0,
          suspended: false,
          suspensionCounter: -1,
        },
        [RENDERABLE]: { generation: 1 },
      });
      (containerEntity[ANIMATABLE] as Animatable).states.collect = {
        name: "itemCollect",
        reference: world.getEntityId(animationEntity),
        elapsed: 0,
        args: {
          origin: copy(carrierEntity?.[POSITION] || position),
          itemId,
          drop: itemEntity[ITEM].amount,
        },
        particles: {},
      };
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
    .map((itemId) => world.getEntityById(itemId)[SPRITE].name.toLowerCase())
    .join(", ");
  const shopEntity = entities.createShop(world, {
    [ANIMATABLE]: { states: {} },
    [COLLIDABLE]: {},
    [FOG]: { visibility: "fog", type: "unit" },
    [INVENTORY]: { items: previousItems, size: previousItems.length },
    [LOOTABLE]: { disposable: true },
    [POSITION]: sellPosition,
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
      const isPlayer = entity[PLAYER];
      if (isDead(world, entity) && isDecayed(world, entity)) {
        if (isPlayer) {
          // abort any pending quest and focus
          world.abortQuest(entity);
          world.setFocus();

          // create tombstone and soul, and start revive animation
          const tombstoneEntity = entities.createTombstone(world, {
            [ANIMATABLE]: { states: {} },
            [FOG]: { visibility: "visible", type: "terrain" },
            [POSITION]: copy(entity[POSITION]),
            [RENDERABLE]: { generation: 0 },
            [SPRITE]: tombstone,
            [SWIMMABLE]: { swimming: false },
            [TOOLTIP]: { dialogs: [], nextDialog: -1, persistent: false },
          });
          registerEntity(world, tombstoneEntity);

          const animationEntity = entities.createFrame(world, {
            [REFERENCE]: {
              tick: -1,
              delta: 0,
              suspended: false,
              suspensionCounter: -1,
            },
            [RENDERABLE]: { generation: 1 },
          });
          const soulEntity = entities.createSoul(world, {
            [ANIMATABLE]: {
              states: {
                revive: {
                  name: "heroRevive",
                  reference: world.getEntityId(animationEntity),
                  elapsed: 0,
                  args: {
                    tombstoneId: world.getEntityById(tombstoneEntity),
                    target: entity[SPAWNABLE].position,
                    viewable: { active: entity[VIEWABLE].active },
                    light: { ...entity[LIGHT] },
                    compassId: entity[EQUIPPABLE].compass,
                  },
                  particles: {},
                },
              },
            },
            [EQUIPPABLE]: {},
            [INVENTORY]: { items: [], size: 10 },
            [LIGHT]: { ...entity[LIGHT] },
            [MOVABLE]: {
              orientations: [],
              reference: world.getEntityId(animationEntity),
              spring: {
                mass: 5,
                friction: 100,
                tension: 200,
              },
              lastInteraction: 0,
            },
            [POSITION]: copy(entity[POSITION]),
            [RENDERABLE]: { generation: 0 },
            [SPRITE]: none,
            [VIEWABLE]: {
              active: entity[VIEWABLE].active,
              spring: { duration: 200 },
            },
          });
          registerEntity(world, soulEntity);
        }

        dropEntity(world, entity, entity[POSITION], !isPlayer);
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
