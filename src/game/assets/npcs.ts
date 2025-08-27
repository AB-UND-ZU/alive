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
import {
  getAvailableQuest,
  getLockable,
  isUnlocked,
} from "../../engine/systems/action";
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
import { bossArea, spawnArea } from "../levels/forest/areas";
import { commonChest, createDialog, createShout, fog, rage } from "./sprites";
import { END_STEP, questSequence, QuestStage, START_STEP, step } from "./utils";
import {
  NpcSequence,
  SEQUENCABLE,
  Sequence,
} from "../../engine/components/sequencable";
import { STATS } from "../../engine/components/stats";
import { CASTABLE } from "../../engine/components/castable";
import { defaultLight, spawnLight } from "../../engine/systems/consume";
import {
  getIdentifier,
  getIdentifierAndComponents,
  setIdentifier,
  setNeedle,
} from "../../engine/utils";
import { INVENTORY } from "../../engine/components/inventory";
import { PLAYER } from "../../engine/components/player";
import { BELONGABLE } from "../../engine/components/belongable";
import { removePopup } from "../../engine/systems/popup";
import { isDead, isEnemy } from "../../engine/systems/damage";
import { createArea, createCell } from "../../bindings/creation";
import { SOUL } from "../../engine/components/soul";
import { matrixFactory } from "../math/matrix";
import { getSequence } from "../../engine/systems/sequence";
import { IDENTIFIABLE } from "../../engine/components/identifiable";
import {
  roomSize,
  up2Center,
  up2Left,
  up2Right,
} from "../levels/overworld/areas";
import type * as questTypes from "./quests";
import { UnitKey } from "../balancing/units";
import { isGhost } from "../../engine/systems/fate";
import { MOVABLE } from "../../engine/components/movable";
import { POPUP } from "../../engine/components/popup";
import { TypedEntity } from "../../engine/entities";

const rooms: {
  name: string;
  offsetX: number;
  offsetY: number;
  quest?: keyof typeof questTypes;
  waves?: { types: (UnitKey | undefined)[]; position: Position }[];
}[] = [
  { name: "center", offsetX: 0, offsetY: 0, quest: "centerQuest" },
  { name: "north1", offsetX: 0, offsetY: -1, quest: "north1Quest" },
  {
    name: "north2",
    offsetX: 0,
    offsetY: -2,
    waves: [
      { types: ["eye", "prism", "orb", undefined], position: up2Left },
      { types: [...repeat(undefined, 3), "goldPrism"], position: up2Center },
      { types: ["eye", "prism", "orb", undefined], position: up2Right },
    ],
  },
  { name: "north3", offsetX: 0, offsetY: -3 },
];

export const overworldNpc: Sequence<NpcSequence> = (world, entity, state) => {
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

  step({
    stage,
    name: START_STEP,
    isCompleted: () => true,
    onLeave: () => "center",
  });

  rooms.forEach(({ name, offsetX, offsetY, quest, waves }) => {
    const hasBarrier = !!Object.values(
      getCell(world, {
        x: offsetX * roomSize.x,
        y: offsetY * roomSize.y - 1,
      })
    ).find((entity) => entity[FOG]?.type === "float");
    const shouldSpawn = waves && hasBarrier;

    const topLeft = {
      x: roomSize.x * (offsetX - 0.5),
      y: roomSize.y * (offsetY - 0.5),
    };
    const bottomRight = {
      x: roomSize.x * (offsetX + 0.5),
      y: roomSize.y * (offsetY + 0.5),
    };

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
              if (cellEntity[FOG] && cellEntity[RENDERABLE]) {
                cellEntity[FOG].visibility = "fog";
                rerenderEntity(world, cellEntity);
              }
            });
          }
        }

        if (heroEntity && quest) {
          questSequence(world, heroEntity, quest, {});
        }

        if (shouldSpawn) {
          // close entrances
          [-0.5, 0.5].forEach((y) => {
            const mountainEntity = createCell(
              world,
              [[]],
              { x: roomSize.x * offsetX, y: roomSize.y * (offsetY + y) },
              "mountain",
              "visible"
            )!;
            setIdentifier(world, mountainEntity, "blocker");
          });

          // despawn previous mobs
          world
            .getEntities([IDENTIFIABLE])
            .filter((entity) => entity[IDENTIFIABLE].name === `${name}:mob`)
            .forEach((entity) => {
              disposeEntity(world, entity);
            });

          // createSpawners
          waves.forEach(({ position, types }) => {
            const spawnerEntity = createCell(
              world,
              [[]],
              position,
              "spawner",
              "fog"
            ) as TypedEntity<"BEHAVIOUR">;
            spawnerEntity[BEHAVIOUR].patterns = [
              {
                name: "spawner",
                memory: { types, name },
              },
            ];
            setIdentifier(world, spawnerEntity, `${name}:spawner`);
            registerEntity(world, spawnerEntity);
          });
        }

        moveEntity(world, entity, {
          x: roomSize.x * offsetX,
          y: roomSize.y * offsetY,
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
        if (shouldSpawn) return "fight";
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
      isDead(world, heroEntity),
    onLeave: () => {
      if (!getIdentifier(world, `${state.args.memory.room?.name}:spawner`)) {
        // remove barrier
        for (let x = -2; x <= 2; x += 1) {
          for (let y = -1; y <= 1; y += 1) {
            Object.values(
              getCell(world, {
                x: state.args.memory.room.offsetX * roomSize.x + x,
                y: state.args.memory.room.offsetY * roomSize.y + y,
              })
            ).forEach((entity) => {
              if (entity[FOG]?.type === "float") {
                disposeEntity(world, entity);
              }
            });
          }
        }
      }

      // unblock entrances
      world
        .getEntities([IDENTIFIABLE])
        .filter((entity) => entity[IDENTIFIABLE].name === "blocker")
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
      createArea(world, bossArea, 0, -2);

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
      createCell(world, [[]], { x: 0, y: 155 }, "portal", "visible");

      return true;
    },
  });

  return { finished: stage.finished, updated: stage.updated };
};

export const guideNpc: Sequence<NpcSequence> = (world, entity, state) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const size = world.metadata.gameEntity[LEVEL].size;
  const heroEntity = getIdentifierAndComponents(world, "hero", [
    PLAYER,
    POSITION,
    EQUIPPABLE,
    STATS,
    SPAWNABLE,
    INVENTORY,
  ]);
  const chestEntity = getIdentifierAndComponents(world, "guide_chest", [STATS]);

  if (!state.args.memory.initialPosition) {
    state.args.memory.initialPosition = copy(entity[POSITION]);
  }

  step({
    stage,
    name: START_STEP,
    onEnter: () => true,
    isCompleted: () => true,
    onLeave: () => "wait",
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

  // attack player if chest is broken
  const stolenItems = world
    .getEntities([IDENTIFIABLE, ITEM])
    .filter(
      (item) =>
        item[IDENTIFIABLE].name === "guide_chest:drop" &&
        item[ITEM].carrier !== world.getEntityId(entity)
    ).length;
  const topLeft = {
    x: roomSize.x * (rooms[1].offsetX - 0.5),
    y: roomSize.y * (rooms[1].offsetY - 0.5),
  };
  const bottomRight = {
    x: roomSize.x * (rooms[1].offsetX + 0.5),
    y: roomSize.y * (rooms[1].offsetY + 0.5),
  };
  const inSameRoom =
    !!heroEntity && within(topLeft, bottomRight, heroEntity[POSITION], size);

  step({
    stage,
    name: "enrage",
    forceEnter: () =>
      !state.args.memory.attacked &&
      !chestEntity &&
      !!heroEntity &&
      !isDead(world, heroEntity) &&
      getDistance(entity[POSITION], heroEntity[POSITION], size) < 5 &&
      inSameRoom,
    onEnter: () => {
      state.args.memory.attacked = true;
      console.log(stolenItems);

      world.removeComponentFromEntity(entity as TypedEntity<"POPUP">, POPUP);

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
        {
          name: "dialog",
          memory: {
            idle: rage,
            override: undefined,
            changed: true,
            dialogs: [],
          },
        },
        {
          name: "wait",
          memory: { ticks: 2 },
        },
        ...Array.from({ length: stolenItems }).map(() => ({
          name: "collect",
          memory: {
            identifier: "guide_chest:drop",
          },
        })),
        {
          name: "move",
          memory: {
            targetPosition: state.args.memory.initialPosition,
          },
        },
      ];
      return true;
    },
    isCompleted: () => !heroEntity || isDead(world, heroEntity),
    onLeave: () => {
      state.args.memory.attacked = false;
      return START_STEP;
    },
  });

  // reset when player leaves room
  step({
    stage,
    name: "reset",
    forceEnter: () =>
      isEnemy(world, entity) &&
      !inSameRoom &&
      !!heroEntity &&
      !isDead(world, heroEntity),
    onEnter: () => {
      state.args.memory.attacked = false;
      entity[BEHAVIOUR].patterns = [
        {
          name: "move",
          memory: {
            targetPosition: state.args.memory.initialPosition,
          },
        },
        {
          name: "dialog",
          memory: {
            idle: rage,
            changed: true,
            override: undefined,
            dialogs: [],
          },
        },
      ];
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
    isCompleted: () => !getAvailableQuest(world, entity),
    onLeave: () => {
      return "focus";
    },
  });

  step({
    stage,
    name: "focus",
    onEnter: () => {
      entity[TOOLTIP].dialogs = [createDialog("RIP")];
      entity[TOOLTIP].override = "visible";
      entity[TOOLTIP].changed = true;

      return true;
    },
    isCompleted: () => !getAvailableQuest(world, entity),
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

        createCell(world, [[]], position, "chest_tower_statue", "hidden");
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
