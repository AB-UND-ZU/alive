import {
  decayHeight,
  focusHeight,
  particleHeight,
  tooltipHeight,
} from "../../components/Entity/utils";
import { entities } from "../../engine";
import { COUNTABLE } from "../../engine/components/countable";
import { DROPPABLE } from "../../engine/components/droppable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FOCUSABLE } from "../../engine/components/focusable";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { LEVEL } from "../../engine/components/level";
import { LIGHT } from "../../engine/components/light";
import { LOOTABLE } from "../../engine/components/lootable";
import { MELEE } from "../../engine/components/melee";
import {
  ORIENTABLE,
  orientationPoints,
} from "../../engine/components/orientable";
import { PARTICLE } from "../../engine/components/particle";
import { POSITION } from "../../engine/components/position";
import { RENDERABLE } from "../../engine/components/renderable";
import { REVIVABLE } from "../../engine/components/revivable";
import { SPRITE } from "../../engine/components/sprite";
import { TOOLTIP } from "../../engine/components/tooltip";
import { TRACKABLE } from "../../engine/components/trackable";
import { isUnlocked } from "../../engine/systems/action";
import { collectItem, isEmpty } from "../../engine/systems/collect";
import { isDead } from "../../engine/systems/damage";
import { disposeEntity, moveEntity } from "../../engine/systems/map";
import {
  getEntityGeneration,
  rerenderEntity,
} from "../../engine/systems/renderer";
import { openDoor, removeFromInventory } from "../../engine/systems/trigger";
import * as colors from "./colors";
import { relativeOrientations } from "../math/path";
import {
  add,
  distribution,
  getDistance,
  lerp,
  normalize,
  signedDistance,
} from "../math/std";
import { iterations } from "../math/tracing";
import {
  createCounter,
  createDialog,
  createText,
  decay,
  doorClosedWood,
  fire,
  ghost,
  hit,
  none,
  pointer,
  woodStick,
} from "./sprites";
import {
  BurnSequence,
  CollectSequence,
  CounterSequence,
  DecaySequence,
  DialogSequence,
  DisposeSequence,
  FocusSequence,
  MeleeSequence,
  PerishSequence,
  PointerSequence,
  ReviveSequence,
  SEQUENCABLE,
  Sequence,
  UnlockSequence,
  VisionSequence,
} from "../../engine/components/sequencable";
import { getSequence } from "../../engine/systems/sequence";
import { SOUL } from "../../engine/components/soul";

export * from "./npcs";
export * from "./quests";

export const swordAttack: Sequence<MeleeSequence> = (world, entity, state) => {
  // align sword with facing direction
  const finished = state.elapsed > 150;
  const meleeEntity = world.assertByIdAndComponents(entity[EQUIPPABLE].melee, [
    ORIENTABLE,
  ]);
  const currentFacing = meleeEntity[ORIENTABLE].facing;
  const facing = finished ? undefined : state.args.facing;
  const updated = currentFacing !== facing;

  if (!state.particles.hit) {
    const delta = orientationPoints[state.args.facing];
    const hitParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: delta.x,
        offsetY: delta.y,
        offsetZ: particleHeight,
        amount: state.args.damage,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: hit,
    });
    state.particles.hit = world.getEntityId(hitParticle);
  }

  if (updated) {
    meleeEntity[ORIENTABLE].facing = facing;
  }

  if (finished && state.particles.hit) {
    disposeEntity(world, world.assertById(state.particles.hit));
    delete state.particles.hit;
  }

  return { finished, updated };
};

export const damageCounter: Sequence<CounterSequence> = (
  world,
  entity,
  state
) => {
  const finished = state.elapsed > 200;
  let updated = false;

  if (!state.particles.counter) {
    const delta = orientationPoints[state.args.facing];
    const counterParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: delta.x,
        offsetY: delta.y,
        offsetZ: particleHeight,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: createCounter(state.args.amount),
    });
    state.particles.counter = world.getEntityId(counterParticle);
    updated = true;
  }

  const counterParticle = world.assertByIdAndComponents(
    state.particles.counter,
    [SPRITE]
  );
  const char = state.args.amount > 9 ? "#" : state.args.amount.toString();
  if (counterParticle[SPRITE].layers[0].char !== char) {
    counterParticle[SPRITE].layers[0].char = char;
    updated = true;
  }

  return { finished, updated };
};

const haltTime = 200;
const decayTime = 500;

export const creatureDecay: Sequence<DecaySequence> = (
  world,
  entity,
  state
) => {
  let updated = false;
  const finished = state.elapsed > decayTime;

  // create death particle
  if (!state.particles.decay && state.elapsed > haltTime && !finished) {
    const deathParticle = entities.createParticle(world, {
      [PARTICLE]: { offsetX: 0, offsetY: 0, offsetZ: decayHeight },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: decay,
    });
    state.particles.decay = world.getEntityId(deathParticle);
    updated = true;
  }

  // delete death particle and make entity lootable
  if (finished) {
    if (state.particles.decay) {
      disposeEntity(world, world.assertById(state.particles.decay));
      delete state.particles.decay;
    }

    entity[DROPPABLE].decayed = true;
  }

  return { finished, updated };
};

export const fireBurn: Sequence<BurnSequence> = (world, entity, state) => {
  let updated = false;
  let finished = false;

  // create death particle
  if (!state.particles.fire) {
    const fireParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: particleHeight,
        amount: 1,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: fire,
    });
    state.particles.fire = world.getEntityId(fireParticle);
    updated = true;
  }

  const generation = world.metadata.gameEntity[RENDERABLE].generation;

  if (generation !== state.args.generation) {
    state.args.generation = generation;
    const fireParticle = world.assertByIdAndComponents(state.particles.fire, [
      PARTICLE,
    ]);
    const amount = fireParticle[PARTICLE].amount;
    fireParticle[PARTICLE].amount =
      amount === 2 ? [1, 3][distribution(40, 60)] : 2;
    //rerenderEntity(world, fireParticle);
    updated = true;
  }

  // TODO: decay of fire

  return { finished, updated };
};

// keep door locked until animation is finished
const keyTime = 200;
const unlockTime = 500;

export const doorUnlock: Sequence<UnlockSequence> = (world, entity, state) => {
  let updated = false;
  const finished = state.elapsed > unlockTime;
  const keyEntity = world.assertByIdAndComponents(state.args.itemId, [SPRITE]);

  // create key particle
  if (!state.particles.key && !finished) {
    const size = world.metadata.gameEntity[LEVEL].size;
    const delta = {
      x: signedDistance(entity[POSITION].x, state.args.origin.x, size),
      y: signedDistance(entity[POSITION].y, state.args.origin.y, size),
    };

    const keyParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: tooltipHeight,
        animatedOrigin: delta,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: keyEntity[SPRITE],
    });
    state.particles.key = world.getEntityId(keyParticle);
    updated = true;
  }

  if (state.particles.key && (finished || state.elapsed > keyTime)) {
    disposeEntity(world, world.assertById(state.particles.key));
    delete state.particles.key;

    // disarm door
    entity[SPRITE] = doorClosedWood;
  }

  if (finished) {
    // discard key
    disposeEntity(world, keyEntity);
    openDoor(world, entity);
  }

  return { finished, updated };
};

// floor at non-zero value to render full shadow
const MIN_LIGHT_RADIUS = 0.02;
const visionTime = 2000;

export const changeRadius: Sequence<VisionSequence> = (
  world,
  entity,
  state
) => {
  const updated = true;
  const circleTime = state.args.fast ? visionTime / 2 : visionTime;
  const finished = state.elapsed > circleTime;

  if (!state.args.previousLight) {
    state.args.previousLight = { ...entity[LIGHT] };
  }

  const ratio = Math.min(state.elapsed / circleTime, 1);
  const targetBrightness = state.args.light?.brightness || MIN_LIGHT_RADIUS;
  const targetVisibility = state.args.light?.visibility || MIN_LIGHT_RADIUS;

  if (
    entity[LIGHT].brightness === targetBrightness &&
    entity[LIGHT].visibility === targetVisibility
  ) {
    return { updated: false, finished: true };
  }

  // reduce circular light radius
  entity[LIGHT].brightness = lerp(
    state.args.previousLight?.brightness || MIN_LIGHT_RADIUS,
    targetBrightness,
    ratio
  );
  entity[LIGHT].visibility = lerp(
    state.args.previousLight?.visibility || MIN_LIGHT_RADIUS,
    targetVisibility,
    ratio
  );

  if (finished) {
    entity[LIGHT].brightness = targetBrightness;
    entity[LIGHT].visibility = targetVisibility;
  }

  return { finished, updated };
};

const ripTime = visionTime + 500;
const spawnTime = ripTime + 500;

// how unfortunate
export const tragicDeath: Sequence<PerishSequence> = (world, entity, state) => {
  let updated = false;
  const finished = state.elapsed > spawnTime;

  if (state.elapsed > ripTime && !entity[TOOLTIP].dialogs.length) {
    entity[TOOLTIP].dialogs = [createDialog("RIP")];
    entity[TOOLTIP].changed = true;
    entity[TOOLTIP].override = "visible";
    updated = true;
  }

  if (finished) {
    entity[REVIVABLE].available = true;
  }

  return { finished, updated };
};

// keep entities around to keep swimmable animation for collecting particles
const disposeTime = 200;

export const entityDispose: Sequence<DisposeSequence> = (
  world,
  entity,
  state
) => {
  const updated = false;
  const finished = state.elapsed > disposeTime;

  if (finished) {
    disposeEntity(world, entity, false);
  }

  return { finished, updated };
};

const lootDelay = 200;
export const itemCollect: Sequence<CollectSequence> = (
  world,
  entity,
  state
) => {
  let updated = false;
  let finished = false;
  const entityId = world.getEntityId(entity);
  const lootId = state.particles.loot;
  const itemId = state.args.itemId;
  const size = world.metadata.gameEntity[LEVEL].size;
  const itemEntity = world.assertByIdAndComponents(itemId, [
    RENDERABLE,
    ITEM,
    SPRITE,
  ]);

  // add item to player's inventory
  if (state.elapsed >= lootDelay) {
    if (lootId) {
      const lootParticle = world.assertById(lootId);
      disposeEntity(world, lootParticle);
      delete state.particles.loot;
    }

    // set disposable if it is a dropped loot
    if (state.args.drop) {
      entity[LOOTABLE].disposable = true;
      itemEntity[ITEM].carrier = entityId;
      entity[INVENTORY].items.push(itemId);
    } else {
      let targetSlot = itemEntity[ITEM].slot;
      let targetCounter = itemEntity[ITEM].counter;
      let targetConsume = itemEntity[ITEM].consume;
      let targetItem = itemEntity;

      // if no sword is equipped, use wood as stick
      if (
        entity[MELEE] &&
        !entity[EQUIPPABLE].melee &&
        targetCounter === "wood"
      ) {
        targetSlot = "melee";
        targetCounter = undefined;
        targetItem = entities.createSword(world, {
          [ITEM]: { amount: 1, slot: "melee", carrier: entityId },
          [ORIENTABLE]: {},
          [RENDERABLE]: { generation: 0 },
          [SEQUENCABLE]: { states: {} },
          [SPRITE]: woodStick,
        });
      }

      const targetId = world.getEntityId(targetItem);

      if (targetSlot) {
        const existingId = entity[EQUIPPABLE][targetSlot];

        // add existing render count if item is replaced
        if (existingId) {
          const existingItem = world.assertById(existingId);
          targetItem[RENDERABLE].generation += getEntityGeneration(
            world,
            existingItem
          );

          // TODO: handle dropping existing item instead
          removeFromInventory(world, entity, existingItem);
          disposeEntity(world, existingItem);
        }

        entity[EQUIPPABLE][targetSlot] = targetId;
        entity[INVENTORY].items.push(targetId);
      } else if (targetConsume) {
        entity[INVENTORY].items.push(targetId);
      } else if (targetCounter) {
        entity[COUNTABLE][targetCounter] += 1;
      }
    }

    finished = true;
  }

  // create loot particle
  if (!lootId && state.elapsed < lootDelay) {
    const delta = {
      x: signedDistance(entity[POSITION].x, state.args.origin.x, size),
      y: signedDistance(entity[POSITION].y, state.args.origin.y, size),
    };
    const lootParticle = entities.createCollecting(world, {
      [ORIENTABLE]: { facing: itemEntity[ORIENTABLE]?.facing },
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: tooltipHeight,
        animatedOrigin: delta,
        amount: state.args.drop,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: itemEntity[SPRITE],
    });
    state.particles.loot = world.getEntityId(lootParticle);
    updated = true;
  }

  return { finished, updated };
};

// animate light on tombstone before respawning hero
const soulTime = visionTime / 2;
const arriveTime = 2500;
const soulSpeed = 1 / 70;

export const soulRespawn: Sequence<ReviveSequence> = (world, entity, state) => {
  let updated = false;
  const size = world.metadata.gameEntity[LEVEL].size;
  const entityId = world.getEntityId(entity);
  const origin =
    state.args.origin ||
    world.assertByIdAndComponents(state.args.tombstoneId, [POSITION])[POSITION];
  const compassEntity = world.getIdentifierAndComponents("compass", [ITEM]);
  const compassId = state.args.compassId;

  if (!state.args.origin) state.args.origin = origin;

  const delta = {
    x: signedDistance(origin.x, state.args.target.x, size),
    y: signedDistance(origin.y, state.args.target.y, size),
  };

  const spawnDistance = Math.sqrt(delta.x ** 2 + delta.y ** 2);
  const soulDuration = spawnDistance / soulSpeed;
  const collectTime = state.args.compassId ? soulTime + lootDelay : soulTime;
  const moveTime = collectTime + soulDuration;
  const finished = state.elapsed > moveTime + arriveTime;

  // collect compass
  if (
    state.elapsed > collectTime &&
    compassId &&
    compassEntity &&
    compassEntity[ITEM].carrier !== entityId
  ) {
    collectItem(world, entity, world.assertById(compassEntity[ITEM].carrier));
    updated = true;
  }

  // create soul particle
  if (
    state.elapsed > soulTime &&
    state.elapsed < moveTime &&
    !state.particles.soul
  ) {
    const soulParticle = entities.createParticle(world, {
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: particleHeight,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: ghost,
    });
    state.particles.soul = world.getEntityId(soulParticle);
    updated = true;
  }

  // collect compass
  if (
    state.elapsed > soulTime &&
    state.elapsed < moveTime &&
    state.args.compassId &&
    compassEntity &&
    compassEntity[ITEM].carrier !== entityId
  ) {
    collectItem(world, entity, world.assertById(compassEntity[ITEM].carrier));
  }

  // update viewpoint if moved
  const ratio = (state.elapsed - collectTime) / soulDuration;
  const flightLocation = origin && {
    x: normalize(Math.round(origin.x + delta.x * ratio), size),
    y: normalize(Math.round(origin.y + delta.y * ratio), size),
  };
  if (
    state.elapsed > collectTime &&
    state.elapsed < moveTime &&
    (flightLocation.x !== entity[POSITION].x ||
      flightLocation.y !== entity[POSITION].y)
  ) {
    moveEntity(world, entity, flightLocation);
    rerenderEntity(world, entity);
    updated = true;
  }

  // mark soul as ready to be spawned
  if (finished) {
    entity[SOUL].ready = true;
  }

  return { finished, updated };
};

const lineSprites = createText("─┐│┘─└│┌", colors.lime);

export const focusCircle: Sequence<FocusSequence> = (world, entity, state) => {
  const finished = false;
  let updated = false;

  // create all 8 surrounding particles
  if (Object.keys(state.particles).length !== 8) {
    for (let i = 0; i < 4; i += 1) {
      const iteration = iterations[i];
      const sideParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: iteration.direction.x,
          offsetY: iteration.direction.y,
          offsetZ: focusHeight,
          animatedOrigin: { x: 0, y: 0 },
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: none,
      });
      const cornerParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: iteration.direction.x + iteration.normal.x,
          offsetY: iteration.direction.y + iteration.normal.y,
          offsetZ: focusHeight,
          animatedOrigin: { x: 0, y: 0 },
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: none,
      });
      state.particles[`line-${i * 2}`] = world.getEntityId(sideParticle);
      state.particles[`line-${i * 2 + 1}`] = world.getEntityId(cornerParticle);
    }
    updated = true;
  }

  const currentIndex = parseInt(
    Object.keys(Array.from({ length: 8 })).find(
      (lineIndex) =>
        world.assertByIdAndComponents(state.particles[`line-${lineIndex}`], [
          SPRITE,
        ])[SPRITE].layers.length > 0
    ) || "-1"
  );
  const focusIndex = world.metadata.gameEntity[RENDERABLE].generation % 4;
  const currentActive = currentIndex !== -1;
  const isActive = !!entity[FOCUSABLE].target;

  // disable all on inactive
  if (currentActive && !isActive) {
    for (let i = 0; i < 8; i += 1) {
      const particle = world.assertByIdAndComponents(
        state.particles[`line-${i}`],
        [SPRITE]
      );
      particle[SPRITE] = none;
    }

    updated = true;
  } else if (isActive && currentIndex !== focusIndex) {
    // rotate focus by toggling visibility of 8 individual particles
    for (let i = 0; i < 8; i += 1) {
      const particle = world.assertByIdAndComponents(
        state.particles[`line-${i}`],
        [SPRITE]
      );
      const particleIndex = i % 4;
      particle[SPRITE] = particleIndex === focusIndex ? lineSprites[i] : none;
    }

    updated = true;
  }

  return { finished, updated };
};

const charDelay = 33;
const tooltipDelay = 500;

export const dialogText: Sequence<DialogSequence> = (world, entity, state) => {
  const heroEntity = world.getIdentifierAndComponents("hero", [POSITION]);

  let updated = false;

  // display if located in any adjacent cell
  const size = world.metadata.gameEntity[LEVEL].size;
  const delta = heroEntity &&
    !isDead(world, heroEntity) && {
      x: signedDistance(heroEntity[POSITION].x, entity[POSITION].x, size),
      y: signedDistance(heroEntity[POSITION].y, entity[POSITION].y, size),
    };
  const isAdjacent =
    !!delta && Math.abs(delta.x) <= 1 && Math.abs(delta.y) <= 1;
  const changed = entity[TOOLTIP].changed;
  const pendingEntity =
    state.args.after &&
    world.getEntityByIdAndComponents(state.args.after, [SEQUENCABLE]);
  const pendingSequence =
    pendingEntity && getSequence(world, pendingEntity, "dialog");
  const pending = pendingSequence && !pendingSequence.args.isIdle;
  const active =
    !changed &&
    (entity[TOOLTIP].override === "visible" ||
      (state.args.isIdle && !isAdjacent) ||
      (isAdjacent &&
        !!heroEntity &&
        !isDead(world, heroEntity) &&
        !entity[TOOLTIP].override &&
        !isDead(world, entity) &&
        !isEmpty(world, entity) &&
        !isUnlocked(world, entity)));

  const totalLength = state.args.text.length;
  const orientation =
    (!state.args.isIdle &&
      active &&
      delta &&
      (delta.y > 0 ? "down" : delta.y < 0 && "up")) ||
    state.args.orientation ||
    (state.args.isDialog || state.args.isIdle ? "up" : "down");

  if (state.args.orientation !== orientation) {
    // prevent idle text from reorienting
    updated = !state.args.isIdle;
    state.args.orientation = orientation;
  }

  // create char particles
  const particlesLength = Object.keys(state.particles).length;
  if (particlesLength === 0) {
    for (let i = 0; i < totalLength; i += 1) {
      const origin = add(orientationPoints[state.args.orientation], {
        x: -Math.floor((totalLength - 1) / 2),
        y: 0,
      });
      const charPosition = add(origin, { x: i, y: 0 });
      const particleName = `char-${i}`;

      const charParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: charPosition.x,
          offsetY: charPosition.y,
          offsetZ:
            state.args.isDialog || state.args.isIdle
              ? particleHeight
              : tooltipHeight,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: none,
      });
      state.particles[particleName] = world.getEntityId(charParticle);
    }
  }

  const cursorIndex = Array.from({ length: totalLength }).findIndex((_, i) => {
    const particleName = `char-${i}`;
    const particleEntity = world.assertByIdAndComponents(
      state.particles[particleName],
      [SPRITE]
    );
    return particleEntity[SPRITE] === none;
  });
  const currentLength = cursorIndex === -1 ? totalLength : cursorIndex;

  // update timestamp on active change
  if (active !== state.args.active || !!pending !== !!state.args.after) {
    const isDelayed =
      !active &&
      entity[TOOLTIP].persistent &&
      !isDead(world, entity) &&
      !state.args.isIdle &&
      !state.args.isDialog;
    state.args.timestamp = isDelayed
      ? state.elapsed + tooltipDelay
      : state.elapsed;
    state.args.active = active;
    state.args.lengthOffset = isDelayed ? totalLength : currentLength;
    state.args.after = pending ? state.args.after : undefined;
  }

  const charCount = Math.max(
    Math.floor((state.elapsed - state.args.timestamp) / charDelay),
    0
  );
  const targetLength =
    active && !pending
      ? Math.min(state.args.lengthOffset + charCount, totalLength)
      : Math.max(Math.min(totalLength, state.args.lengthOffset) - charCount, 0);

  let finished = false;
  if (currentLength !== targetLength) {
    updated = true;
  }

  if (updated) {
    const origin = add(orientationPoints[state.args.orientation], {
      x: -Math.floor((totalLength - 1) / 2),
      y: 0,
    });

    for (let i = 0; i < totalLength; i += 1) {
      const charSprite = i < targetLength ? state.args.text[i] : none;
      const charPosition = add(origin, { x: i, y: 0 });
      const particleName = `char-${i}`;

      const charParticle = world.assertByIdAndComponents(
        state.particles[particleName],
        [PARTICLE, SPRITE]
      );
      charParticle[PARTICLE].offsetX = charPosition.x;
      charParticle[PARTICLE].offsetY = charPosition.y;
      charParticle[SPRITE] = charSprite;
    }
  }

  // remove particles if player is not in adjacent position anymore and text is fully hidden
  if (!active && currentLength === 0) {
    for (let i = 0; i < totalLength; i += 1) {
      const particleName = `char-${i}`;
      disposeEntity(world, world.assertById(state.particles[particleName]));
      delete state.particles[particleName];
    }

    entity[TOOLTIP].changed = undefined;

    finished = true;
  }

  return { finished, updated };
};

export const pointerArrow: Sequence<PointerSequence> = (
  world,
  entity,
  state
) => {
  let updated = false;
  let finished = false;

  const compassEntity = world.getEntityByIdAndComponents(
    entity[EQUIPPABLE].compass,
    [TRACKABLE]
  );
  const targetId = compassEntity?.[TRACKABLE].target;
  const targetEntity = world.getEntityByIdAndComponents(targetId, [POSITION]);

  if (!state.args.lastOrientation && (!compassEntity || !targetEntity)) {
    return { updated, finished };
  }

  // create pointer particle
  if (!state.particles.pointer) {
    const pointerParticle = entities.createCollecting(world, {
      [ORIENTABLE]: {},
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        offsetZ: tooltipHeight,
        animatedOrigin: { x: 0, y: 0 },
        duration: 400,
      },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: pointer,
    });
    state.particles.pointer = world.getEntityId(pointerParticle);
    updated = true;
  }

  const pointerParticle = world.assertByIdAndComponents(
    state.particles.pointer,
    [ORIENTABLE, PARTICLE]
  );

  const size = world.metadata.gameEntity[LEVEL].size;
  const shouldDisplay =
    !targetEntity ||
    getDistance(entity[POSITION], targetEntity[POSITION], size) <
      entity[LIGHT].visibility;
  const targetChanged = state.args.target !== targetId;
  if (
    state.args.lastOrientation &&
    (!compassEntity || !targetEntity || targetChanged || shouldDisplay)
  ) {
    pointerParticle[ORIENTABLE].facing = undefined;
    if (targetChanged) {
      disposeEntity(world, pointerParticle);
      delete state.particles.pointer;
      state.args.target = undefined;
    }
    state.args.lastOrientation = undefined;
    updated = true;
  } else if (compassEntity && targetEntity && !shouldDisplay) {
    const orientation = relativeOrientations(
      world,
      entity[POSITION],
      targetEntity[POSITION]
    )[0];
    if (
      !state.args.lastOrientation ||
      state.args.lastOrientation !== orientation
    ) {
      const delta = orientationPoints[orientation];
      if (
        state.args.lastOrientation &&
        pointerParticle[PARTICLE].animatedOrigin
      ) {
        pointerParticle[PARTICLE].animatedOrigin = undefined;
      }
      pointerParticle[PARTICLE].offsetX = delta.x * 8;
      pointerParticle[PARTICLE].offsetY = delta.y * 5;
      pointerParticle[ORIENTABLE].facing = orientation;
      state.args.lastOrientation = orientation;
      state.args.target = targetId;
      updated = true;
    }
  }

  return { finished, updated };
};
