import { isTouch } from "../../components/Dimensions";
import {
  barHeight,
  focusHeight,
  particleHeight,
  tooltipHeight,
} from "../../components/Entity/utils";
import { entities } from "../../engine";
import { ANIMATABLE, Animation } from "../../engine/components/animatable";
import { BEHAVIOUR } from "../../engine/components/behaviour";
import { COUNTABLE } from "../../engine/components/countable";
import { DROPPABLE } from "../../engine/components/droppable";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FOCUSABLE } from "../../engine/components/focusable";
import { FOG } from "../../engine/components/fog";
import { Inventory, INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { LEVEL } from "../../engine/components/level";
import { LIGHT } from "../../engine/components/light";
import { MELEE } from "../../engine/components/melee";
import { MOVABLE } from "../../engine/components/movable";
import {
  ORIENTABLE,
  orientationPoints,
} from "../../engine/components/orientable";
import { PARTICLE } from "../../engine/components/particle";
import { POSITION } from "../../engine/components/position";
import { REFERENCE } from "../../engine/components/reference";
import { RENDERABLE } from "../../engine/components/renderable";
import { SPRITE } from "../../engine/components/sprite";
import { TOOLTIP } from "../../engine/components/tooltip";
import { VIEWABLE } from "../../engine/components/viewable";
import {
  hasAvailableQuest,
  isTradable,
  isUnlocked,
} from "../../engine/systems/action";
import { isEmpty } from "../../engine/systems/collect";
import { isDead } from "../../engine/systems/damage";
import { disposeEntity, getCell } from "../../engine/systems/map";
import {
  getEntityGeneration,
  rerenderEntity,
} from "../../engine/systems/renderer";
import { lockDoor } from "../../engine/systems/trigger";
import * as colors from "../assets/colors";
import { add, distribution, normalize, signedDistance } from "../math/std";
import { iterations } from "../math/tracing";
import { initialPosition, menuArea } from "./areas";
import {
  createCounter,
  createDialog,
  createStat,
  createText,
  decay,
  fire,
  fog,
  goldKey,
  hit,
  none,
  woodStick,
} from "./sprites";

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
        offsetZ: barHeight,
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
      [PARTICLE]: { offsetX: 0, offsetY: 0, offsetZ: particleHeight },
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

  // delete death particle and make entity lootable
  // if (!entity[DROPPABLE].decayed && state.elapsed > decayTime) {
  //   disposeEntity(world, world.getEntityById(state.particles.decay));
  //   delete state.particles.decay;

  //   entity[DROPPABLE].decayed = true;
  //   finished = true;
  // }

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
  const lootId = state.particles.loot;
  const lootParticle = lootId && world.getEntityId(lootId);
  const itemId = state.args.itemId;
  const size = world.metadata.gameEntity[LEVEL].size;
  const itemEntity = world.getEntityId(itemId);
  const lootDelay =
    world.getEntityById(entity[MOVABLE].reference)[REFERENCE].tick - 50;

  // add item to player's inventory
  if (lootParticle && state.elapsed >= lootDelay) {
    if (state.particles.loot) {
      disposeEntity(world, world.getEntityById(state.particles.loot));
      delete state.particles.loot;
    }

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
        [ITEM]: { amount: 1, slot: "melee" },
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
        disposeEntity(world, existingItem);
      }

      entity[EQUIPPABLE][targetSlot] = targetId;
      entity[INVENTORY].items.push(targetId);
    } else if (targetConsume) {
      entity[INVENTORY].items.push(targetId);
    } else if (targetCounter) {
      entity[COUNTABLE][targetCounter] += 1;
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
  const delta = heroEntity
    ? {
        x: signedDistance(heroEntity[POSITION].x, entity[POSITION].x, size),
        y: signedDistance(heroEntity[POSITION].y, entity[POSITION].y, size),
      }
    : { x: 0, y: 0 };
  const isAdjacent = Math.abs(delta.x) <= 1 && Math.abs(delta.y) <= 1;
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
        !entity[TOOLTIP].override &&
        !isDead(world, entity) &&
        !isEmpty(world, entity) &&
        !isUnlocked(world, entity)));
  const totalLength = state.args.text.length;
  const orientation =
    (!state.args.isIdle &&
      active &&
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
      !active && entity[TOOLTIP].persistent && !isDead(world, entity);
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

export const spawnQuest: Animation<"quest"> = (world, entity, state) => {
  let finished = false;
  let updated = false;
  const heroEntity = world.getIdentifier("hero");
  const focusEntity = world.getIdentifier("focus");
  const viewpointEntity = world.getIdentifier("viewpoint");

  if (!heroEntity || !viewpointEntity || !focusEntity) {
    return { finished, updated };
  }

  if (state.args.step === "initial") {
    entity[BEHAVIOUR].patterns.push({
      name: "dialog",
      memory: {
        override: "visible",
        dialogs: [
          createDialog(
            isTouch ? "Swipe to move" : "\u011a \u0117 \u0118 \u0119 to move"
          ),
        ],
      },
    });
    state.args.step = "move";
    updated = true;
  } else if (state.args.step === "move") {
    if (
      heroEntity[POSITION].x !== initialPosition.x ||
      heroEntity[POSITION].y !== initialPosition.y
    ) {
      world.addQuest(entity, { name: "guideQuest" });
      entity[BEHAVIOUR].patterns.push({
        name: "dialog",
        memory: {
          override: undefined,
          changed: true,
          dialogs: [
            createDialog("Hi stranger."),
            createDialog("How are you?"),
            createDialog("A new quest!"),
            createDialog("Let's do it."),
          ],
        },
      });
      state.args.step = "chest";
      updated = true;
    }
  } else if (state.args.step === "chest") {
    if (!hasAvailableQuest(world, entity)) {
      const chestEntity = world.getIdentifier("compass_chest");
      entity[BEHAVIOUR].patterns.push(
        {
          name: "dialog",
          memory: {
            override: "visible",
            changed: true,
            dialogs: [createDialog("Grab this!")],
          },
        },
        {
          name: "kill",
          memory: {
            target: world.getEntityId(chestEntity),
          },
        },
        {
          name: "dialog",
          memory: {
            override: undefined,
          },
        },
        {
          name: "move",
          memory: {
            position: { x: entity[POSITION].x, y: entity[POSITION].y },
          },
        }
      );
      state.args.step = "sword";
      updated = true;
    }
  } else if (state.args.step === "sword") {
    if (heroEntity[EQUIPPABLE].melee && heroEntity[EQUIPPABLE].compass) {
      entity[BEHAVIOUR].patterns.push({
        name: "dialog",
        memory: {
          changed: true,
          dialogs: [[...createDialog("Collect "), ...createStat(5, "gold")]],
        },
      });
      state.args.step = "collect";
      updated = true;
    }
  } else if (state.args.step === "collect") {
    const doorEntity = world.getIdentifier("house_door");
    const keyEntity = world.getIdentifier("key");
    if (doorEntity && keyEntity && heroEntity[COUNTABLE].gold >= 5) {
      entity[BEHAVIOUR].patterns.push(
        {
          name: "dialog",
          memory: {
            override: "visible",
            changed: true,
            dialogs: [[...createDialog("Use this "), goldKey]],
          },
        },
        {
          name: "unlock",
          memory: {
            target: world.getEntityId(doorEntity),
          },
        },
        {
          name: "dialog",
          memory: {
            override: undefined,
            changed: true,
            dialogs: [],
          },
        },
        {
          name: "collect",
          memory: {
            item: world.getEntityId(keyEntity),
          },
        },
        {
          name: "move",
          memory: {
            position: add(doorEntity[POSITION], { x: 0, y: 1 }),
          },
        },
        {
          name: "lock",
          memory: {
            target: world.getEntityId(doorEntity),
          },
        },
        {
          name: "sell",
          memory: {
            position: { x: 155, y: 159 },
            item: world.getEntityId(keyEntity),
            activation: [{ counter: "gold", amount: 5 }],
          },
        },
        {
          name: "move",
          memory: {
            position: { x: 0, y: 159 },
          },
        },
        {
          name: "dialog",
          memory: {
            changed: true,
            dialogs: [createDialog("Ready?")],
          },
        }
      );
      state.args.step = "door";
      updated = true;
    }
  } else if (state.args.step === "door") {
    const doorEntity = world.getIdentifier("door");
    if (doorEntity && isUnlocked(world, doorEntity)) {
      entity[BEHAVIOUR].patterns.push({
        name: "dialog",
        memory: {
          override: "visible",
          changed: true,
          dialogs: [createDialog("Good luck!")],
        },
      });
      state.args.step = "world";
      updated = true;
    }
  } else if (state.args.step === "world") {
    const doorEntity = world.getIdentifier("door");
    if (
      doorEntity &&
      heroEntity[POSITION].x === 0 &&
      heroEntity[POSITION].y === 7
    ) {
      // set camera to player
      viewpointEntity[VIEWABLE].active = false;
      heroEntity[VIEWABLE].active = true;

      // close door
      lockDoor(world, doorEntity);

      // set player light
      heroEntity[LIGHT].brightness = 5.55;
      heroEntity[LIGHT].visibility = 5.55;

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
            // don't remove player and focus
            if (cellEntity === heroEntity || cellEntity === focusEntity) return;

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
            entities.createGround(world, {
              [FOG]: { visibility: "hidden", type: "air" },
              [POSITION]: { x, y },
              [RENDERABLE]: { generation: 0 },
              [SPRITE]: fog,
            });
          }
        }
      }

      state.args.step = "done";
      finished = true;
    }
  }

  return { finished, updated };
};

export const guideQuest: Animation<"quest"> = (world, entity, state) => {
  let finished = false;
  let updated = false;
  const guideEntity = world.getIdentifier("guide");

  if (!guideEntity) {
    return { finished, updated };
  }

  if (state.args.step === "initial") {
    if (entity[EQUIPPABLE].compass) {
      world.setFocus(world.getIdentifier("wood_two"));
      state.args.step = "sword";
      updated = true;
    }
  } else if (state.args.step === "sword") {
    if (entity[EQUIPPABLE].melee) {
      world.setFocus(world.getIdentifier("pot"));
      state.args.step = "pot";
      updated = true;
    }
  } else if (state.args.step === "pot") {
    const potEntity = world.getIdentifier("pot");
    if (!potEntity) {
      world.setFocus(world.getIdentifier("triangle"));
      state.args.step = "triangle";
      updated = true;
    }
  } else if (state.args.step === "triangle") {
    const triangleEntity = world.getIdentifier("triangle");
    if (!triangleEntity) {
      world.setFocus(world.getIdentifier("gold"));
      state.args.step = "gold";
      updated = true;
    }
  } else if (state.args.step === "gold") {
    const goldEntity = world.getIdentifier("gold");
    if (goldEntity && goldEntity[INVENTORY].items.length === 0) {
      world.setFocus(guideEntity);
      state.args.step = "collect";
      updated = true;
    }
  } else if (state.args.step === "collect") {
    if (entity[COUNTABLE].gold >= 5) {
      world.setFocus();
      state.args.step = "buy";
      updated = true;
    }
  } else if (state.args.step === "buy") {
    const keyEntity = world.getIdentifier("key");
    const containerEntity =
      keyEntity && world.getEntityById(keyEntity[ITEM].carrier);
    if (containerEntity && isTradable(world, containerEntity)) {
      state.args.step = "key";
      updated = true;
    }
  } else if (state.args.step === "key") {
    const doorEntity = world.getIdentifier("door");
    if (
      (entity[INVENTORY] as Inventory).items.some(
        (itemId) => world.getEntityById(itemId)[ITEM].consume === "key"
      )
    ) {
      world.setFocus(doorEntity);
      state.args.step = "door";
      updated = true;
    }
  } else if (state.args.step === "door") {
    const doorEntity = world.getIdentifier("door");
    const focusEntity = world.getIdentifier("focus");
    if (doorEntity && focusEntity && isUnlocked(world, doorEntity)) {
      world.setFocus();
      state.args.step = "done";
      finished = true;
    }
  }

  return { finished, updated };
};

export const townQuest: Animation<"quest"> = (world, entity, state) => {
  let finished = false;
  let updated = false;
  const signEntity = world.getIdentifier("sign");

  if (!signEntity) {
    return { finished, updated };
  }

  if (state.args.step === "initial") {
    signEntity[TOOLTIP].changed = true;
    signEntity[TOOLTIP].dialogs = [createDialog("Use compass")];

    const viewpointEntity = entities.createViewpoint(world, {
      [POSITION]: { x: 60, y: 60 },
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: none,
      [VIEWABLE]: { active: false },
    });
    world.setFocus(viewpointEntity);

    state.args.step = "done";
    finished = true;
  }

  return { finished, updated };
};
