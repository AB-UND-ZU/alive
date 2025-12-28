import { entities } from "../../engine";
import { BEHAVIOUR } from "../../engine/components/behaviour";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FOG } from "../../engine/components/fog";
import { ITEM } from "../../engine/components/item";
import { LEVEL } from "../../engine/components/level";
import { LIGHT } from "../../engine/components/light";
import { Position, POSITION } from "../../engine/components/position";
import { RENDERABLE } from "../../engine/components/renderable";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { SPRITE } from "../../engine/components/sprite";
import { TOOLTIP } from "../../engine/components/tooltip";
import { VIEWABLE } from "../../engine/components/viewable";
import { getLockable, isUnlocked } from "../../engine/systems/action";
import { collectItem } from "../../engine/systems/collect";
import {
  disposeEntity,
  getCell,
  moveEntity,
  registerEntity,
} from "../../engine/systems/map";
import { rerenderEntity } from "../../engine/systems/renderer";
import { lockDoor, removeFromInventory } from "../../engine/systems/trigger";
import {
  add,
  choice,
  copy,
  getDistance,
  normalize,
  repeat,
  signedDistance,
  within,
} from "../math/std";
import { bossArea, spawnArea } from "../levels/island/areas";
import {
  commonChest,
  createDialog,
  createShout,
  menuDot,
  fog,
  shade,
  menuArrow,
  dots,
  popupSelection,
  popupBlocked,
  none,
  leverOn,
  leverOff,
  barrierCorner,
  barrierSide,
  createText,
  craft,
  swirl,
  underline,
  forge,
  kettle,
  getOrientedSprite,
  questPointer,
} from "./sprites";
import {
  createItemName,
  createItemText,
  END_STEP,
  frameWidth,
  getUnitSprite,
  npcSequence,
  questSequence,
  QuestStage,
  queueMessage,
  START_STEP,
  step,
} from "./utils";
import {
  NpcSequence,
  SEQUENCABLE,
  Sequence,
} from "../../engine/components/sequencable";
import { STATS } from "../../engine/components/stats";
import { CASTABLE } from "../../engine/components/castable";
import { defaultLight, spawnLight } from "../../engine/systems/consume";
import {
  assertIdentifierAndComponents,
  getIdentifier,
  getIdentifierAndComponents,
  setIdentifier,
  setNeedle,
} from "../../engine/utils";
import { INVENTORY } from "../../engine/components/inventory";
import { PLAYER } from "../../engine/components/player";
import { BELONGABLE } from "../../engine/components/belongable";
import { createPopup, removePopup } from "../../engine/systems/popup";
import { isDead, isEnemy } from "../../engine/systems/damage";
import { createCell, insertArea } from "../../bindings/creation";
import { SOUL } from "../../engine/components/soul";
import { matrixFactory } from "../math/matrix";
import { getSequence } from "../../engine/systems/sequence";
import { IDENTIFIABLE } from "../../engine/components/identifiable";
import { roomSize, tutorialRooms } from "../levels/tutorial/areas";
import { isGhost, isRespawning } from "../../engine/systems/fate";
import { MOVABLE } from "../../engine/components/movable";
import { TypedEntity } from "../../engine/entities";
import { COLLIDABLE } from "../../engine/components/collidable";
import { recolorSprite } from "./pixels";
import { colors } from "./colors";
import {
  ORIENTABLE,
  orientationPoints,
} from "../../engine/components/orientable";
import { CLICKABLE } from "../../engine/components/clickable";
import { iterations, pixelCircle } from "../math/tracing";
import { getClickables } from "../../engine/systems/click";
import { muteAudio, unmuteAudio } from "../sound/resumable";
import { REFERENCE } from "../../engine/components/reference";
import { POPUP } from "../../engine/components/popup";
import { craftingRecipes } from "../balancing/crafting";
import { isTouch } from "../../components/Dimensions";
import { getItemBuyPrice, purchasableItems } from "../balancing/trading";
import { COVERABLE } from "../../engine/components/coverable";

const menuOffset = { x: -8, y: 1 };
const menuSize = { x: 17, y: 3 };
const menuPadding = 4;
const menuArrows = [10, 13];
const menuItems: { name: string; disabled?: boolean }[] = [
  { name: "tutorial" },
  { name: "new-game" },
  { name: "continue", disabled: true },
  { name: "sound-fx" },
  { name: "controls" },
];

const circleTime = 100;
const circleRange = 19;
const circleColors = [
  colors.maroon,
  colors.grey,
  colors.navy,
  colors.olive,
  colors.purple,
  colors.green,
  colors.black,
];

const deselectItem = (stage: QuestStage<NpcSequence>) => {
  if (!stage.state.args.memory.grounds?.length) {
    stage.state.args.memory.grounds = [];
    return;
  }

  for (
    let groundIndex = 0;
    groundIndex < stage.state.args.memory.grounds.length;
    groundIndex += 1
  ) {
    const groundEntity = stage.state.args.memory.grounds[groundIndex];
    disposeEntity(stage.world, groundEntity);

    const dotEntity = Object.values(
      getCell(stage.world, groundEntity[POSITION])
    ).find((entity) => entity[COLLIDABLE]);

    if (dotEntity) {
      dotEntity[SPRITE] = menuArrows.includes(groundIndex)
        ? menuDot
        : recolorSprite(dotEntity[SPRITE], colors.grey);
      rerenderEntity(stage.world, dotEntity);
    }
  }

  const discoveryState = Object.values(
    getCell(
      stage.world,
      add(stage.state.args.memory.grounds.slice(-1)[0][POSITION], {
        x: 1,
        y: 0,
      })
    )
  )
    .map((entity) => getSequence(stage.world, entity, "discovery"))
    .find(Boolean);

  if (discoveryState) {
    discoveryState.args.force = false;
  }
  stage.state.args.memory.grounds = [];
};

type ContactCircle = {
  generation: number;
  rendered: number;
  position: Position;
  color: string;
};

export const menuNpc: Sequence<NpcSequence> = (world, entity, state) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const size = world.metadata.gameEntity[LEVEL].size;
  const heroEntity = getIdentifierAndComponents(world, "hero", [
    MOVABLE,
    POSITION,
  ]);
  const heroPosition =
    heroEntity && !isDead(world, heroEntity)
      ? heroEntity[POSITION]
      : { x: 0, y: 0 };

  if (!state.args.memory.circles) {
    // initialize circles
    state.args.memory.circles = [];

    // create moving arrow
    const frameEntity = entities.createFrame(world, {
      [REFERENCE]: {
        tick: -1,
        delta: 0,
        suspended: true,
        suspensionCounter: -1,
      },
      [RENDERABLE]: { generation: 0 },
    });
    const arrowEntity = entities.createTransient(world, {
      [FOG]: {
        visibility: "visible",
        type: "terrain",
      },
      [MOVABLE]: {
        orientations: [],
        reference: world.getEntityId(frameEntity),
        spring: {
          duration: 200,
        },
        lastInteraction: 0,
        bumpGeneration: 0,
        flying: false,
      },
      [POSITION]: add(menuOffset, { x: -1, y: 1 }),
      [RENDERABLE]: { generation: 0 },
      [SPRITE]: none,
    });
    state.args.memory.arrow = world.getEntityId(arrowEntity);

    // set controlled discovery
    world.getEntities([SEQUENCABLE]).forEach((entity) => {
      const discovery = getSequence(world, entity, "discovery");
      if (!discovery) return;
      discovery.args.force = false;
    });
  }

  const arrowEntity = world.assertByIdAndComponents(state.args.memory.arrow, [
    SPRITE,
    POSITION,
  ]);

  const circles = state.args.memory.circles as ContactCircle[];
  const circleGeneration = Math.floor(state.elapsed / circleTime);

  // handle settings
  const soundLever = assertIdentifierAndComponents(world, "settings_sound", [
    CLICKABLE,
    SPRITE,
    TOOLTIP,
  ]);
  const controlsLever = assertIdentifierAndComponents(
    world,
    "settings_controls",
    [CLICKABLE, SPRITE, TOOLTIP]
  );

  if (soundLever[CLICKABLE].clicked) {
    if (soundLever[SPRITE] === leverOn) {
      muteAudio();
      soundLever[SPRITE] = leverOff;
      soundLever[TOOLTIP].dialogs = [createDialog("Sound off")];
      soundLever[TOOLTIP].changed = true;
    } else {
      unmuteAudio();
      soundLever[SPRITE] = leverOn;
      soundLever[TOOLTIP].dialogs = [createDialog("Sound on")];
      soundLever[TOOLTIP].changed = true;
    }

    rerenderEntity(world, soundLever);
    soundLever[CLICKABLE].clicked = false;
  }

  if (controlsLever[CLICKABLE].clicked) {
    if (controlsLever[SPRITE] === leverOn) {
      world.metadata.setFlipped(true);
      controlsLever[SPRITE] = leverOff;
      controlsLever[TOOLTIP].dialogs = [createDialog("Right side")];
      controlsLever[TOOLTIP].changed = true;
    } else {
      world.metadata.setFlipped(false);
      controlsLever[SPRITE] = leverOn;
      controlsLever[TOOLTIP].dialogs = [createDialog("Left side")];
      controlsLever[TOOLTIP].changed = true;
    }

    rerenderEntity(world, controlsLever);
    controlsLever[CLICKABLE].clicked = false;
  }

  // handle clicks on blocks
  world
    .getEntities([CLICKABLE, POSITION, SPRITE])
    .filter(
      (entity) =>
        entity[CLICKABLE].clicked && !entity[SEQUENCABLE] && !entity[COVERABLE]
    )
    .forEach((clickEntity) => {
      circles.push({
        generation: circleGeneration,
        position: clickEntity[POSITION],
        rendered: circleGeneration - 1,
        color:
          circleColors[
            (circleColors.indexOf(clickEntity[SPRITE].layers[0].color) + 1) %
              circleColors.length
          ],
      });
      clickEntity[CLICKABLE].clicked = false;
    });

  // render circles in reverse order to allow in-place splicing
  for (
    let circleIndex = circles.length - 1;
    circleIndex >= 0;
    circleIndex -= 1
  ) {
    const circle = circles[circleIndex];

    if (circle.rendered === circleGeneration) continue;

    const radius = circleGeneration - circle.generation;
    stage.updated = true;

    if (radius > circleRange) {
      circles.splice(circleIndex, 1);
      continue;
    }

    // color next ring
    const pixels = pixelCircle({ x: 0, y: 0 }, radius, 1);
    const fractions = pixels.map((pixel) =>
      add(circle.position, { x: pixel.x, y: pixel.y / 4 })
    );

    fractions.forEach((fraction) => {
      const pixel = {
        x: fraction.x,
        y:
          fraction.y % 1 === 0
            ? fraction.y
            : fraction.y + 0.5 * Math.sign(fraction.y),
      };
      getClickables(world, pixel).forEach((clickable) => {
        // eslint-disable-next-line no-mixed-operators
        const half = pixel.y > 0 !== (fraction.y % 1 === 0) ? "▀" : "▄";
        if (
          clickable &&
          (pixel.y === 0 || clickable[SPRITE].layers[0].char === half)
        ) {
          clickable[SPRITE] = recolorSprite(
            clickable[SPRITE],
            clickable[SPRITE].layers[0].color === colors.black
              ? { [colors.black]: circle.color }
              : circle.color
          );
          rerenderEntity(world, clickable);
        }
      });
    });

    circle.rendered = circleGeneration;
  }

  // select and deselect menu items
  menuItems.forEach(({ name, disabled }, menuIndex) => {
    const topLeft = add(menuOffset, {
      x: -menuPadding,
      y: menuSize.y * menuIndex,
    });
    const bottomRight = add(add(topLeft, menuSize), {
      x: menuPadding * 2 - 1,
      y: -1,
    });

    step({
      stage,
      name,
      forceEnter: () => within(topLeft, bottomRight, heroPosition, size),
      onEnter: () => {
        deselectItem(stage);
        arrowEntity[SPRITE] = disabled ? popupBlocked : popupSelection;
        moveEntity(
          world,
          arrowEntity,
          add(topLeft, { x: menuPadding - 1, y: 1 })
        );
        rerenderEntity(world, arrowEntity);

        for (let cellIndex = 0; cellIndex < menuSize.x - 1; cellIndex += 1) {
          const cellPosition = add(topLeft, {
            x: menuPadding + cellIndex,
            y: 1,
          });

          const groundEntity = entities.createGround(world, {
            [FOG]: {
              visibility: "visible",
              type: "terrain",
            },
            [POSITION]: cellPosition,
            [RENDERABLE]: { generation: 0 },
            [SPRITE]: disabled ? dots : shade,
          });
          state.args.memory.grounds.push(groundEntity);
          registerEntity(world, groundEntity);

          const dotEntity = Object.values(getCell(world, cellPosition)).find(
            (entity) => entity[COLLIDABLE]
          );

          if (dotEntity) {
            dotEntity[SPRITE] =
              menuArrows.includes(cellIndex) && !disabled
                ? menuArrow
                : recolorSprite(dotEntity[SPRITE], colors.white);
            rerenderEntity(world, dotEntity);
          }
        }
        const discoveryState = Object.values(
          getCell(world, add(bottomRight, { x: -menuPadding, y: -1 }))
        )
          .map((entity) => getSequence(world, entity, "discovery"))
          .find(Boolean);

        if (discoveryState) {
          discoveryState.args.force = true;
        }

        return true;
      },
      isCompleted: () => !within(topLeft, bottomRight, heroPosition, size),
      onLeave: () => {
        deselectItem(stage);
        arrowEntity[SPRITE] = none;
        rerenderEntity(world, arrowEntity);

        return "wait";
      },
    });
  });

  step({
    stage,
    name: "wait",
  });

  return { finished: stage.finished, updated: stage.updated };
};

export const tutorialNpc: Sequence<NpcSequence> = (world, entity, state) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const size = world.metadata.gameEntity[LEVEL].size;
  const heroEntity = world.getEntity([
    MOVABLE,
    PLAYER,
    POSITION,
    VIEWABLE,
    LIGHT,
    SPAWNABLE,
  ]);

  // unlock final room when lever is activated
  const unlockLever = assertIdentifierAndComponents(world, "unlock_lever", [
    CLICKABLE,
    SPRITE,
    TOOLTIP,
  ]);

  if (unlockLever[CLICKABLE].clicked && unlockLever[SPRITE] === leverOff) {
    Object.values(getCell(world, { x: 0, y: roomSize.y / 2 })).forEach(
      (entity) => {
        if (!entity[COLLIDABLE]) return;
        disposeEntity(world, entity);
      }
    );

    unlockLever[SPRITE] = leverOn;
    rerenderEntity(world, unlockLever);
  }

  step({
    stage,
    name: START_STEP,
    isCompleted: () => !!heroEntity,
    onLeave: () => {
      delete entity[VIEWABLE].spring;
      return "center";
    },
  });

  tutorialRooms.forEach(({ name, offsetX, offsetY, quest, waves }) => {
    const topLeft = {
      x: offsetX - roomSize.x * 0.5,
      y: offsetY - roomSize.y * 0.5,
    };
    const bottomRight = {
      x: offsetX + roomSize.x * 0.5,
      y: offsetY + roomSize.y * 0.5,
    };
    const availableSpawners = (waves || [])
      .map((wave) => Object.values(getCell(world, wave.position)))
      .flat()
      .filter(
        (spawner) => spawner && spawner[BEHAVIOUR]?.patterns.length === 0
      );
    const shouldSpawn = waves && availableSpawners.length > 0;

    step({
      stage,
      name,
      forceEnter: () =>
        ![name, "fight", "death"].includes(state.args.step) &&
        !state.args.memory.changed &&
        !!heroEntity &&
        !isDead(world, heroEntity) &&
        within(topLeft, bottomRight, heroEntity[POSITION], size),
      onEnter: () => {
        state.args.memory.changed = true;

        entity[VIEWABLE].active = true;

        // reveal area
        for (let x = topLeft.x; x <= bottomRight.x; x += 1) {
          for (let y = topLeft.y; y <= bottomRight.y; y += 1) {
            const cell = getCell(world, { x, y });
            Object.values(cell).forEach((cellEntity) => {
              if (
                cellEntity[FOG]?.visibility === "hidden" &&
                cellEntity[RENDERABLE]
              ) {
                cellEntity[FOG].visibility = "fog";
                rerenderEntity(world, cellEntity);
              }
            });
          }
        }

        // clear float
        world
          .getEntities([IDENTIFIABLE])
          .filter((entity) => entity[IDENTIFIABLE].name === `${name}:float`)
          .forEach((entity) => {
            disposeEntity(world, entity);
          });

        if (heroEntity && quest) {
          questSequence(world, heroEntity, quest, {});
        }

        if (shouldSpawn) {
          // close entrances
          [-0.5, 0.5].forEach((y) => {
            const mountainEntity = createCell(
              world,
              { x: offsetX, y: roomSize.y * y + offsetY },
              "mountain",
              "visible"
            ).cell;
            setIdentifier(world, mountainEntity, `${name}:blocker`);
          });

          // create barrier
          const horizontalOffset = roomSize.x / 2;
          const verticalOffset = roomSize.y / 2;
          for (const iteration of iterations) {
            const delta = orientationPoints[iteration.orientation];
            const corner = {
              x: (delta.x - iteration.normal.x) * horizontalOffset + offsetX,
              y: (delta.y - iteration.normal.y) * verticalOffset + offsetY,
            };
            const cornerEntity = entities.createFloat(world, {
              [FOG]: { visibility: "visible", type: "float" },
              [ORIENTABLE]: { facing: iteration.orientation },
              [POSITION]: corner,
              [SPRITE]: barrierCorner,
              [RENDERABLE]: { generation: 0 },
            });
            setIdentifier(world, cornerEntity, `${name}:barrier`);

            const length = Math.abs(
              (roomSize.x - 1) * iteration.normal.x +
                (roomSize.y - 1) * iteration.normal.y
            );

            for (let sideOffset = 1; sideOffset <= length; sideOffset += 1) {
              const sideEntity = entities.createFloat(world, {
                [FOG]: { visibility: "visible", type: "float" },
                [ORIENTABLE]: { facing: iteration.orientation },
                [POSITION]: add(
                  {
                    x: sideOffset * iteration.normal.x,
                    y: sideOffset * iteration.normal.y,
                  },
                  corner
                ),
                [SPRITE]: barrierSide,
                [RENDERABLE]: { generation: 0 },
              });
              setIdentifier(world, sideEntity, `${name}:barrier`);
            }
          }

          // activate spawners
          waves.forEach(({ position, types }) => {
            const spawnerEntity = Object.values(getCell(world, position)).find(
              (entity) => entity[BEHAVIOUR]
            ) as TypedEntity<"BEHAVIOUR">;
            spawnerEntity[BEHAVIOUR].patterns = [
              {
                name: "spawner",
                memory: { types: [...types], name },
              },
            ];
            setIdentifier(world, spawnerEntity, `${name}:spawner`);
          });
        }

        moveEntity(world, entity, {
          x: offsetX,
          y: offsetY,
        });
        return true;
      },
      isCompleted: () =>
        !!heroEntity &&
        !getLockable(world, heroEntity[POSITION]) &&
        stage.state.args.step === name,
      onLeave: () => {
        state.args.memory.changed = false;
        state.args.memory.room = { name, offsetX, offsetY };
        if (getIdentifier(world, `${name}:spawner`)) return "fight";
        return "wait";
      },
    });
  });

  step({
    stage,
    name: "fight",
    isCompleted: () =>
      !getIdentifier(world, `${state.args.memory.room?.name}:spawner`) ||
      !heroEntity ||
      isRespawning(world, heroEntity),
    onLeave: () => {
      // despawn previous mobs
      world
        .getEntities([IDENTIFIABLE])
        .filter(
          (entity) =>
            entity[IDENTIFIABLE].name === `${state.args.memory.room?.name}:mob`
        )
        .forEach((entity) => {
          disposeEntity(world, entity);
        });

      // deactivate spawners
      world.getEntities([BEHAVIOUR]).forEach((entity) => {
        if (entity[BEHAVIOUR].patterns[0]?.name === "spawner") {
          entity[BEHAVIOUR].patterns = [];
        }
      });

      // unblock entrances and remove barrier
      world
        .getEntities([IDENTIFIABLE])
        .filter(
          (entity) =>
            entity[IDENTIFIABLE].name ===
              `${state.args.memory.room?.name}:blocker` ||
            entity[IDENTIFIABLE].name ===
              `${state.args.memory.room?.name}:barrier`
        )
        .forEach((entity) => {
          disposeEntity(world, entity);
        });

      state.args.memory.room = undefined;
      return "wait";
    },
  });

  step({
    stage,
    name: "death",
    forceEnter: () =>
      !!heroEntity &&
      isGhost(world, heroEntity) &&
      heroEntity[MOVABLE].flying &&
      state.args.step !== "death",
    onEnter: () => {
      entity[VIEWABLE].active = false;
      return true;
    },
    isCompleted: () => !!heroEntity && !isDead(world, heroEntity),
    onLeave: () => START_STEP,
  });

  return { finished: stage.finished, updated: stage.updated };
};

export const earthTownNpc: Sequence<NpcSequence> = (world, entity, state) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };
  const size = world.metadata.gameEntity[LEVEL].size;
  const { topLeft, bottomRight, spawn } = state.args.memory;

  const heroEntity = getIdentifierAndComponents(world, "hero", [
    POSITION,
    VIEWABLE,
    LIGHT,
    SPAWNABLE,
  ]);

  step({
    stage,
    name: START_STEP,
    isCompleted: () =>
      !!heroEntity && within(topLeft, bottomRight, heroEntity[POSITION], size),
    onLeave: () => {
      if (heroEntity) {
        heroEntity[SPAWNABLE].position = { ...spawn };

        queueMessage(world, heroEntity, {
          line: createText("Spawn updated!", colors.black, colors.lime),
          orientation: "up",
          fast: false,
          delay: 0,
        });
      }

      return END_STEP;
    },
  });

  return { finished: stage.finished, updated: stage.updated };
};

export const earthChiefNpc: Sequence<NpcSequence> = (world, entity, state) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };
  const druidEntity = getIdentifier(world, "earthDruid");
  const traderEntity = getIdentifier(world, "earthTrader");
  const smithEntity = getIdentifier(world, "earthSmith");

  step({
    stage,
    name: START_STEP,
    isCompleted: () =>
      !!druidEntity && !!traderEntity && !!smithEntity && entity[POPUP].active,
    onLeave: () => {
      if (druidEntity) {
        createPopup(world, druidEntity, {
          deals: [
            {
              item: {
                stat: "xp",
                amount: 3,
              },
              stock: 1,
              prices: [
                {
                  consume: "potion",
                  material: "wood",
                  element: "fire",
                  amount: 1,
                },
              ],
            },
          ],
          objectives: [
            {
              item: { consume: "potion", material: "wood", element: "fire" },
              available: true,
            },
            { item: { stackable: "stick" }, available: true },
            {
              item: { stackable: "resource", material: "wood" },
              available: true,
            },
            { item: { stackable: "apple" }, available: true },
            {
              identifier: "earth_kettle",
              title: [kettle, ...createText("Kettle", colors.grey)],
              description: [
                [
                  ...createText("Set "),
                  getOrientedSprite(questPointer, "right"),
                  ...createText("Focus", colors.grey),
                  ...createText(" to the"),
                ],
                [
                  kettle,
                  ...createText("Kettle", colors.grey),
                  ...createText(" to craft"),
                ],
                createText("items."),
              ],
              available: true,
            },
          ],
          lines: [
            [
              createText("Hello stranger!"),
              [
                ...createText("My name is "),
                ...createText("Druid", colors.green),
                ...createText("."),
              ],
              [],
              createText("I can help you"),
              [
                ...createText("with "),
                craft,
                ...createText("Crafting", colors.silver),
                ...createText("."),
              ],
              [],
              createText("Could you make a"),
              [
                ...createItemName({
                  consume: "potion",
                  material: "wood",
                  element: "fire",
                }),
                ...createText(" for me?"),
              ],
              [],
              [
                ...createText("Collect "),
                ...createItemText({ stackable: "stick", amount: 10 }),
              ],
              [
                ...createText("and craft "),
                ...createItemText({
                  stackable: "resource",
                  material: "wood",
                  amount: 1,
                }),
                ...createText("."),
              ],
              [],
              [
                ...createText("Find "),
                ...createItemText({
                  stackable: "apple",
                  amount: 1,
                }),
                ...createText(" and"),
              ],
              createText("combine them."),
              [],
              [
                ...createText("Use the "),
                kettle,
                ...createText("Kettle", colors.grey),
              ],
              createText("next to me."),
              [],
              createText("Then, come back!"),
            ],
          ],
          tabs: ["quest"],
        });
        npcSequence(world, druidEntity, "earthDruidNpc", {});
      }

      if (traderEntity) {
        createPopup(world, traderEntity, {
          deals: [
            {
              item: {
                consume: "key",
                material: "iron",
                amount: 1,
              },
              stock: 1,
              prices: [{ stackable: "coin", amount: 10 }],
            },
          ],
          lines: [
            [
              createText("Hi there, nice to"),
              createText("meet you. I am"),
              [
                ...createText("the "),
                ...createText("Trader", colors.green),
                ...createText("."),
              ],
              [],
              [
                ...createText("Find some "),
                ...createItemName({ stackable: "coin" }),
                ...createText(","),
              ],
              createText("they drop from"),
              [
                getUnitSprite("orb"),
                getUnitSprite("prism"),
                getUnitSprite("eye"),
                ...createText("Enemies", colors.maroon),
                ...createText("."),
              ],
              [],
              createText("Then I will give"),
              [
                ...createText("you a "),
                ...createItemName({ consume: "key", material: "iron" }),
                ...createText(" and"),
              ],
              createText("you can buy and"),
              createText("sell items here."),
            ],
          ],
          tabs: ["quest"],
        });
        npcSequence(world, traderEntity, "earthTraderNpc", {});
      }

      if (smithEntity) {
        createPopup(world, smithEntity, {
          deals: [
            {
              item: {
                stat: "xp",
                amount: 5,
              },
              stock: 1,
              prices: [{ stackable: "seed", amount: 5 }],
            },
          ],
          choices: [
            {
              equipment: "secondary",
              secondary: "bow",
              material: "wood",
              amount: 1,
            },
            {
              equipment: "secondary",
              secondary: "slash",
              material: "wood",
              amount: 1,
            },
            { equipment: "torch", material: "wood", amount: 1 },
          ],
          lines: [
            [
              createText("Hey mate! My name"),
              [
                ...createText("is "),
                ...createText("Smith", colors.green),
                ...createText(", and I"),
              ],
              createText("can teach about"),
              [
                forge,
                ...createText("Forging", colors.silver),
                ...createText("."),
              ],
              [],
              createText("But first, get me"),
              [
                ...createItemText({
                  stackable: "seed",
                  amount: 5,
                }),
                ...createText(" from "),
                ...createItemName({ stackable: "leaf" }),
              ],
              [
                ...createText("or "),
                getUnitSprite("rose"),
                getUnitSprite("clover"),
                getUnitSprite("violet"),
                ...createText("Plants", colors.maroon),
                ...createText("."),
              ],
              [],
              createText("Then you can"),
              createText("choose an item."),
            ],
          ],
          tabs: ["quest"],
        });
        npcSequence(world, smithEntity, "earthSmithNpc", {});
      }

      return END_STEP;
    },
  });

  return { finished: stage.finished, updated: stage.updated };
};

export const earthDruidNpc: Sequence<NpcSequence> = (world, entity, state) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };
  const kettleEntity = getIdentifier(world, "earth_kettle");

  step({
    stage,
    name: START_STEP,
    isCompleted: () => !!kettleEntity && entity[POPUP].active,
    onLeave: () => {
      if (kettleEntity) {
        createPopup(world, kettleEntity, {
          recipes: craftingRecipes,
          lines: [
            [
              [craft, ...createText("Crafting", colors.silver)],
              repeat(swirl, frameWidth - 2),
              [],
              createText("Gather some items"),
              [
                ...createText("like "),
                ...createItemName({ stackable: "leaf" }),
                ...createText(" or"),
              ],
              [...createItemName({ stackable: "berry" }), ...createText(".")],
              [],
              [
                ...createText("Scroll and "),
                ...createText("VIEW", colors.black, colors.lime),
              ],
              createText("an item to craft."),
              [],
              [
                ...underline(createText("TIP", colors.silver)),
                ...createText(": Some items"),
              ],
              createText("have few recipes."),
              [],
              repeat(swirl, frameWidth - 2),
              [],
              isTouch
                ? [
                    ...createText("Swipe "),
                    ...createText("RIGHT", colors.grey),
                    ...createText(" to"),
                  ]
                : [
                    ...createText("Press "),
                    ...createText("\u0119", colors.grey),
                    ...createText(" key to"),
                  ],
              [
                ...createText("view "),
                ...createText("╡", colors.silver),
                ...createText("CRAFT", colors.lime),
                ...createText("╞", colors.silver),
                ...createText(" tab."),
              ],
            ],
          ],
          tabs: ["info", "craft"],
        });
      }

      return END_STEP;
    },
  });

  return { finished: stage.finished, updated: stage.updated };
};

export const earthTraderNpc: Sequence<NpcSequence> = (world, entity, state) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  step({
    stage,
    name: START_STEP,
    isCompleted: () => !entity[POPUP],
    onLeave: () => {
      createPopup(world, entity, {
        deals: purchasableItems.map((item) => ({
          item: {
            ...item,
            amount: 1,
          },
          stock: Infinity,
          prices: getItemBuyPrice(item),
        })),

        tabs: ["buy", "sell"],
      });

      return END_STEP;
    },
  });

  return { finished: stage.finished, updated: stage.updated };
};

export const earthSmithNpc: Sequence<NpcSequence> = (world, entity, state) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };
  const anvilEntity = getIdentifier(world, "earth_anvil");

  step({
    stage,
    name: START_STEP,
    isCompleted: () => !!anvilEntity && entity[POPUP].active,
    onLeave: () => {
      if (anvilEntity) {
        createPopup(world, anvilEntity, {
          lines: [
            [
              [forge, ...createText("Forging", colors.silver)],
              repeat(swirl, frameWidth - 2),
              [],
              createText("You can forge the"),
              createText("gear you hold."),
              [],
              [
                ...createText("View "),
                ...createText("╡", colors.silver),
                ...createText("GEAR", colors.lime),
                ...createText("╞", colors.silver),
                ...createText(" by"),
              ],
              isTouch
                ? [
                    ...createText("tapping on "),
                    ...createText("BAG", colors.black, colors.silver),
                    ...createText("."),
                  ]
                : [
                    ...createText("pressing "),
                    ...createText("[TAB]", colors.grey),
                    ...createText("."),
                  ],
              [],
              createText("Scroll to choose"),
              createText("gear and try to"),
              createText("add items until"),
              createText("you find a match."),
              [],
              [
                ...underline(createText("TIP", colors.silver)),
                ...createText(": "),
                ...createItemName({ stackable: "resource", material: "iron" }),
                ...createText(" can be"),
              ],
              createText("added to wooden"),
              createText("gear."),
              [],
              repeat(swirl, frameWidth - 2),
              [],
              isTouch
                ? [
                    ...createText("Swipe "),
                    ...createText("RIGHT", colors.grey),
                    ...createText(" to"),
                  ]
                : [
                    ...createText("Press "),
                    ...createText("\u0119", colors.grey),
                    ...createText(" key to"),
                  ],
              [
                ...createText("view "),
                ...createText("╡", colors.silver),
                ...createText("FORGE", colors.lime),
                ...createText("╞", colors.silver),
                ...createText(" tab."),
              ],
            ],
          ],
          tabs: ["info", "forge"],
        });
      }

      return END_STEP;
    },
  });

  return { finished: stage.finished, updated: stage.updated };
};

export const worldNpc: Sequence<NpcSequence> = (world, entity, state) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };
  const size = world.metadata.gameEntity[LEVEL].size;
  const { townPosition, townWidth, townHeight } = state.args.memory;

  const heroEntity = getIdentifierAndComponents(world, "hero", [
    POSITION,
    VIEWABLE,
    LIGHT,
    SPAWNABLE,
  ]);
  const soulEntity = world.getEntities([
    SOUL,
    INVENTORY,
    EQUIPPABLE,
    VIEWABLE,
    SPAWNABLE,
  ])[0];
  const bossEntity = getIdentifier(world, "chest_boss");
  const focusEntity = getIdentifier(world, "focus");
  const doorEntity = getIdentifier(world, "gate");
  const compassEntity = getIdentifierAndComponents(world, "compass", [ITEM]);

  if (!focusEntity || !doorEntity || !compassEntity) {
    return { finished: stage.finished, updated: stage.updated };
  }

  // clear area if player reached exit
  step({
    stage,
    name: START_STEP,
    isCompleted: () =>
      !!heroEntity &&
      heroEntity[POSITION].x === 0 &&
      heroEntity[POSITION].y === 5,
    onLeave: () => {
      if (!heroEntity) return "town";

      // set camera to player
      entity[VIEWABLE].active = false;
      heroEntity[VIEWABLE].active = true;

      // close door
      lockDoor(world, doorEntity);

      // set player light and spawn
      heroEntity[LIGHT] = { ...defaultLight };
      heroEntity[SPAWNABLE].position = { x: 0, y: 9 };
      heroEntity[SPAWNABLE].light = { ...defaultLight };

      const spawnEntity = getIdentifier(world, "spawn");
      if (spawnEntity) {
        moveEntity(world, spawnEntity, heroEntity[SPAWNABLE].position);
        setNeedle(world, spawnEntity);
      }

      // give player compass if not already done
      const compassCarrier = compassEntity[ITEM].carrier;
      if (compassCarrier !== world.getEntityId(heroEntity)) {
        const containerEntity = world.assertById(compassEntity[ITEM].carrier);
        collectItem(world, heroEntity, containerEntity);
      }

      // clear spawn area
      const menuRows = spawnArea.split("\n");
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
          const shouldDiscard = (y < 5 || y > 152) && (x < 11 || x > 149);
          let hasAir = false;
          Object.values(cell).forEach((cellEntity) => {
            // don't remove player and focus, and any unrelated entities
            if (
              cellEntity === heroEntity ||
              cellEntity === focusEntity ||
              cellEntity === entity ||
              cellEntity === spawnEntity ||
              VIEWABLE in cellEntity ||
              !(RENDERABLE in cellEntity) ||
              (CASTABLE in cellEntity &&
                cellEntity[BELONGABLE]?.faction !== "nature")
            )
              return;

            if (!hasAir && cellEntity[FOG]?.type === "air") hasAir = true;

            if (shouldDiscard && cellEntity[FOG]?.type !== "air") {
              disposeEntity(world, cellEntity);
              return;
            }

            if (cellEntity[FOG]) cellEntity[FOG].visibility = "hidden";
            rerenderEntity(world, cellEntity);
          });

          // restore removed air particles
          if (!hasAir) {
            entities.createGround(world, {
              [FOG]: { visibility: "hidden", type: "air" },
              [POSITION]: { x, y },
              [RENDERABLE]: { generation: 0 },
              [SPRITE]: fog,
            });
          }
        }
      }

      // clear invisible walls
      for (let offset = 0; offset < 3; offset += 1) {
        const mountainEntity = getIdentifier(world, `mountain-${offset}`);
        disposeEntity(world, mountainEntity!);
      }

      // insert boss area
      insertArea(world, bossArea, 0, -2, true);

      return "town";
    },
  });

  step({
    stage,
    name: "town",
    isCompleted: () =>
      !!heroEntity &&
      Math.abs(signedDistance(heroEntity[POSITION].x, townPosition.x, size)) <
        townWidth / 2 &&
      Math.abs(signedDistance(heroEntity[POSITION].y, townPosition.y, size)) <
        townHeight / 2,
    onLeave: () => {
      if (!heroEntity) return "boss:wait";

      heroEntity[SPAWNABLE].position = add(townPosition, {
        x: 0,
        y: 1,
      });
      const spawnEntity = getIdentifier(world, "spawn");

      if (spawnEntity) {
        moveEntity(world, spawnEntity, heroEntity[SPAWNABLE].position);
        setNeedle(world, spawnEntity);
      }
      return "boss:wait";
    },
  });

  // initiate boss fight
  step({
    stage,
    name: "boss",
    forceEnter: () =>
      !!heroEntity &&
      heroEntity[POSITION].x === 0 &&
      heroEntity[POSITION].y === 3 &&
      state.args.step !== START_STEP,
    onEnter: () => {
      if (!heroEntity) return false;

      // set camera to room
      moveEntity(world, entity, { x: 0, y: -2 });
      entity[VIEWABLE].active = true;
      entity[VIEWABLE].fraction = undefined;

      // lock door again
      lockDoor(world, doorEntity);

      // set player light
      heroEntity[VIEWABLE].active = false;
      heroEntity[LIGHT] = { ...spawnLight };
      rerenderEntity(world, heroEntity);

      return true;
    },
    isCompleted: () => !!heroEntity && isDead(world, heroEntity),
    onLeave: () => "soul",
  });

  // wait for player to respawn
  step({
    stage,
    name: "soul",
    isCompleted: () =>
      !!soulEntity && !!getSequence(world, soulEntity, "revive"),
    onLeave: () => {
      if (!soulEntity) return "reset";
      entity[VIEWABLE].active = false;
      soulEntity[VIEWABLE].active = true;
      soulEntity[SPAWNABLE].viewable.active = true;
      return "reset";
    },
  });

  // reset boss and player after death
  step({
    stage,
    name: "reset",
    isCompleted: () => !!soulEntity && !!soulEntity[EQUIPPABLE].compass,
    onLeave: () => {
      // hide boss area again
      const bossRows = bossArea.split("\n");
      const bossWidth = bossRows[0].length;
      const bossHeight = bossRows.length;

      matrixFactory(bossWidth, bossHeight, (offsetX, offsetY) => {
        const x = normalize(offsetX - (bossWidth - 1) / 2, size);
        const y = normalize(offsetY - (bossHeight - 1) / 2 - 2, size);

        // leave entrance visible
        if (
          offsetY === bossHeight - 1 &&
          Math.abs(signedDistance(0, x, size)) <= 1
        )
          return;

        Object.values(getCell(world, { x, y })).forEach((cellEntity) => {
          if (!cellEntity[FOG]) return;

          cellEntity[FOG].visibility = "hidden";
          rerenderEntity(world, cellEntity);
        });

        entities.createGround(world, {
          [FOG]: { visibility: "hidden", type: "air" },
          [POSITION]: { x, y },
          [RENDERABLE]: { generation: 0 },
          [SPRITE]: fog,
        });
      });
      return "boss:wait";
    },
  });

  // boss defeated
  step({
    stage,
    name: "defeat",
    forceEnter: () => !!heroEntity && state.args.step === "boss" && !bossEntity,
    onEnter: () => {
      if (!heroEntity) return false;

      // create portal
      createCell(world, { x: 0, y: 155 }, "portal", "visible");

      return true;
    },
  });

  return { finished: stage.finished, updated: stage.updated };
};

const greetTime = 3000;

export const nomadNpc: Sequence<NpcSequence> = (world, entity, state) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const doorEntity = getIdentifier(world, "nomad_door");
  const heroEntity = getIdentifierAndComponents(world, "hero", [
    POSITION,
    EQUIPPABLE,
    STATS,
    SPAWNABLE,
    INVENTORY,
  ]);
  const keyEntity = getIdentifierAndComponents(world, "nomad_key", [ITEM]);
  const chestEntity =
    keyEntity &&
    world.getEntityByIdAndComponents(keyEntity[ITEM].carrier, [STATS]);

  if (!doorEntity) {
    return { finished: stage.finished, updated: stage.updated };
  }

  // remember initial nomad position
  if (!state.args.memory.initialPosition) {
    state.args.memory.initialPosition = copy(entity[POSITION]);
  }

  step({
    stage,
    name: START_STEP,
    onEnter: () => true,
    isCompleted: () => isUnlocked(world, doorEntity),
    onLeave: () => "greet",
  });

  step({
    stage,
    name: "greet",
    onEnter: () => {
      state.args.memory.greeted = state.elapsed;
      entity[BEHAVIOUR].patterns.push({
        name: "dialog",
        memory: {
          override: "visible",
          dialogs: [createDialog("Who's there?")],
        },
      });
      return true;
    },
    isCompleted: () => state.elapsed > state.args.memory.greeted + greetTime,
    onLeave: () => {
      entity[BEHAVIOUR].patterns.push({
        name: "dialog",
        memory: {
          override: undefined,
          dialogs: [],
        },
      });

      return "shop";
    },
  });

  // warn player if chest is attacked by player
  step({
    stage,
    name: "warn",
    forceEnter: () =>
      !state.args.memory.warned &&
      !!chestEntity &&
      chestEntity[STATS].hp < chestEntity[STATS].maxHp,
    onEnter: () => {
      state.args.memory.warned = true;
      const previousDialog = { ...entity[TOOLTIP], changed: true };

      entity[TOOLTIP].override = "visible";
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].dialogs = [createDialog("Stop it!")];
      entity[BEHAVIOUR].patterns.unshift(
        {
          name: "wait",
          memory: { ticks: 4 },
        },
        {
          name: "dialog",
          memory: previousDialog,
        }
      );
      return false;
    },
  });

  step({
    stage,
    name: "shop",
    isCompleted: () =>
      !!heroEntity &&
      heroEntity[INVENTORY].items.some(
        (item) =>
          world.assertByIdAndComponents(item, [ITEM])[ITEM].consume === "key"
      ),
    onLeave: () => {
      if (keyEntity) {
        if (chestEntity) {
          removeFromInventory(world, chestEntity, keyEntity);
          disposeEntity(world, keyEntity);
        } else {
          const carrierEntity = world.assertById(keyEntity[ITEM].carrier);
          disposeEntity(world, carrierEntity, false);
        }
      }
      return END_STEP;
    },
  });

  // attack player if key is stolen
  const size = world.metadata.gameEntity[LEVEL].size;
  const inAttackRange =
    !!heroEntity &&
    getDistance(
      state.args.memory.initialPosition,
      heroEntity[POSITION],
      size,
      1
    ) < 5;
  const outOfRange =
    !!heroEntity &&
    getDistance(
      state.args.memory.initialPosition,
      heroEntity[POSITION],
      size,
      1
    ) > 16;
  step({
    stage,
    name: "enrage",
    forceEnter: () =>
      !!heroEntity &&
      ((!!keyEntity &&
        keyEntity[ITEM].carrier === world.getEntityId(heroEntity)) ||
        isEnemy(world, entity)) &&
      inAttackRange,
    onEnter: () => {
      removePopup(world, entity);

      entity[BEHAVIOUR].patterns = [
        {
          name: "enrage",
          memory: { shout: "Thief\u0112" },
        },
        {
          name: "kill",
          memory: {
            target: heroEntity && world.getEntityId(heroEntity),
          },
        },
      ];
      return true;
    },
  });

  step({
    stage,
    name: "aggro",
    forceEnter: () =>
      !!heroEntity &&
      ((!!keyEntity &&
        keyEntity[ITEM].carrier === world.getEntityId(heroEntity)) ||
        isEnemy(world, entity)) &&
      outOfRange,
    onEnter: () => {
      entity[BEHAVIOUR].patterns = [
        {
          name: "dialog",
          memory: {
            override: undefined,
            dialogs: [],
          },
        },
        {
          name: "move",
          memory: {
            targetPosition: state.args.memory.initialPosition,
          },
        },
      ];
      return true;
    },
  });

  return { finished: stage.finished, updated: stage.updated };
};

export const tombstoneNpc: Sequence<NpcSequence> = (world, entity, state) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  step({
    stage,
    name: START_STEP,
    isCompleted: () => !entity[SEQUENCABLE].states.vision,
    onLeave: () => "rip",
  });

  step({
    stage,
    name: "rip",
    onEnter: () => {
      entity[TOOLTIP].dialogs = [createDialog("RIP")];
      entity[TOOLTIP].override = "visible";
      entity[TOOLTIP].changed = true;

      return true;
    },
    isCompleted: () => true,
    onLeave: () => END_STEP,
  });

  return { updated: stage.updated, finished: stage.finished };
};

export const chestNpc: Sequence<NpcSequence> = (world, entity, state) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const heroEntity = getIdentifierAndComponents(world, "hero", [
    POSITION,
    EQUIPPABLE,
    STATS,
    SPAWNABLE,
    INVENTORY,
  ]);

  if (!heroEntity) {
    return { finished: stage.finished, updated: stage.updated };
  }

  // remember initial chest and tower positions
  if (!state.args.memory.initialPosition) {
    state.args.memory.initialPosition = copy(entity[POSITION]);
  }
  if (!state.args.memory.towerPositions) {
    state.args.memory.towerPositions = world
      .getEntities([IDENTIFIABLE, SPRITE, POSITION, BEHAVIOUR, STATS])
      .filter((tower) => tower[IDENTIFIABLE].name === "chest_tower_statue")
      .map((tower) => copy(tower[POSITION]));
  }

  step({
    stage,
    name: START_STEP,
    onEnter: () => true,
    isCompleted: () => entity[STATS].hp < entity[STATS].maxHp,
    onLeave: () => "awaken",
  });

  step({
    stage,
    name: "awaken",
    onEnter: () => {
      state.args.memory.awakened = state.elapsed;
      entity[BEHAVIOUR].patterns = [
        { name: "invincible", memory: {} },
        {
          name: "dialog",
          memory: {
            enemy: true,
            override: "visible",
            dialogs: [
              createShout(
                `${choice(
                  "Ouch",
                  "That hurt",
                  "My eyes",
                  "Don't touch me",
                  "Rude",
                  "How dare you"
                )}\u0112`
              ),
            ],
          },
        },
        {
          name: "chest_boss",
          memory: {
            phase: 1,
            position: state.args.memory.initialPosition,
          },
        },
        {
          name: "wait",
          memory: { ticks: 6 },
        },
        {
          name: "dialog",
          memory: {
            dialogs: [
              createShout(
                choice(
                  "Bad idea",
                  "Big mistake",
                  "Trouble ahead",
                  "Try harder",
                  "You will pay",
                  "That's your end",
                  "Prepare to die"
                )
              ),
            ],
          },
        },
        {
          name: "wait",
          memory: { ticks: 6 },
        },
        {
          name: "dialog",
          memory: {
            override: undefined,
            dialogs: [],
          },
        },
        {
          name: "wait",
          memory: { ticks: 3 },
        },
        { name: "vulnerable", memory: {} },
        {
          name: "chest_boss",
          memory: {
            phase: 2,
            position: state.args.memory.initialPosition,
          },
        },
      ];
      return true;
    },
    isCompleted: () => isDead(world, heroEntity),
    onLeave: () => "reset",
  });

  // reset boss after hero death
  step({
    stage,
    name: "reset",
    isCompleted: () => !isDead(world, heroEntity),
    onEnter: () => {
      // restore boss to normal state
      entity[STATS].hp = entity[STATS].maxHp;
      entity[SPRITE] = commonChest;
      entity[BELONGABLE].faction = "unit";
      entity[BEHAVIOUR].patterns = [
        { name: "vulnerable", memory: {} },
        {
          name: "dialog",
          memory: {
            idle: undefined,
            dialogs: [],
            override: undefined,
            enemy: undefined,
          },
        },
        {
          name: "move",
          memory: {
            targetPosition: state.args.memory.initialPosition,
          },
        },
      ];

      // restore statues
      state.args.memory.towerPositions.forEach((position: Position) => {
        Object.values(getCell(world, position)).forEach((entity) =>
          disposeEntity(world, entity)
        );

        createCell(world, position, "chest_tower_statue", "hidden");
      });

      // remove any pending mobs or drops
      world
        .getEntities([IDENTIFIABLE])
        .filter(
          (drop) =>
            drop[IDENTIFIABLE].name === "chest_mob:drop" ||
            drop[IDENTIFIABLE].name === "chest_mob"
        )
        .forEach((entity) => {
          disposeEntity(
            world,
            entity[ITEM] ? world.assertById(entity[ITEM].carrier) : entity
          );
        });

      return true;
    },
    onLeave: () => START_STEP,
  });

  return { finished: stage.finished, updated: stage.updated };
};

export const oscillatingStormNpc: Sequence<NpcSequence> = (
  world,
  entity,
  state
) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const { center, degrees, amplitude, frequency, ratio } = state.args.memory;
  const weatherSequence = getSequence(world, entity, "weather");

  if (!weatherSequence) {
    return { finished: stage.finished, updated: stage.updated };
  }

  if (!weatherSequence.args.end) {
    weatherSequence.args.end = Infinity;
  }

  const tick = world.metadata.gameEntity[REFERENCE].tick;
  const time = (state.elapsed / tick) * frequency;
  const oscillation = Math.sin(time) * amplitude;
  const radians = (degrees * Math.PI) / 180;
  const direction = {
    x: Math.cos(radians),
    y: Math.sin(radians),
  };
  const offset = {
    x: Math.round(direction.x * oscillation * ratio),
    y: Math.round(direction.y * oscillation),
  };
  const position = add(center, offset);

  if (
    weatherSequence.args.position.x !== position.x ||
    weatherSequence.args.position.y !== position.y
  ) {
    weatherSequence.args.position = position;
  }

  return { finished: stage.finished, updated: stage.updated };
};
