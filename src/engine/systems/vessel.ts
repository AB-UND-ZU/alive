import { syncMovementSpring } from "../motion";
import { requireComponent, hasComponent, TypedEntity } from "../entities";
import { World } from "../ecs";
import { POSITION, Position } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { MOVABLE } from "../components/movable";
import { disposeSequence, getCellEntities, moveEntity, registerEntity, unregisterEntity } from "./map";
import { isControllable } from "./freeze";
import { Orientation, orientationPoints } from "../components/orientable";
import { SEQUENCABLE, Sequencable } from "../components/sequencable";
import { TAMEABLE } from "../components/tameable";
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
import { bubbleSound } from "./water";
import { getClickable } from "./click";

export const getMountable = (world: World, position: Position) =>
  getCellEntities(world, position).find((entity) => hasComponent(entity, MOUNTABLE)) as
    | TypedEntity<"POSITION" | "MOUNTABLE">
    | undefined;

export const isMounting = (world: World, entity: TypedEntity) =>
  !!entity[PLAYER]?.mount;

export const canMount = (world: World, entity: TypedEntity, vessel: TypedEntity) =>
  !isMounting(world, entity) && !requireComponent(vessel, MOUNTABLE).passenger;

export const mountVessel = (world: World, entity: TypedEntity<"MOVABLE">, vessel: TypedEntity) => {
  const entityId = world.getEntityId(entity);
  const mountId = world.getEntityId(vessel);
  const movement = requireComponent(vessel, MOVABLE);
  const frameEntity = world.assertByIdAndComponents(movement.reference, [
    REFERENCE,
    RENDERABLE,
  ]);

  movement.orientations = [];
  const vesselMount = requireComponent(vessel, MOUNTABLE);
  vesselMount.passenger = entityId;
  vesselMount.spring = entity[MOVABLE].spring;
  entity[MOVABLE].spring = { duration: frameEntity[REFERENCE].tick };
  syncMovementSpring(world, entity);
  entity[MOVABLE].orientations = [];
  entity[MOVABLE].pendingOrientation = undefined;
  entity[MOVABLE].lastInteraction = frameEntity[RENDERABLE].generation;
  requireComponent(entity, PLAYER).mount = mountId;

  // hide gear
  const equipment = requireComponent(entity, EQUIPPABLE);
  const weaponEntity = world.getEntityByIdAndComponents(
    equipment.weapon,
    [ITEM]
  );
  const offhandEntity = world.getEntityByIdAndComponents(
    equipment.offhand,
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

  moveEntity(world, entity, requireComponent(vessel, POSITION));
};

export function boardPet(world: World, pet: TypedEntity<"POSITION">) {
  const states = pet[SEQUENCABLE]?.states;
  if (states?.collect || states?.progress || states?.aura) return;
  const petId = world.getEntityId(pet);
  if (world.getEntities(["LOOTABLE"]).some(drop => drop.LOOTABLE.offering?.pet === petId)) return;
  if (world.getEntities(["CASTABLE", SEQUENCABLE]).some(spell =>
    spell[SEQUENCABLE].states.xp?.args.offering?.pet === petId
  )) return;
  for (const name of Object.keys(states ?? {})) {
    disposeSequence(world, pet, name as keyof Sequencable["states"]);
  }
  unregisterEntity(world, pet);
  world.removeComponentFromEntity(pet, POSITION, false);
  rerenderEntity(world, world.metadata.sequenceEntity);
}

export function landPets(world: World, owner: TypedEntity, position: Position) {
  const ownerId = world.getEntityId(owner);
  for (const pet of world.getEntities([TAMEABLE, MOVABLE, RENDERABLE])) {
    if (pet[POSITION] || pet[TAMEABLE].owner !== ownerId) continue;
    const pattern = pet.BEHAVIOUR?.patterns.find(pattern => pattern.name === "pet");
    if (pattern) pattern.memory.landing = true;
    world.addComponentToEntity(pet, POSITION, { ...position });
    registerEntity(world, pet);
    rerenderEntity(world, pet);
  }
}

export const stopVessel = (world: World, vessel: TypedEntity<"MOVABLE">) => {
  const mount = requireComponent(vessel, MOUNTABLE);
  if (
    mount.medium === "water" &&
    mount.passenger &&
    vessel[MOVABLE].orientations.length > 0 &&
    isImmersible(world, requireComponent(vessel, POSITION))
  ) {
    bubbleSound(world, vessel, "bubble");
  }
  vessel[MOVABLE].orientations = [];
  vessel[MOVABLE].pendingOrientation = undefined;
};

export const unmountVessel = (world: World, entity: TypedEntity<"MOVABLE" | "PLAYER">, vessel: TypedEntity) => {
  const frameEntity = world.assertByIdAndComponents(requireComponent(vessel, MOVABLE).reference, [
    REFERENCE,
    RENDERABLE,
  ]);

  landPets(world, entity, requireComponent(vessel, POSITION));
  entity[PLAYER].mount = undefined;
  const vesselMount = requireComponent(vessel, MOUNTABLE);
  entity[MOVABLE].spring = vesselMount.spring;
  syncMovementSpring(world, entity);
  entity[MOVABLE].lastInteraction = frameEntity[RENDERABLE].generation;
  vesselMount.passenger = undefined;
  vesselMount.spring = undefined;

  stopVessel(world, world.assertComponents(vessel, [MOVABLE]));

  // reset boat being displacable
  if (frameEntity === world.metadata.gameEntity) return;

  frameEntity[REFERENCE].delta = 0;
  frameEntity[REFERENCE].suspended = true;
  frameEntity[REFERENCE].suspensionCounter = -1;

  // show gear
  const equipment = requireComponent(entity, EQUIPPABLE);
  const weaponEntity = world.getEntityByIdAndComponents(
    equipment.weapon,
    [ITEM]
  );
  const offhandEntity = world.getEntityByIdAndComponents(
    equipment.offhand,
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
        POSITION,
      ]);
      if (!isControllable(world, entity) || !mount) continue;

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
        stopVessel(world, mount);
      } else {
        if (
          mount[MOUNTABLE].medium === "water" &&
          isImmersible(world, mount[POSITION])
        ) {
          bubbleSound(world, mount, "bubble");
        }
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
