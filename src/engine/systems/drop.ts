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
import { POSITION } from "../components/position";
import { SPRITE } from "../components/sprite";
import { TOOLTIP } from "../components/tooltip";
import { none } from "../../game/assets/sprites";
import { ITEM } from "../components/item";

export const isDecayed = (world: World, entity: Entity) =>
  entity[DROPPABLE].decayed;

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
        disposeEntity(world, entity);

        const containerEntity = entities.createContainer(world, {
          [ANIMATABLE]: { states: {} },
          [FOG]: entity[FOG],
          [INVENTORY]: entity[INVENTORY],
          [LOOTABLE]: { disposable: true },
          [POSITION]: entity[POSITION],
          [RENDERABLE]: { generation: 0 },
          [SPRITE]: none,
          [TOOLTIP]: {},
        });
        registerEntity(world, containerEntity);
        const containerId = world.getEntityId(containerEntity);
        (entity[INVENTORY] as Inventory).items.forEach((item) => {
          const itemEntity = world.getEntityById(item);
          itemEntity[ITEM].carrier = containerId;
        });
      }
    }

    // remove entity when fully looted
    for (const entity of world.getEntities([LOOTABLE, RENDERABLE])) {
      if (entity[LOOTABLE].disposable && isEmpty(world, entity)) {
        disposeEntity(world, entity);
      }
    }
  };

  return { onUpdate };
}
