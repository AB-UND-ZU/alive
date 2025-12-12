import { Entity } from "ecs";
import { World } from "../ecs";
import { Position, POSITION } from "../components/position";
import { RENDERABLE } from "../components/renderable";
import { REFERENCE } from "../components/reference";
import { FreezeSequence, SEQUENCABLE } from "../components/sequencable";
import { disposeEntity, getCell, updateWalkable } from "./map";
import { createSequence } from "./sequence";
import { getSequence } from "./sequence";
import { AFFECTABLE } from "../components/affectable";
import { SPRITE } from "../components/sprite";
import { FREEZABLE } from "../components/freezable";
import { rerenderEntity } from "./renderer";
import { MOVABLE } from "../components/movable";
import addImmersible, { IMMERSIBLE } from "../components/immersible";
import { TypedEntity } from "../entities";
import { TEMPO } from "../components/tempo";
import { getTempo, isWalkable } from "./movement";
import { Orientation, orientationPoints } from "../components/orientable";
import { add } from "../../game/math/std";
import { PLAYER } from "../components/player";
import { isDead } from "./damage";
import { getSwimmables } from "./immersion";
import { SWIMMABLE } from "../components/swimmable";
import { extinguishEntity } from "./burn";
import { queueMessage } from "../../game/assets/utils";
import { createText, snow, snowCover } from "../../game/assets/sprites";
import { colors } from "../../game/assets/colors";
import { getLockable } from "./action";
import { LOCKABLE } from "../components/lockable";
import { CLICKABLE } from "../components/clickable";
import { LIQUID } from "../components/liquid";
import { getFragment, getOpaque } from "./enter";
import { entities } from "..";
import { FOG } from "../components/fog";
import { updateWaterCell } from "./water";
import { matrixFactory } from "../../game/math/matrix";
import { LEVEL } from "../components/level";

export const isFreezable = (world: World, entity: Entity) =>
  FREEZABLE in entity;

export const getFreezables = (world: World, position: Position) =>
  Object.values(getCell(world, position)).filter((entity) =>
    isFreezable(world, entity)
  ) as Entity[];

export const isFrozen = (world: World, entity: Entity) =>
  entity[FREEZABLE]?.frozen || entity[AFFECTABLE]?.freeze > 0;

export const getFrozen = (world: World, position: Position) =>
  Object.values(getCell(world, position)).filter(
    (entity) => isFreezable(world, entity) && isFrozen(world, entity)
  ) as Entity[];

export const getUnfrozen = (world: World, position: Position) =>
  Object.values(getCell(world, position)).filter(
    (entity) => isFreezable(world, entity) && !isFrozen(world, entity)
  ) as Entity[];

export const isSliding = (world: World, entity: Entity) =>
  !!entity[MOVABLE]?.momentum;

export const isControllable = (world: World, entity: Entity) =>
  MOVABLE in entity &&
  !isDead(world, entity) &&
  !isFrozen(world, entity) &&
  !isSliding(world, entity);

// swap sprites when freezing
export const freezeTerrain = (world: World, entity: Entity) => {
  if (isFrozen(world, entity)) return;

  entity[FREEZABLE].frozen = true;

  const originalSprite = entity[SPRITE];
  entity[SPRITE] = entity[FREEZABLE].sprite;
  entity[FREEZABLE].sprite = originalSprite;

  // replace water with ice terrain
  if (entity[IMMERSIBLE] && entity[TEMPO]) {
    entity[TEMPO].amount = 0;

    world.removeComponentFromEntity(
      entity as TypedEntity<"IMMERSIBLE">,
      IMMERSIBLE,
      false
    );
    updateWalkable(world, entity[POSITION]);
    updateWaterCell(world, entity[POSITION]);

    // cancel any bubble animations
    if (getSequence(world, entity, "bubble")) {
      delete entity[SEQUENCABLE].states.bubble;
      rerenderEntity(world, entity);
    }

    // lift up immersed units
    const swimmables = getSwimmables(world, entity[POSITION]);
    for (const swimmableEntity of swimmables) {
      swimmableEntity[SWIMMABLE].swimming = false;
      rerenderEntity(world, swimmableEntity);
    }
  }

  rerenderEntity(world, entity);
};

// swap sprites when thawing
export const thawTerrain = (world: World, entity: Entity) => {
  entity[FREEZABLE].frozen = false;

  const originalSprite = entity[SPRITE];
  entity[SPRITE] = entity[FREEZABLE].sprite;
  entity[FREEZABLE].sprite = originalSprite;

  // replace ice with water terrain
  if (entity[TEMPO]) {
    entity[TEMPO].amount = -2;

    addImmersible(world, entity, {});
    updateWalkable(world, entity[POSITION]);
    updateWaterCell(world, entity[POSITION]);

    // lift up immersed units
    const swimmables = getSwimmables(world, entity[POSITION]);
    for (const swimmableEntity of swimmables) {
      swimmableEntity[SWIMMABLE].swimming = true;
      rerenderEntity(world, swimmableEntity);
    }
  }

  // create smoke
  extinguishEntity(world, entity);

  rerenderEntity(world, entity);
};

export const freezeMomentum = (
  world: World,
  entity: Entity,
  orientation?: Orientation
) => {
  const freezable = getFreezables(world, entity[POSITION])[0];
  const frozen = freezable && isFrozen(world, freezable);
  const lockable = getLockable(world, entity[POSITION]);
  const walkthrough = lockable && lockable[LOCKABLE].type !== "gate";
  const sliding = frozen || walkthrough;

  const momentumOrientation =
    orientation || (entity[MOVABLE].momentum as Orientation | undefined);
  const targetMovable =
    momentumOrientation &&
    isWalkable(
      world,
      add(entity[POSITION], orientationPoints[momentumOrientation])
    );

  if (sliding && !entity[MOVABLE].momentum && targetMovable && orientation) {
    // let units slide
    entity[MOVABLE].momentum = orientation;
  } else if (
    (!sliding || !targetMovable) &&
    (entity[MOVABLE].momentum || !orientation)
  ) {
    // stop sliding
    entity[MOVABLE].momentum = undefined;
  }

  // freeze on ice
  if (frozen && entity[AFFECTABLE] && targetMovable) {
    if (entity[AFFECTABLE].freeze === 1 && entity[SEQUENCABLE]?.states.freeze) {
      // extend sequence rather than retriggering
      entity[SEQUENCABLE].states.freeze.elapsed = 0;
    }
    entity[AFFECTABLE].freeze = Math.max(entity[AFFECTABLE].freeze, 1);
  }

  // ensure suspendable references keep on sliding
  const movableReference = world.assertByIdAndComponents(
    entity[MOVABLE].reference,
    [REFERENCE, RENDERABLE]
  );
  if (
    entity[MOVABLE].momentum &&
    movableReference[REFERENCE].suspensionCounter === 0 &&
    entity[PLAYER]
  ) {
    movableReference[REFERENCE].suspensionCounter = -1;
  } else if (
    entity[PLAYER] &&
    !entity[MOVABLE].momentum &&
    entity[MOVABLE].orientations.length === 0
  ) {
    movableReference[REFERENCE].suspensionCounter = 0;
  }
};

export const isSnowy = (world: World, position: Position) =>
  Object.values(getCell(world, position)).some(
    (entity) => entity[LIQUID]?.type === "snow"
  );

const snowFill = 0.4;
export const coverSnow = (
  world: World,
  position: Position,
  creation = false
) => {
  // check odds and don't repeat snow
  const willFreeze = getUnfrozen(world, position).length > 0;
  if (
    isSnowy(world, position) ||
    (getTempo(world, position) !== 0 && !willFreeze) ||
    getOpaque(world, position) ||
    getLockable(world, position) ||
    getFragment(world, position)
  )
    return;

  if (!willFreeze && !creation) {
    // ensure distributed snow fill
    let fill = 0;
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        const delta = { x: offsetX, y: offsetY };
        const targetPosition = add(position, delta);
        if (isSnowy(world, targetPosition)) {
          fill += 1;
        }
        if (fill / 9 > snowFill) return;
      }
    }
  }

  if (!creation || willFreeze || Math.random() <= snowFill) {
    applySnow(world, position);
  }

  if (creation && willFreeze && Math.random() <= snowFill) {
    applySnow(world, position);
  }
};

export const applySnow = (world: World, position: Position) => {
  const unfrozen = getUnfrozen(world, position);
  if (unfrozen.length > 0) {
    unfrozen.forEach((entity) => freezeTerrain(world, entity));
    return;
  }
  const hasFrozen = getFrozen(world, position).length > 0;

  entities.createSnow(world, {
    [CLICKABLE]: { clicked: false, player: false },
    [FOG]: {
      visibility: "hidden",
      type: hasFrozen ? "object" : "terrain",
    },
    [LIQUID]: { type: "snow" },
    [POSITION]: position,
    [RENDERABLE]: { generation: 0 },
    [SPRITE]: hasFrozen ? snowCover : snow,
  });
};

export const applySnowMap = (world: World) => {
  const size = world.metadata.gameEntity[LEVEL].size;
  matrixFactory(size, size, (x, y) => {
    coverSnow(world, { x, y });
  });
};

export default function setupFreeze(world: World) {
  let referenceGenerations = -1;

  const onUpdate = (delta: number) => {
    const generation = world
      .getEntities([RENDERABLE, REFERENCE])
      .reduce((total, entity) => entity[RENDERABLE].generation + total, 0);

    if (referenceGenerations === generation) return;

    referenceGenerations = generation;

    for (const entity of world.getEntities([
      POSITION,
      AFFECTABLE,
      RENDERABLE,
      SEQUENCABLE,
    ])) {
      if (entity[AFFECTABLE].freeze === 0) continue;

      // freeze units
      if (!getSequence(world, entity, "freeze")) {
        createSequence<"freeze", FreezeSequence>(
          world,
          entity,
          "freeze",
          "unitFreeze",
          { total: entity[AFFECTABLE].freeze }
        );

        if (!entity[MOVABLE]?.momentum) {
          queueMessage(world, entity, {
            line: createText("FROZEN", colors.aqua),
            orientation: "up",
            fast: false,
            delay: 0,
          });
        }
      }

      // prevent movements
      if (entity[MOVABLE]) {
        const entityReference = world.assertByIdAndComponents(
          entity[MOVABLE].reference,
          [RENDERABLE]
        )[RENDERABLE].generation;

        entity[MOVABLE].lastInteraction = entityReference;
        entity[MOVABLE].pendingOrientation = undefined;
      }
    }

    // remove snow
    for (const entity of world.getEntities([CLICKABLE, LIQUID])) {
      if (entity[LIQUID].type === "snow" && entity[CLICKABLE].clicked) {
        disposeEntity(world, entity);
      }
    }
  };

  return { onUpdate };
}
