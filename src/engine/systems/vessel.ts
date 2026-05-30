import { Entity } from "ecs";
import { World } from "../ecs";
import { POSITION, Position } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { getCell, moveEntity } from "./map";
import { isControllable } from "./freeze";
import { Orientation, orientationPoints } from "../components/orientable";
import { MOUNTABLE } from "../components/mountable";
import { PLAYER } from "../components/player";
import { invertOrientation } from "../../game/math/path";
import { EQUIPPABLE } from "../components/equippable";
import { ITEM } from "../components/item";
import { rerenderEntity } from "./renderer";
import { combine } from "../../game/math/std";
import { LEVEL } from "../components/level";
import { isWalkable } from "./movement";
import { isImmersible } from "./immersion";
import { getLootable } from "./collect";
import { getSpikable } from "./spike";
import { getClickable } from "./click";

export const getMountable = (world: World, position: Position) =>
  Object.values(getCell(world, position)).find(
    (entity) => MOUNTABLE in entity
  ) as Entity | undefined;

export const isMounting = (world: World, entity: Entity) =>
  !!entity[PLAYER]?.mount;

export const canMount = (world: World, entity: Entity, vessel: Entity) =>
  !isMounting(world, entity) && !vessel[MOUNTABLE].passenger;

export const mountVessel = (world: World, entity: Entity, vessel: Entity) => {
  const entityId = world.getEntityId(entity);
  const mountId = world.getEntityId(vessel);
  const frameEntity = world.assertByIdAndComponents(vessel[MOVABLE].reference, [
    REFERENCE,
    RENDERABLE,
  ]);

  vessel[MOVABLE].orientations = [];
  vessel[MOUNTABLE].passenger = entityId;
  vessel[MOUNTABLE].spring = entity[MOVABLE].spring;
  entity[MOVABLE].spring = { duration: frameEntity[REFERENCE].tick };
  entity[MOVABLE].orientations = [];
  entity[MOVABLE].pendingOrientation = undefined;
  entity[MOVABLE].lastInteraction = frameEntity[RENDERABLE].generation;
  entity[PLAYER].mount = mountId;

  // hide gear
  const weaponEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].weapon,
    [ITEM]
  );
  const offhandEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].offhand,
    [ITEM]
  );

  if (weaponEntity) {
    weaponEntity[ITEM].amount = 0;
    rerenderEntity(world, weaponEntity);
  }
  if (offhandEntity) {
    offhandEntity[ITEM].amount = 0;
    rerenderEntity(world, offhandEntity);
  }

  moveEntity(world, entity, vessel[POSITION]);
};

export const stopVessel = (world: World, vessel: Entity) => {
  vessel[MOVABLE].orientations = [];
  vessel[MOVABLE].pendingOrientation = undefined;
};

export const unmountVessel = (world: World, entity: Entity, vessel: Entity) => {
  const frameEntity = world.assertByIdAndComponents(vessel[MOVABLE].reference, [
    REFERENCE,
    RENDERABLE,
  ]);

  entity[PLAYER].mount = undefined;
  entity[MOVABLE].spring = vessel[MOUNTABLE].spring;
  entity[MOVABLE].lastInteraction = frameEntity[RENDERABLE].generation;
  vessel[MOUNTABLE].passenger = undefined;
  vessel[MOUNTABLE].spring = undefined;

  stopVessel(world, vessel);

  // reset boat being displacable
  frameEntity[REFERENCE].delta = 0;
  frameEntity[REFERENCE].suspended = true;
  frameEntity[REFERENCE].suspensionCounter = -1;

  // show gear
  const weaponEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].weapon,
    [ITEM]
  );
  const offhandEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].offhand,
    [ITEM]
  );

  if (weaponEntity) {
    weaponEntity[ITEM].amount = 1;
    rerenderEntity(world, weaponEntity);
  }
  if (offhandEntity) {
    offhandEntity[ITEM].amount = 1;
    rerenderEntity(world, offhandEntity);
  }
};

export default function setupVessel(world: World) {
  let referenceGenerations = -1;
  const entityReferences: Record<string, number> = {};

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    // handle entities inside a vessel
    for (const entity of world.getEntities([
      PLAYER,
      POSITION,
      MOVABLE,
      RENDERABLE,
    ])) {
      const entityId = world.getEntityId(entity);
      const entityReference = world.assertByIdAndComponents(
        entity[MOVABLE].reference,
        [RENDERABLE]
      )[RENDERABLE].generation;

      // skip if reference frame is unchanged
      if (entityReferences[entityId] === entityReference) continue;

      entityReferences[entityId] = entityReference;

      // skip if not mounted
      const mount = world.getEntityByIdAndComponents(entity[PLAYER].mount, [
        MOUNTABLE,
        MOVABLE,
      ]);
      if (
        !(isControllable(world, entity) || isMounting(world, entity)) ||
        !mount
      )
        continue;

      const targetOrientation: Orientation | null =
        entity[MOVABLE].pendingOrientation || entity[MOVABLE].orientations[0];

      if (!targetOrientation) continue;

      // leave vessel on beach
      const size = world.metadata.gameEntity[LEVEL].size;
      const targetPosition = combine(
        size,
        entity[POSITION],
        orientationPoints[targetOrientation]
      );

      // allow picking up and spiking
      const mountOrientation = mount[MOVABLE].orientations[0];
      const lootable = getLootable(world, targetPosition);
      const spikable = getSpikable(world, targetPosition);
      const clickable = getClickable(world, targetPosition);
      if (lootable || spikable || clickable) {
        if (mountOrientation) {
          stopVessel(world, mount);
        } else continue;
      } else if (
        isWalkable(world, targetPosition) &&
        !isImmersible(world, targetPosition)
      ) {
        if (mountOrientation) {
          stopVessel(world, mount);
        } else {
          unmountVessel(world, entity, mount);
          continue;
        }
      }

      // mark as interacted and remove pending movements
      entity[MOVABLE].lastInteraction = entityReference;
      entity[MOVABLE].pendingOrientation = undefined;
      entity[MOVABLE].orientations = [];

      const targetReference = world.assertByIdAndComponents(
        mount[MOVABLE].reference,
        [REFERENCE]
      );

      if (targetOrientation === mountOrientation) continue;

      if (
        mountOrientation &&
        targetOrientation === invertOrientation(mountOrientation)
      ) {
        targetReference[REFERENCE].delta = 0;
        targetReference[REFERENCE].suspended = true;
        targetReference[REFERENCE].suspensionCounter = -1;
        mount[MOVABLE].orientations = [];
      } else {
        // instantly start movement
        if (!mountOrientation) {
          targetReference[REFERENCE].delta = targetReference[REFERENCE].tick;
        }

        targetReference[REFERENCE].suspended = false;
        targetReference[REFERENCE].suspensionCounter = -1;
        mount[MOVABLE].orientations = [targetOrientation];
      }
    }
  };

  return { onUpdate };
}
