import { entities } from "../../engine";
import { ANIMATABLE, Animation } from "../../engine/components/animatable";
import { COUNTABLE } from "../../engine/components/countable";
import { DROPPABLE } from "../../engine/components/droppable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FOCUSABLE } from "../../engine/components/focusable";
import { FOG } from "../../engine/components/fog";
import { IDENTIFIABLE } from "../../engine/components/identifiable";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { LEVEL } from "../../engine/components/level";
import { LIGHT } from "../../engine/components/light";
import { LOCKABLE } from "../../engine/components/lockable";
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
import { SPRITE } from "../../engine/components/sprite";
import { VIEWABLE } from "../../engine/components/viewable";
import { isEmpty } from "../../engine/systems/collect";
import { isDead } from "../../engine/systems/damage";
import { disposeEntity, getCell } from "../../engine/systems/map";
import {
  getEntityGeneration,
  rerenderEntity,
} from "../../engine/systems/renderer";
import * as colors from "../assets/colors";
import { add, normalize, signedDistance } from "../math/std";
import { iterations } from "../math/tracing";
import { menuArea } from "./areas";
import { createCounter, createText, decay, fog, hit, none } from "./sprites";

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
      [PARTICLE]: { offsetX: delta.x, offsetY: delta.y },
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
      [PARTICLE]: { offsetX: delta.x, offsetY: delta.y },
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
      [PARTICLE]: { offsetX: 0, offsetY: 0 },
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

const lootTime = 200;

export const itemCollect: Animation<"collect"> = (world, entity, state) => {
  let updated = false;
  let finished = false;
  const lootId = state.particles.loot;
  const lootParticle = lootId && world.getEntityId(lootId);
  const itemId = state.args.itemId;
  const itemEntity = world.getEntityId(itemId);

  // add item to player's inventory
  if (lootParticle && state.elapsed >= lootTime) {
    disposeEntity(world, world.getEntityById(state.particles.loot));
    delete state.particles.loot;

    const targetSlot = itemEntity[ITEM].slot;
    const targetCounter = itemEntity[ITEM].counter;

    if (targetSlot) {
      const existingId = entity[EQUIPPABLE][targetSlot];

      // add existing render count if item is replaced
      if (existingId) {
        const existingItem = world.getEntityById(existingId);
        itemEntity[RENDERABLE].generation += getEntityGeneration(
          world,
          existingItem
        );

        // TODO: handle dropping existing item instead
        disposeEntity(world, existingItem);
      }

      entity[EQUIPPABLE][targetSlot] = itemId;
      entity[INVENTORY].items.push(itemId);
    } else if (targetCounter) {
      entity[COUNTABLE][targetCounter] += 1;
    }

    finished = true;
  }

  // create loot particle
  if (!lootId && state.elapsed < lootTime) {
    const delta = orientationPoints[state.args.facing];
    const lootParticle = entities.createCollecting(world, {
      [ORIENTABLE]: itemEntity[ORIENTABLE],
      [PARTICLE]: {
        offsetX: 0,
        offsetY: 0,
        animatedOrigin: delta,
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
          animatedOrigin: { x: entity[POSITION].x, y: entity[POSITION].y },
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: none,
      });
      const cornerParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: iteration.direction.x + iteration.normal.x,
          offsetY: iteration.direction.y + iteration.normal.y,
          animatedOrigin: { x: entity[POSITION].x, y: entity[POSITION].y },
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
  const focusIndex =
    Math.floor(
      (state.elapsed - state.args.offset) /
        world.metadata.gameEntity[REFERENCE].tick
    ) % 4;
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
  const hero = world.getEntity([PLAYER]);

  // display if located in any adjacent cell
  const size = world.metadata.gameEntity[LEVEL].size;
  const delta = hero
    ? {
        x: signedDistance(hero[POSITION].x, entity[POSITION].x, size),
        y: signedDistance(hero[POSITION].y, entity[POSITION].y, size),
      }
    : { x: 0, y: 0 };
  const pending =
    state.args.after &&
    world.getEntityById(state.args.after)?.[ANIMATABLE].states.dialog;
  const active =
    !isDead(world, entity) &&
    !isEmpty(world, entity) &&
    Math.abs(delta.x) <= 1 &&
    Math.abs(delta.y) <= 1;
  const totalLength = state.args.text.length;
  const particlesLength = Object.keys(state.particles).length;

  // create char particles
  if (particlesLength === 0) {
    for (let i = 0; i < totalLength; i += 1) {
      const origin = add(orientationPoints[state.args.orientation], {
        x: -Math.floor(totalLength / 2),
        y: 0,
      });
      const charPosition = add(origin, { x: i, y: 0 });
      const particleName = `char-${i}`;

      const charParticle = entities.createParticle(world, {
        [PARTICLE]: {
          offsetX: charPosition.x,
          offsetY: charPosition.y,
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
    state.args.timestamp =
      !active && entity[MOVABLE] && !isDead(world, entity)
        ? state.elapsed + tooltipDelay
        : state.elapsed;
    state.args.active = active;
    state.args.lengthOffset = currentLength;
    state.args.after = pending && state.args.after;
  }

  const charCount = Math.floor(
    (state.elapsed - state.args.timestamp) / charDelay
  );
  const targetLength =
    active && !pending
      ? Math.min(state.args.lengthOffset + charCount, totalLength)
      : Math.max(Math.min(totalLength, state.args.lengthOffset) - charCount, 0);

  const orientation =
    delta.y === 0 ? state.args.orientation : delta.y < 0 ? "up" : "down";
  const finished = false;
  const updated =
    currentLength !== targetLength || orientation !== state.args.orientation;

  if (updated) {
    state.args.orientation = orientation;

    const origin = add(orientationPoints[state.args.orientation], {
      x: -Math.floor(totalLength / 2),
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
    return { finished: true, updated };
  }

  return { finished, updated };
};

export const mainQuest: Animation<"quest"> = (world, entity, state) => {
  let finished = false;
  let updated = false;
  const playerEntity = world.getEntity([PLAYER]);
  const focusEntity = world.getEntity([FOCUSABLE]);

  if (!focusEntity || !playerEntity) {
    return { finished, updated };
  }

  if (state.args.step === "move") {
    if (playerEntity[POSITION].x !== 0 || playerEntity[POSITION].y !== 0) {
      const compassEntity = world
        .getEntities([IDENTIFIABLE])
        .find((entity) => entity[IDENTIFIABLE].name === "compass");
      focusEntity[FOCUSABLE].pendingTarget = world.getEntityId(compassEntity);
      state.args.step = "compass";
      updated = true;
    }
  } else if (state.args.step === "compass") {
    if (playerEntity[EQUIPPABLE].compass) {
      const swordEntity = world
        .getEntities([IDENTIFIABLE])
        .find((entity) => entity[IDENTIFIABLE].name === "sword");
      focusEntity[FOCUSABLE].pendingTarget = world.getEntityId(swordEntity);
      state.args.step = "sword";
      updated = true;
    }
  } else if (state.args.step === "sword") {
    if (playerEntity[EQUIPPABLE].melee) {
      const keyEntity = world
        .getEntities([IDENTIFIABLE])
        .find((entity) => entity[IDENTIFIABLE].name === "key");
      focusEntity[FOCUSABLE].pendingTarget = world.getEntityId(keyEntity);
      state.args.step = "key";
      updated = true;
    }
  } else if (state.args.step === "key") {
    if (playerEntity[EQUIPPABLE].key) {
      const doorEntity = world
        .getEntities([IDENTIFIABLE])
        .find((entity) => entity[IDENTIFIABLE].name === "door");
      focusEntity[FOCUSABLE].pendingTarget = world.getEntityId(doorEntity);
      state.args.step = "door";
      updated = true;
    }
  } else if (state.args.step === "door") {
    if (!playerEntity[EQUIPPABLE].key) {
      focusEntity[FOCUSABLE].pendingTarget = undefined;
      state.args.step = "world";
      updated = true;
    }
  }

  if (playerEntity[POSITION].x === 0 && playerEntity[POSITION].y === 7) {
    state.args.step = "done";
    finished = true;
    updated = true;
    focusEntity[FOCUSABLE].pendingTarget = undefined;

    // set camera to player
    playerEntity[VIEWABLE].active = true;

    // close door
    const doorEntity = world
      .getEntities([IDENTIFIABLE])
      .find((entity) => entity[IDENTIFIABLE].name === "door");
    if (doorEntity) {
      doorEntity[LOCKABLE].locked = true;
      doorEntity[ORIENTABLE].facing = undefined;
      rerenderEntity(world, doorEntity);
    }

    // set player light
    playerEntity[LIGHT].brightness = 5.55;
    playerEntity[LIGHT].visibility = 5.55;

    // clear spawn area
    const menuRows = menuArea.split("\n");
    const menuColumns = menuRows[0].split("");
    const size = world.metadata.gameEntity[LEVEL].size;
    for (
      let columnIndex = 0;
      columnIndex <= menuColumns.length;
      columnIndex += 1
    ) {
      for (let rowIndex = 0; rowIndex <= menuRows.length; rowIndex += 1) {
        const x = normalize(columnIndex - (menuColumns.length - 1) / 2, size);
        const y = normalize(rowIndex - (menuRows.length - 1) / 2, size);
        const cell = getCell(world, { x, y });
        let hasAir = false;
        Object.values(cell).forEach((cellEntity) => {
          if (
            cellEntity === playerEntity ||
            cellEntity === focusEntity ||
            cellEntity === entity
          )
            return;

          if (!(FOG in cellEntity)) {
            disposeEntity(world, cellEntity);
            return;
          }

          if (!hasAir && cellEntity[FOG].type === "air") hasAir = true;

          cellEntity[FOG].visibility = "hidden";
          rerenderEntity(world, cellEntity);
        });

        // restore removed air particles
        if ((y < 7 || y > size / 2) && !hasAir) {
          entities.createTerrain(world, {
            [FOG]: { visibility: "hidden", type: "air" },
            [POSITION]: { x, y },
            [RENDERABLE]: { generation: 0 },
            [SPRITE]: fog,
          });
        }
      }
    }
  }

  return { finished, updated };
};
