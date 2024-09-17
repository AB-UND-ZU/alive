import { entities } from "../../engine";
import { Animation } from "../../engine/components/animatable";
import { COUNTABLE } from "../../engine/components/countable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FOCUSABLE } from "../../engine/components/focusable";
import { FOG } from "../../engine/components/fog";
import { IDENTIFIABLE } from "../../engine/components/identifiable";
import { INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { LEVEL } from "../../engine/components/level";
import { LIGHT } from "../../engine/components/light";
import { LOCKABLE } from "../../engine/components/lockable";
import { LOOTABLE } from "../../engine/components/lootable";
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
import { disposeEntity, getCell } from "../../engine/systems/map";
import {
  getEntityGeneration,
  rerenderEntity,
} from "../../engine/systems/renderer";
import * as colors from "../assets/colors";
import { normalize, signedDistance } from "../math/std";
import { iterations } from "../math/tracing";
import { menuArea } from "./areas";
import { createCounter, createText, decay, fog, hit, none } from "./sprites";

export const swordAttack: Animation<"melee"> = (world, entity, state) => {
  // align sword with facing direction
  const finished = state.elapsed > 150;
  const currentFacing = entity[ORIENTABLE].facing;
  const facing = finished ? undefined : state.args.facing;
  const updated = currentFacing !== facing;

  if (!state.particles.hit) {
    const delta = orientationPoints[state.args.facing];
    const hitParticle = entities.createHit(world, {
      [PARTICLE]: { offsetX: delta.x, offsetY: delta.y },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: hit,
    });
    state.particles.hit = world.getEntityId(hitParticle);
  }

  if (updated) {
    entity[ORIENTABLE].facing = facing;
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
    const counterParticle = entities.createCounter(world, {
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
    const deathParticle = entities.createDecay(world, {
      [PARTICLE]: { offsetX: 0, offsetY: 0 },
      [RENDERABLE]: { generation: 1 },
      [SPRITE]: decay,
    });
    state.particles.decay = world.getEntityId(deathParticle);
    updated = true;
  }

  // delete death particle, drop items and make entity lootable
  if (!entity[LOOTABLE].accessible && state.elapsed > decayTime) {
    disposeEntity(world, world.getEntityById(state.particles.decay));
    delete state.particles.decay;

    entity[LOOTABLE].accessible = true;
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
        disposeEntity(world, existingId);
      }

      entity[EQUIPPABLE][targetSlot] = itemId;
      entity[INVENTORY].items.push(itemId);
    } else if (targetCounter) {
      entity[COUNTABLE][targetCounter] += 1;
    }

    finished = true;
  }

  // move loot particle to collecting entity
  if (
    lootParticle &&
    (lootParticle[PARTICLE].offsetX !== 0 ||
      lootParticle[PARTICLE].offsetY !== 0)
  ) {
    lootParticle[PARTICLE].offsetX = 0;
    lootParticle[PARTICLE].offsetY = 0;
    updated = true;
  }

  // create loot particle
  if (!lootId && state.elapsed < lootTime) {
    const delta = orientationPoints[state.args.facing];
    const lootParticle = entities.createCollecting(world, {
      [ORIENTABLE]: itemEntity[ORIENTABLE],
      [PARTICLE]: { offsetX: delta.x, offsetY: delta.y },
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
      const sideParticle = entities.createCounter(world, {
        [PARTICLE]: {
          offsetX: iteration.direction.x,
          offsetY: iteration.direction.y,
        },
        [RENDERABLE]: { generation: 1 },
        [SPRITE]: none,
      });
      const cornerParticle = entities.createCounter(world, {
        [PARTICLE]: {
          offsetX: iteration.direction.x + iteration.normal.x,
          offsetY: iteration.direction.y + iteration.normal.y,
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
        if (signedDistance(y, 0, size) < 7 && !hasAir) {
          entities.createAir(world, {
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
