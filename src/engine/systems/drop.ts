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
import { Sprite, SPRITE } from "../components/sprite";
import { TOOLTIP } from "../components/tooltip";
import { createDialog, none, rip, shop } from "../../game/assets/sprites";
import { ITEM } from "../components/item";
import { SWIMMABLE } from "../components/swimmable";
import { Tradable, TRADABLE } from "../components/tradable";
import { COLLIDABLE } from "../components/collidable";
import { removeFromInventory } from "./trigger";
import { Level, LEVEL } from "../components/level";
import { iterations } from "../../game/math/tracing";
import { copy, normalize } from "../../game/math/std";
import { PLAYER } from "../components/player";
import { LIGHT } from "../components/light";
import { VIEWABLE } from "../components/viewable";
import { SPAWNABLE } from "../components/spawnable";

export const isDecayed = (world: World, entity: Entity) =>
  entity[DROPPABLE].decayed;

const MAX_DROP_RADIUS = 5;
export const findAdjacentWalkable = (
  world: World,
  position: Position,
  overrideCenter?: boolean
) => {
  const level = world.metadata.gameEntity[LEVEL] as Level;

  if (
    overrideCenter !== false &&
    (overrideCenter === true || level.walkable[position.x][position.y])
  ) {
    return position;
  }

  for (let direction = 1; direction <= MAX_DROP_RADIUS; direction += 1) {
    // centers
    for (const iteration of iterations) {
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
    for (const iteration of iterations) {
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

export const dropItem = (
  world: World,
  items: Inventory["items"],
  position: Position,
  loot: boolean = false,
  remains?: Sprite
) => {
  if (remains) {
    entities.createGround(world, {
      [FOG]: { visibility: "fog", type: "terrain" },
      [POSITION]: position,
      [SPRITE]: remains,
      [RENDERABLE]: { generation: 0 },
    });
  }

  const previousItems = [...items];
  previousItems.forEach((itemId, index) => {
    const dropPosition = findAdjacentWalkable(
      world,
      position,
      loot ? index === 0 && loot && !remains : undefined
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
          origin: copy(carrierEntity?.[POSITION] || dropPosition),
          itemId,
          drop: true,
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
        dropItem(
          world,
          entity[INVENTORY].items,
          entity[POSITION],
          !isPlayer,
          entity[DROPPABLE].remains
        );
        disposeEntity(world, entity);

        if (isPlayer) {
          // const animationEntity = entities.createFrame(world, {
          //   [REFERENCE]: {
          //     tick: -1,
          //     delta: 0,
          //     suspended: false,
          //     suspensionCounter: -1,
          //   },
          //   [RENDERABLE]: { generation: 1 },
          // });
          const tombstoneEntity = entities.createTombstone(world, {
            [ANIMATABLE]: { states: {} },
            [LIGHT]: { ...entity[LIGHT] },
            [POSITION]: copy(entity[POSITION]),
            [RENDERABLE]: { generation: 0 },
            [SPAWNABLE]: { position: copy(entity[POSITION]) },
            [SPRITE]: rip,
            [TOOLTIP]: { dialogs: [], nextDialog: -1, persistent: false },
            [VIEWABLE]: { active: entity[VIEWABLE].active },
          });
          registerEntity(world, tombstoneEntity);
        }
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
