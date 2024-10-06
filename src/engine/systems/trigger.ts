import { World } from "../ecs";
import { POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { Entity } from "ecs";
import { QUEST } from "../components/quest";
import { ACTIONABLE } from "../components/actionable";
import { MOVABLE } from "../components/movable";
import { entities } from "..";
import { ANIMATABLE } from "../components/animatable";
import { TOOLTIP } from "../components/tooltip";
import { INVENTORY } from "../components/inventory";
import { Material } from "../components/item";
import { LOCKABLE } from "../components/lockable";
import {
  doorUnlocked,
  goldKey,
  ironKey,
  lockedGold,
  lockedIron,
} from "../../game/assets/sprites";
import { Sprite, SPRITE } from "../components/sprite";
import { LIGHT } from "../components/light";
import { rerenderEntity } from "./renderer";
import { disposeEntity, updateWalkable } from "./map";
import { getUnlockKey } from "./action";

export const getAction = (world: World, entity: Entity) =>
  ACTIONABLE in entity &&
  (world.getEntityById(entity[ACTIONABLE].quest) ||
    world.getEntityById(entity[ACTIONABLE].unlock));

export const lockMaterials: Partial<
  Record<Material, { door: Sprite; key: Sprite }>
> = {
  gold: { key: goldKey, door: lockedGold },
  iron: { key: ironKey, door: lockedIron },
};

export default function setupTrigger(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    for (const entity of world.getEntities([
      POSITION,
      ACTIONABLE,
      MOVABLE,
      RENDERABLE,
    ])) {
      const entityId = world.getEntityId(entity);
      const entityReference = world.getEntityById(entity[MOVABLE].reference)[
        RENDERABLE
      ].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      // skip if not actionable or not triggered
      if (!getAction(world, entity) || !entity[ACTIONABLE].triggered) continue;

      entity[ACTIONABLE].triggered = false;
      entity[MOVABLE].lastInteraction = entityReference;

      if (entity[ACTIONABLE].quest) {
        const questEntity = world.getEntityById(entity[ACTIONABLE].quest);

        // create reference frame for quest
        const animationEntity = entities.createFrame(world, {
          [REFERENCE]: {
            tick: -1,
            delta: 0,
            suspended: false,
            suspensionCounter: -1,
          },
          [RENDERABLE]: { generation: 1 },
        });
        entity[ANIMATABLE].states.quest = {
          name: questEntity[QUEST].id,
          reference: world.getEntityId(animationEntity),
          elapsed: 0,
          args: { step: "initial" },
          particles: {},
        };

        // remove quest from target
        questEntity[QUEST].id = undefined;
        questEntity[TOOLTIP].idle = undefined;
      } else if (entity[ACTIONABLE].unlock) {
        const unlockEntity = world.getEntityById(entity[ACTIONABLE].unlock);

        // check if entity has correct key
        const keyEntity = getUnlockKey(world, entity, unlockEntity);

        if (!keyEntity) continue;

        // unlock door
        unlockEntity[LOCKABLE].locked = false;
        unlockEntity[SPRITE] = doorUnlocked;
        unlockEntity[LIGHT].orientation = "left";
        rerenderEntity(world, unlockEntity);
        updateWalkable(world, unlockEntity[POSITION]);

        // remove key
        disposeEntity(world, keyEntity);
        const keyIndex = entity[INVENTORY].items.indexOf(
          world.getEntityId(keyEntity)
        );
        entity[INVENTORY].items.splice(keyIndex, 1);
        rerenderEntity(world, entity);
      }
    }
  };

  return { onUpdate };
}
