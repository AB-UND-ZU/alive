import { isTouch } from "../../components/Dimensions";
import { entities } from "../../engine";
import { BEHAVIOUR } from "../../engine/components/behaviour";
import { EQUIPPABLE } from "../../engine/components/equippable";
import { FOG } from "../../engine/components/fog";
import { ITEM } from "../../engine/components/item";
import { LEVEL } from "../../engine/components/level";
import { LIGHT } from "../../engine/components/light";
import { POSITION } from "../../engine/components/position";
import { RENDERABLE } from "../../engine/components/renderable";
import { SPAWNABLE } from "../../engine/components/spawnable";
import { SPRITE } from "../../engine/components/sprite";
import { TOOLTIP } from "../../engine/components/tooltip";
import { VIEWABLE } from "../../engine/components/viewable";
import { getAvailableQuest, isUnlocked } from "../../engine/systems/action";
import { collectItem } from "../../engine/systems/collect";
import { disposeEntity, getCell, moveEntity } from "../../engine/systems/map";
import { rerenderEntity } from "../../engine/systems/renderer";
import { lockDoor, removeFromInventory } from "../../engine/systems/trigger";
import { add, copy, getDistance, normalize, signedDistance } from "../math/std";
import { guidePosition, menuArea } from "../levels/areas";
import { createDialog, fog } from "./sprites";
import { END_STEP, QuestStage, START_STEP, step } from "./utils";
import {
  NpcSequence,
  SEQUENCABLE,
  Sequence,
} from "../../engine/components/sequencable";
import { STATS } from "../../engine/components/stats";
import { CASTABLE } from "../../engine/components/castable";
import { defaultLight } from "../../engine/systems/consume";
import { QUEST } from "../../engine/components/quest";
import {
  assertIdentifier,
  getIdentifier,
  getIdentifierAndComponents,
  setNeedle,
} from "../../engine/utils";
import { dropEntity } from "../../engine/systems/drop";
import { INVENTORY } from "../../engine/components/inventory";
import { LAYER } from "../../engine/components/layer";
import { PLAYER } from "../../engine/components/player";
import { BELONGABLE } from "../../engine/components/belongable";
import { removeShop } from "../../engine/systems/shop";
import { isEnemy } from "../../engine/systems/damage";
import { Deal } from "../../engine/components/popup";

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
  const focusEntity = getIdentifier(world, "focus");
  const doorEntity = getIdentifier(world, "gate");
  const compassEntity = getIdentifierAndComponents(world, "compass", [ITEM]);

  if (!heroEntity || !focusEntity || !doorEntity || !compassEntity) {
    return { finished: stage.finished, updated: stage.updated };
  }

  // clear area if player reached exit
  step({
    stage,
    name: START_STEP,
    isCompleted: () =>
      heroEntity[POSITION].x === 0 && heroEntity[POSITION].y === 5,
    onLeave: () => {
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
          const shouldDiscard = (y < 4 || y > 154) && (x < 11 || x > 149);
          let hasAir = false;
          Object.values(cell).forEach((cellEntity) => {
            // don't remove player and focus, and any unrelated entities
            if (
              cellEntity === heroEntity ||
              cellEntity === focusEntity ||
              cellEntity === entity ||
              cellEntity === spawnEntity ||
              !(RENDERABLE in cellEntity) ||
              CASTABLE in cellEntity
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

      return "town";
    },
  });

  step({
    stage,
    name: "town",
    isCompleted: () =>
      heroEntity &&
      Math.abs(signedDistance(heroEntity[POSITION].x, townPosition.x, size)) <
        townWidth / 2 &&
      Math.abs(signedDistance(heroEntity[POSITION].y, townPosition.y, size)) <
        townHeight / 2,
    onLeave: () => {
      heroEntity[SPAWNABLE].position = add(townPosition, {
        x: 0,
        y: 1,
      });
      const spawnEntity = getIdentifier(world, "spawn");

      if (spawnEntity) {
        moveEntity(world, spawnEntity, heroEntity[SPAWNABLE].position);
        setNeedle(world, spawnEntity);
      }
      return END_STEP;
    },
  });

  return { finished: stage.finished, updated: stage.updated };
};

const greetDelay = 20000;
const greetTime = 3000;

export const guideNpc: Sequence<NpcSequence> = (world, entity, state) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const focusEntity = getIdentifier(world, "focus");
  const doorEntity = getIdentifier(world, "gate");
  const houseDoor = getIdentifierAndComponents(world, "guide_door", [POSITION]);
  const compassEntity = getIdentifier(world, "compass");

  const heroEntity = getIdentifierAndComponents(world, "hero", [
    POSITION,
    EQUIPPABLE,
    STATS,
    SPAWNABLE,
    INVENTORY,
  ]);
  const keyEntity = getIdentifierAndComponents(world, "spawn_key", [ITEM]);
  const chestEntity =
    keyEntity &&
    world.getEntityByIdAndComponents(keyEntity[ITEM].carrier, [STATS]);
  const prismEntity = getIdentifier(world, "spawn_prism");
  const coinEntity = getIdentifier(world, "spawn_prism:drop");

  if (!focusEntity || !doorEntity || !houseDoor || !compassEntity) {
    return { finished: stage.finished, updated: stage.updated };
  }

  // remember initial hero position
  if (!state.args.memory.heroPosition && heroEntity) {
    state.args.memory.heroPosition = copy(heroEntity[POSITION]);
  }

  const hasMoved =
    !!heroEntity &&
    (heroEntity[POSITION].x !== state.args.memory.heroPosition.x ||
      heroEntity[POSITION].y !== state.args.memory.heroPosition.y);

  step({
    stage,
    name: START_STEP,
    onEnter: () => true,
    isCompleted: () => hasMoved,
    onLeave: () => "wait",
  });

  step({
    stage,
    name: "wait",
    onEnter: () => {
      state.args.memory.moved = state.elapsed;
      return true;
    },
    isCompleted: () =>
      isUnlocked(world, houseDoor) ||
      state.elapsed > greetDelay + state.args.memory.moved,
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
          dialogs: [createDialog("Come here!")],
        },
      });
      return true;
    },
    isCompleted: () =>
      isUnlocked(world, houseDoor) ||
      state.elapsed > state.args.memory.greeted + greetTime,
    onLeave: () => "quest",
  });

  step({
    stage,
    name: "door",
    forceEnter: () =>
      !state.args.memory.approachedDoor &&
      !!heroEntity &&
      getDistance(
        heroEntity[POSITION],
        houseDoor[POSITION],
        world.metadata.gameEntity[LEVEL].size,
        1,
        false
      ) <= 1,
    onEnter: () => {
      state.args.memory.approachedDoor = state.elapsed;

      entity[BEHAVIOUR].patterns.push({
        name: "dialog",
        memory: {
          override: "visible",
          dialogs: [createDialog(isTouch ? "Tap on [OPEN]" : "SPACE to open")],
        },
      });
      return true;
    },
    isCompleted: () => isUnlocked(world, houseDoor),
    onLeave: () => "quest",
  });

  step({
    stage,
    name: "quest",
    onEnter: () => {
      entity[BEHAVIOUR].patterns.push({
        name: "dialog",
        memory: {
          override: undefined,
          dialogs: [
            createDialog("Hi stranger"),
            createDialog("I'm the Guide"),
            createDialog("I have a quest"),
            createDialog(isTouch ? "Tap on [QUEST]" : "SPACE to accept"),
          ],
        },
      });
      return true;
    },
    isCompleted: () => !getAvailableQuest(world, entity),
    onLeave: () => "compass",
  });

  step({
    stage,
    name: "compass",
    onEnter: () => {
      // place compass on player spawn
      dropEntity(
        world,
        { [INVENTORY]: { items: [world.getEntityId(compassEntity)] } },
        heroEntity![SPAWNABLE].position,
        true
      );

      // point to player
      setNeedle(world, heroEntity);

      // make visible to trigger focus
      const containerEntity = world.assertByIdAndComponents(
        compassEntity[ITEM]?.carrier,
        [FOG]
      );

      containerEntity[FOG].visibility = "visible";
      containerEntity[FOG].fixed = true;
      rerenderEntity(world, containerEntity);

      entity[BEHAVIOUR].patterns.push({
        name: "dialog",
        memory: {
          override: "visible",
          dialogs: [createDialog("Grab this!")],
        },
      });

      return true;
    },
    isCompleted: () => !!heroEntity && !heroEntity[LAYER]?.structure,
    onLeave: () => {
      entity[BEHAVIOUR].patterns.push({
        name: "dialog",
        memory: {
          override: undefined,
        },
      });

      return "wait_sword";
    },
  });

  step({
    stage,
    name: "sword",
    forceEnter: () =>
      !!heroEntity &&
      !!heroEntity[EQUIPPABLE].compass &&
      !heroEntity[EQUIPPABLE].sword,
    onEnter: () => {
      entity[BEHAVIOUR].patterns.push({
        name: "dialog",
        memory: {
          override: "visible",
          dialogs: [createDialog("Take a stick")],
        },
      });
      return true;
    },
  });

  step({
    stage,
    name: "prism",
    forceEnter: () =>
      !!heroEntity &&
      !!heroEntity[EQUIPPABLE].compass &&
      !!heroEntity[EQUIPPABLE].sword &&
      !!prismEntity &&
      entity[BELONGABLE].faction !== "hostile",
    onEnter: () => {
      entity[BEHAVIOUR].patterns.push({
        name: "dialog",
        memory: {
          override: "visible",
          dialogs: [createDialog("Kill the Prism")],
        },
      });
      return true;
    },
  });

  step({
    stage,
    name: "coin",
    forceEnter: () =>
      !!heroEntity &&
      !!heroEntity[EQUIPPABLE].compass &&
      !!heroEntity[EQUIPPABLE].sword &&
      !prismEntity &&
      !state.args.memory.tradeOffered,
    onEnter: () => {
      entity[BEHAVIOUR].patterns.push({
        name: "dialog",
        memory: {
          override: "visible",
          dialogs: [createDialog("Grab the coin")],
        },
      });
      return true;
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
    name: "trade",
    forceEnter: () =>
      !!heroEntity &&
      !!heroEntity[EQUIPPABLE].compass &&
      !!heroEntity[EQUIPPABLE].sword &&
      !prismEntity &&
      heroEntity[STATS].coin > 0 &&
      !coinEntity &&
      !state.args.memory.tradeOffered,
    onEnter: () => {
      state.args.memory.tradeOffered = true;
      entity[BEHAVIOUR].patterns = [
        {
          name: "dialog",
          memory: {
            override: "visible",
            dialogs: [createDialog("Let's trade")],
          },
        },
        {
          name: "wait",
          memory: {
            ticks: 9,
          },
        },
        {
          name: "dialog",
          memory: {
            override: undefined,
          },
        },
        {
          name: "sell",
          memory: {
            deals: [
              {
                item: assertIdentifier(world, "spawn_key")[ITEM],
                stock: 1,
                price: [{ stat: "coin", amount: 1 }],
              },
              {
                item: { consume: "potion1", material: "fire", amount: 10 },
                stock: 1,
                price: [
                  { stat: "coin", amount: 3 },
                  { stackable: "apple", amount: 1 },
                ],
              },
            ] as Deal[],
          },
        },
      ];
      return true;
    },
    isCompleted: () => !!heroEntity?.[LAYER]?.structure,
    onLeave: () => "close",
  });

  step({
    stage,
    name: "close",
    onEnter: () => {
      entity[BEHAVIOUR].patterns.unshift(
        {
          name: "dialog",
          memory: {
            override: "visible",
            dialogs: [
              createDialog(isTouch ? "[CLOSE] to leave" : "Close with SHIFT"),
            ],
          },
        },
        {
          name: "wait",
          memory: {
            ticks: 9,
          },
        },
        {
          name: "dialog",
          memory: {
            override: undefined,
            dialogs: [createDialog(isTouch ? "Press [SHOP]" : "SPACE to shop")],
          },
        }
      );
      return true;
    },
    isCompleted: () => !!heroEntity?.[PLAYER]?.shopping,
    onLeave: () => "shop",
  });

  step({
    stage,
    name: "shop",
    onEnter: () => {
      entity[BEHAVIOUR].patterns = [
        {
          name: "dialog",
          memory: {
            override: undefined,
            dialogs: [createDialog("Get the key")],
          },
        },
      ];
      return true;
    },
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
      return "gate";
    },
  });

  step({
    stage,
    name: "gate",
    onEnter: () => {
      entity[BEHAVIOUR].patterns = [
        {
          name: "dialog",
          memory: {
            override: undefined,
            dialogs: [createDialog("Unlock the door")],
          },
        },
      ];
      return true;
    },
  });

  // attack player if key is stolen
  step({
    stage,
    name: "enrage",
    forceEnter: () =>
      !!keyEntity &&
      !!heroEntity &&
      keyEntity[ITEM].carrier === world.getEntityId(heroEntity),
    onEnter: () => {
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
          name: "soothe",
          memory: {},
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
            item: keyEntity && world.getEntityId(keyEntity),
          },
        },
        {
          name: "move",
          memory: {
            targetPosition: guidePosition,
          },
        },
      ];
      return true;
    },
    isCompleted: () =>
      entity[POSITION].x === guidePosition.x &&
      entity[POSITION].y === guidePosition.y &&
      !!keyEntity &&
      keyEntity[ITEM].carrier === world.getEntityId(entity),
    onLeave: () => "quest",
  });

  step({
    stage,
    name: "goodbye",
    forceEnter: () => isUnlocked(world, doorEntity) && !isEnemy(world, entity),
    onEnter: () => {
      entity[TOOLTIP].override = "visible";
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].dialogs = [createDialog("Good luck!")];
      entity[TOOLTIP].idle = undefined;
      return true;
    },
  });

  return { finished: stage.finished, updated: stage.updated };
};

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
    getDistance(state.args.memory.initialPosition, heroEntity[POSITION], size) <
      4;
  const outOfRange =
    !!heroEntity &&
    getDistance(state.args.memory.initialPosition, heroEntity[POSITION], size) >
      20;
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
      removeShop(world, entity);

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

const welcomeDistance = 1.3;
export const signNpc: Sequence<NpcSequence> = (world, entity, state) => {
  const stage: QuestStage<NpcSequence> = {
    world,
    entity,
    state,
    finished: false,
    updated: false,
  };

  const heroEntity = getIdentifierAndComponents(world, "hero", [
    POSITION,
    SPAWNABLE,
  ]);
  const size = world.metadata.gameEntity[LEVEL].size;
  const welcomeEntity = getIdentifierAndComponents(world, "welcome", [
    POSITION,
  ]);

  step({
    stage,
    name: START_STEP,
    forceEnter: () => !heroEntity,
    onEnter: () => {
      entity[TOOLTIP].dialogs = [createDialog("Find the town")];
      entity[TOOLTIP].changed = true;

      return true;
    },
    isCompleted: () => !!heroEntity && !getAvailableQuest(world, entity),
    onLeave: () => "idle",
  });

  step({
    stage,
    name: "idle",
    onEnter: () => {
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].dialogs = [createDialog("Follow the arrow")];
      return true;
    },
  });

  // complete if player is now spawning in town
  step({
    stage,
    name: "finish",
    forceEnter: () =>
      !!welcomeEntity &&
      !!heroEntity &&
      getDistance(
        heroEntity[SPAWNABLE].position,
        welcomeEntity[POSITION],
        size
      ) <= welcomeDistance,
    isCompleted: () => true,
    onLeave: () => {
      entity[TOOLTIP].changed = true;
      entity[TOOLTIP].idle = undefined;
      entity[TOOLTIP].dialogs = [];
      entity[QUEST].available = false;
      return END_STEP;
    },
  });

  return { updated: stage.updated, finished: stage.finished };
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
