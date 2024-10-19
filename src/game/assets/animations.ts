import {
  decayHeight,
  focusHeight,
  particleHeight,
  tooltipHeight,
} from "../../components/Entity/utils";
import { entities } from "../../engine";
import { ACTIONABLE } from "../../engine/components/actionable";
import {
  Animatable,
  ANIMATABLE,
  Animation,
} from "../../engine/components/animatable";
import { ATTACKABLE } from "../../engine/components/attackable";
import { COLLECTABLE } from "../../engine/components/collectable";
import { COUNTABLE, emptyCountable } from "../../engine/components/countable";
import { DROPPABLE } from "../../engine/components/droppable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FOCUSABLE } from "../../engine/components/focusable";
import { FOG } from "../../engine/components/fog";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { LEVEL } from "../../engine/components/level";
import { LIGHT } from "../../engine/components/light";
import { LOOTABLE } from "../../engine/components/lootable";
import { MELEE } from "../../engine/components/melee";
import { MOVABLE } from "../../engine/components/movable";
import {
  ORIENTABLE,
  orientationPoints,
} from "../../engine/components/orientable";
import { PARTICLE } from "../../engine/components/particle";
import { PLAYER } from "../../engine/components/player";
import { POSITION } from "../../engine/components/position";
import { REFERENCE } from "../../engine/components/reference";
import { RENDERABLE } from "../../engine/components/renderable";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { SPRITE } from "../../engine/components/sprite";
import { SWIMMABLE } from "../../engine/components/swimmable";
import { TOOLTIP } from "../../engine/components/tooltip";
import { TRACKABLE } from "../../engine/components/trackable";
import { VIEWABLE } from "../../engine/components/viewable";
import { isUnlocked } from "../../engine/systems/action";
import { collectItem, isEmpty } from "../../engine/systems/collect";
import { isDead } from "../../engine/systems/damage";
import {
  disposeEntity,
  moveEntity,
  registerEntity,
} from "../../engine/systems/map";
import {
  getEntityGeneration,
  rerenderEntity,
} from "../../engine/systems/renderer";
import { openDoor, removeFromInventory } from "../../engine/systems/trigger";
import * as colors from "../assets/colors";
import { relativeOrientations } from "../math/path";
import {
  add,
  copy,
  distribution,
  getDistance,
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
  hit,
  none,
  player,
  pointer,
  soul,
  woodStick,
} from "./sprites";
import { START_STEP } from "./utils";

export * from "./quests";

export const swordAttack: Animation<"melee"> = (world, entity, state) => {
  // align sword with facing direction
  const finished = state.elapsed > 150;
  const meleeEntity = world.getEntityById(entity[EQUIPPABLE].melee);
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
    disposeEntity(world, world.getEntityById(state.particles.hit));
    delete state.particles.hit;
  }

  return { finished, updated };
};

export const damageCounter: Animation<"counter"> = (world, entity, state) => {
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

  const counterParticle = world.getEntityById(state.particles.counter);
  const char = state.args.amount > 9 ? "#" : state.args.amount.toString();
  if (counterParticle[SPRITE].layers[0].char !== char) {
    counterParticle[SPRITE].layers[0].char = char;
    updated = true;
  }

  return { finished, updated };
};

const haltTime = 200;
const decayTime = 500;

export const creatureDecay: Animation<"decay"> = (world, entity, state) => {
  let updated = false;
  let finished = false;

  // create death particle
  if (
    !state.particles.decay &&
    state.elapsed > haltTime &&
    state.elapsed < decayTime
  ) {
    const deathParticle = entities.createParticle(world, {
      [PARTICLE]: { offsetX: 0, offsetY: 0, offsetZ: decayHeight },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: decay,
    });
    state.particles.decay = world.getEntityId(deathParticle);
    updated = true;
  }

  // delete death particle and make entity lootable
  if (!entity[DROPPABLE].decayed && state.elapsed > decayTime) {
    disposeEntity(world, world.getEntityById(state.particles.decay));
    delete state.particles.decay;

    entity[DROPPABLE].decayed = true;
    finished = true;
  }

  return { finished, updated };
};

export const fireBurn: Animation<"burn"> = (world, entity, state) => {
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
    const fireParticle = world.getEntityById(state.particles.fire);
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

export const doorUnlock: Animation<"unlock"> = (world, entity, state) => {
  let updated = false;
  const finished = state.elapsed > unlockTime;
  const keyEntity = world.getEntityById(state.args.itemId);

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
    disposeEntity(world, world.getEntityById(state.particles.key));
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

// animate light on tombstone before respawning hero
const arriveTime = 2500;
const compassDuration = 500;
const soulSpeed = 1 / 70;
const soulTime = 4500;
const ripTime = 3500;
const circleTime = 2000;

export const heroRevive: Animation<"revive"> = (world, entity, state) => {
  let updated = false;
  const size = world.metadata.gameEntity[LEVEL].size;
  const tombstoneEntity = world.getEntityById(state.args.tombstoneId);
  let heroEntity = world.getIdentifier("hero");
  const compassEntity = world.getIdentifier("compass");
  const compassId = state.args.compassId;
  const delta = {
    x: signedDistance(tombstoneEntity[POSITION].x, state.args.target.x, size),
    y: signedDistance(tombstoneEntity[POSITION].y, state.args.target.y, size),
  };
  const spawnDistance = Math.sqrt(delta.x ** 2 + delta.y ** 2);
  const soulDuration = spawnDistance / soulSpeed;
  const soulCollectTime = soulTime + (compassId ? compassDuration : 0);
  const moveTime = soulCollectTime + soulDuration + arriveTime;
  const finished = state.elapsed > moveTime + circleTime / 2;

  // floor at non-zero value to render full shadow
  const minimum = Math.max(
    0.02,
    Math.min(1.5, (soulTime - state.elapsed) / (circleTime / 4))
  );
  const factor = (circleTime - state.elapsed) / circleTime;
  const newBrightness = Math.max(minimum, state.args.light.brightness * factor);
  const newVisibility = Math.max(minimum, state.args.light.visibility * factor);

  // reduce circular light radius
  if (
    state.elapsed < soulTime &&
    (newBrightness !== entity[LIGHT].brightness ||
      newVisibility !== entity[LIGHT].visibility)
  ) {
    entity[LIGHT].brightness = newBrightness;
    entity[LIGHT].visibility = newVisibility;
    updated = true;
  }

  // show RIP dialog
  if (
    state.elapsed > circleTime &&
    state.elapsed < ripTime &&
    !tombstoneEntity[TOOLTIP].override
  ) {
    tombstoneEntity[TOOLTIP].override = "visible";
    tombstoneEntity[TOOLTIP].changed = true;
    tombstoneEntity[TOOLTIP].dialogs = [createDialog("RIP")];
    rerenderEntity(world, tombstoneEntity);
    updated = true;
  }

  // hide RIP dialog
  if (state.elapsed > ripTime && tombstoneEntity[TOOLTIP].override) {
    tombstoneEntity[TOOLTIP].override = undefined;
    tombstoneEntity[TOOLTIP].changed = true;
    tombstoneEntity[TOOLTIP].dialogs = [];
    rerenderEntity(world, tombstoneEntity);
    updated = true;
  }

  // create soul and collect existing compass
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
      [SPRITE]: soul,
    });
    state.particles.soul = world.getEntityId(soulParticle);

    if (compassId && compassEntity) {
      collectItem(
        world,
        entity,
        world.getEntityById(compassEntity[ITEM].carrier)
      );
    }
    updated = true;
  }

  // update viewpoint if moved
  const ratio = (state.elapsed - soulCollectTime) / soulDuration;
  const flightLocation = {
    x: normalize(
      Math.round(tombstoneEntity[POSITION].x + delta.x * ratio),
      size
    ),
    y: normalize(
      Math.round(tombstoneEntity[POSITION].y + delta.y * ratio),
      size
    ),
  };

  if (
    state.elapsed > soulCollectTime &&
    state.elapsed < soulCollectTime + soulDuration &&
    (flightLocation.x !== entity[POSITION].x ||
      flightLocation.y !== entity[POSITION].y)
  ) {
    moveEntity(world, entity, flightLocation);
    rerenderEntity(world, entity);
    updated = true;
  }

  if (state.elapsed > moveTime && !heroEntity) {
    if (state.particles.soul) {
      disposeEntity(world, world.getEntityById(state.particles.soul));
      delete state.particles.soul;
    }

    // disable light and focus
    entity[VIEWABLE] = { active: false };
    entity[LIGHT].brightness = 0;
    entity[LIGHT].visibility = 0;
    rerenderEntity(world, entity);

    // spawn new hero
    const frameId = world.getEntityId(
      entities.createFrame(world, {
        [REFERENCE]: {
          tick: 250,
          delta: 0,
          suspended: true,
          suspensionCounter: -1,
        },
        [RENDERABLE]: { generation: 0 },
      })
    );

    const pointerAnimation = entities.createFrame(world, {
      [REFERENCE]: {
        tick: -1,
        delta: 0,
        suspended: false,
        suspensionCounter: -1,
      },
      [RENDERABLE]: { generation: 1 },
    });
    heroEntity = entities.createHero(world, {
      [ACTIONABLE]: { triggered: false },
      [ANIMATABLE]: {
        states: {
          pointer: {
            name: "pointerArrow",
            reference: world.getEntityId(pointerAnimation),
            elapsed: 0,
            args: {},
            particles: {},
          },
        },
      },
      [ATTACKABLE]: { enemy: false },
      [COLLECTABLE]: {},
      [COUNTABLE]: { ...emptyCountable, hp: 10, maxHp: 10, maxMp: 5 },
      [DROPPABLE]: { decayed: false },
      [EQUIPPABLE]: {},
      [FOG]: { visibility: "visible", type: "unit" },
      [INVENTORY]: { items: [], size: 20 },
      [LIGHT]: { visibility: 1, brightness: 1, darkness: 0 },
      [MELEE]: {},
      [MOVABLE]: {
        orientations: [],
        reference: frameId,
        spring: {
          mass: 0.1,
          friction: 50,
          tension: 1000,
        },
        lastInteraction: 0,
      },
      [ORIENTABLE]: {},
      [PLAYER]: {},
      [POSITION]: copy(state.args.target),
      [RENDERABLE]: { generation: 0 },
      [SPAWNABLE]: { position: state.args.target },
      [SPRITE]: player,
      [SWIMMABLE]: { swimming: false },
      [VIEWABLE]: state.args.viewable,
    });
    world.setIdentifier(heroEntity, "hero");

    if (compassEntity) {
      const heroId = world.getEntityId(heroEntity);

      if (compassId) {
        // transfer compass to player
        removeFromInventory(world, entity, compassEntity);
        compassEntity[ITEM].carrier = heroId;
        heroEntity[INVENTORY].items.push(compassId);
        heroEntity[EQUIPPABLE].compass = compassId;

        // set waypoint quest to tombstone
        const animationEntity = entities.createFrame(world, {
          [REFERENCE]: {
            tick: -1,
            delta: 0,
            suspended: false,
            suspensionCounter: -1,
          },
          [RENDERABLE]: { generation: 1 },
        });
        (heroEntity[ANIMATABLE] as Animatable).states.quest = {
          name: "tombstoneQuest",
          reference: world.getEntityId(animationEntity),
          elapsed: 0,
          args: { step: START_STEP, memory: {}, giver: state.args.tombstoneId },
          particles: {},
        };
      } else {
        // only update needle
        compassEntity[TRACKABLE].target = heroId;
      }
    }

    registerEntity(world, heroEntity);
    updated = true;
  }

  // increase vision radius of hero
  if (state.elapsed > moveTime && heroEntity) {
    const increase = Math.min(1, (state.elapsed - moveTime) / (circleTime / 2));
    heroEntity[LIGHT].brightness = Math.max(
      1,
      state.args.light.brightness * increase
    );
    heroEntity[LIGHT].visibility = Math.max(
      1,
      state.args.light.visibility * increase
    );
    rerenderEntity(world, heroEntity);
    updated = true;
  }

  if (finished) {
    if (heroEntity) {
      heroEntity[LIGHT].brightness = state.args.light.brightness;
      heroEntity[LIGHT].visibility = state.args.light.visibility;
    }

    disposeEntity(world, entity, false);
  }

  return { finished, updated };
};

// keep entities around to keep swimmable animation for collecting particles
const disposeTime = 200;

export const entityDispose: Animation<"dispose"> = (world, entity, state) => {
  const updated = false;
  const finished = state.elapsed > disposeTime;

  if (finished) {
    disposeEntity(world, entity, false);
  }

  return { finished, updated };
};

export const itemCollect: Animation<"collect"> = (world, entity, state) => {
  let updated = false;
  let finished = false;
  const entityId = world.getEntityId(entity);
  const lootId = state.particles.loot;
  const itemId = state.args.itemId;
  const size = world.metadata.gameEntity[LEVEL].size;
  const itemEntity = world.getEntityId(itemId);
  const lootDelay = 200;

  // add item to player's inventory
  if (state.elapsed >= lootDelay) {
    if (lootId) {
      const lootParticle = world.getEntityId(lootId);
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
          [ANIMATABLE]: { states: {} },
          [ITEM]: { amount: 1, slot: "melee", carrier: entityId },
          [ORIENTABLE]: {},
          [RENDERABLE]: { generation: 0 },
          [SPRITE]: woodStick,
        });
      }

      const targetId = world.getEntityId(targetItem);

      if (targetSlot) {
        const existingId = entity[EQUIPPABLE][targetSlot];

        // add existing render count if item is replaced
        if (existingId) {
          const existingItem = world.getEntityById(existingId);
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
      [ORIENTABLE]: itemEntity[ORIENTABLE],
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

const lineSprites = createText("─┐│┘─└│┌", colors.olive);

export const focusCircle: Animation<"focus"> = (world, entity, state) => {
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
        world.getEntityById(state.particles[`line-${lineIndex}`])[SPRITE].layers
          .length > 0
    ) || "-1"
  );
  const focusIndex = world.metadata.gameEntity[RENDERABLE].generation % 4;
  const currentActive = currentIndex !== -1;
  const isActive = !!entity[FOCUSABLE].target;

  // disable all on inactive
  if (currentActive && !isActive) {
    for (let i = 0; i < 8; i += 1) {
      const particle = world.getEntityById(state.particles[`line-${i}`]);
      particle[SPRITE] = none;
    }

    updated = true;
  } else if (isActive && currentIndex !== focusIndex) {
    // rotate focus by toggling visibility of 8 individual particles
    for (let i = 0; i < 8; i += 1) {
      const particle = world.getEntityById(state.particles[`line-${i}`]);
      const particleIndex = i % 4;
      particle[SPRITE] = particleIndex === focusIndex ? lineSprites[i] : none;
    }

    updated = true;
  }

  return { finished, updated };
};

const charDelay = 33;
const tooltipDelay = 500;

export const dialogText: Animation<"dialog"> = (world, entity, state) => {
  const heroEntity = world.getIdentifier("hero");

  let updated = false;

  // display if located in any adjacent cell
  const size = world.metadata.gameEntity[LEVEL].size;
  const delta = heroEntity && {
    x: signedDistance(heroEntity[POSITION].x, entity[POSITION].x, size),
    y: signedDistance(heroEntity[POSITION].y, entity[POSITION].y, size),
  };
  const isAdjacent =
    !!delta && Math.abs(delta.x) <= 1 && Math.abs(delta.y) <= 1;
  const changed = entity[TOOLTIP].changed;
  const pending =
    state.args.after &&
    world.getEntityById(state.args.after)?.[ANIMATABLE].states.dialog &&
    !world.getEntityById(state.args.after)?.[ANIMATABLE].states.dialog?.args
      .isIdle;
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
    const particleEntity = world.getEntityById(state.particles[particleName]);
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
    state.args.after = pending && state.args.after;
  }

  const charCount = Math.max(
    Math.floor((state.elapsed - state.args.timestamp) / charDelay),
    0
  );
  const targetLength =
    active && !pending
      ? Math.min(state.args.lengthOffset + charCount, totalLength)
      : Math.max(Math.min(totalLength, state.args.lengthOffset) - charCount, 0);

  const finished = false;
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

      const charParticle = world.getEntityById(state.particles[particleName]);
      charParticle[PARTICLE].offsetX = charPosition.x;
      charParticle[PARTICLE].offsetY = charPosition.y;
      charParticle[SPRITE] = charSprite;
    }
  }

  // remove particles if player is not in adjacent position anymore and text is fully hidden
  if (!active && currentLength === 0) {
    for (let i = 0; i < totalLength; i += 1) {
      const particleName = `char-${i}`;
      disposeEntity(world, world.getEntityById(state.particles[particleName]));
      delete state.particles[particleName];
    }

    entity[TOOLTIP].changed = undefined;

    return { finished: true, updated };
  }

  return { finished, updated };
};

export const pointerArrow: Animation<"pointer"> = (world, entity, state) => {
  let updated = false;
  let finished = false;

  const compassEntity = world.getEntityById(entity[EQUIPPABLE].compass);
  const targetId = compassEntity?.[TRACKABLE].target;
  const targetEntity = world.getEntityById(targetId);

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

  const pointerParticle = world.getEntityById(state.particles.pointer);

  const size = world.metadata.gameEntity[LEVEL].size;
  const inRange =
    getDistance(entity[POSITION], targetEntity[POSITION], size) <
    entity[LIGHT].visibility;
  const targetChanged = state.args.target !== targetId;
  if (
    state.args.lastOrientation &&
    (!compassEntity || !targetEntity || targetChanged || inRange)
  ) {
    pointerParticle[ORIENTABLE].facing = undefined;
    if (targetChanged) {
      disposeEntity(world, pointerParticle);
      delete state.particles.pointer;
      state.args.target = undefined;
    }
    state.args.lastOrientation = undefined;
    updated = true;
  } else if (compassEntity && targetEntity && !inRange) {
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
